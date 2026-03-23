import { defineStore } from 'pinia'
import { bookingsApi, servicesApi } from '@/services/api'
import { useAuthStore } from '@/stores/useAuthStore'
import { useServiceStore } from '@/stores/useServiceStore'
import {
  BOOKING_STATUS_LABELS,
  applyServiceSlotDelta,
  fireAndForget,
  sortByCreatedAtDesc,
  upsertBooking
} from '@/utils/travelBooking'
import {
  STORAGE_KEYS,
  GUEST_SCOPE,
  getActiveUserId,
  getScopedKey,
  persistStorage,
  readStorage
} from '@/utils/travelStorage'

const ensureArray = (value) => (Array.isArray(value) ? value : [])
const resolveAllBookingsStorageKey = () => STORAGE_KEYS.bookings

const resolveBookingOwnerId = (booking) => {
  const customerId = booking?.customer?.id ?? booking?.customer?.userId
  return customerId ? String(customerId) : GUEST_SCOPE
}

const resolveCurrentUser = (authStore) => authStore?.currentUser || null

const resolveCurrentUserId = (authStore) => {
  const currentUser = resolveCurrentUser(authStore)
  if (currentUser?.id) return String(currentUser.id)
  return getActiveUserId()
}

const readUserScopedBookings = (userId) =>
  ensureArray(readStorage(getScopedKey(STORAGE_KEYS.bookings, userId), []))

const persistUserScopedBookings = (userId, bookings) => {
  persistStorage(getScopedKey(STORAGE_KEYS.bookings, userId), ensureArray(bookings))
}

const readAllBookings = () => ensureArray(readStorage(resolveAllBookingsStorageKey(), []))

const persistAllBookings = (bookings) => {
  persistStorage(resolveAllBookingsStorageKey(), ensureArray(bookings))
}

const updateBookingStatusLabel = (booking, status) => ({
  ...booking,
  status,
  statusLabel: BOOKING_STATUS_LABELS[status] || booking.statusLabel || status
})

export const useBookingStore = defineStore('travelBooking', {
  state: () => {
    const authStore = useAuthStore()
    const currentUserId = resolveCurrentUserId(authStore)

    return {
      bookings: readUserScopedBookings(currentUserId),
      allBookings: readAllBookings(),
      loading: false,
      error: null
    }
  },

  getters: {
    bookingHistory(state) {
      return sortByCreatedAtDesc(state.bookings)
    },

    adminBookingHistory(state) {
      return sortByCreatedAtDesc(state.allBookings)
    }
  },

  actions: {
    syncUserScope() {
      const authStore = useAuthStore()
      const currentUserId = resolveCurrentUserId(authStore)
      this.bookings = readUserScopedBookings(currentUserId)
      return currentUserId
    },

    createBooking({
      customer,
      items,
      subtotal,
      serviceFee,
      total,
      discount = 0,
      promotion = null,
      clearCartAfterBooking = true,
      clearPromotionAfterBooking = true
    }) {
      const authStore = useAuthStore()
      const serviceStore = useServiceStore()
      // Keep arguments for backward-compatible call signatures.
      void clearCartAfterBooking
      void clearPromotionAfterBooking

      const currentUser = resolveCurrentUser(authStore)
      const currentUserId = this.syncUserScope()
      const sanitizedItems = ensureArray(items)
      const now = Date.now()
      const createdAt = new Date().toISOString()
      const customerPayload = {
        ...(customer || {}),
        id: customer?.id ?? currentUser?.id ?? undefined,
        userId: customer?.userId ?? currentUser?.id ?? currentUserId
      }

      const booking = {
        id: now,
        code: `VV${now.toString().slice(-6)}`,
        customer: customerPayload,
        items: sanitizedItems,
        subtotal,
        discount,
        serviceFee,
        total,
        promotion,
        status: 'pending',
        statusLabel: 'Chờ xác nhận',
        createdAt,
        visible: true
      }

      const services = Array.isArray(serviceStore.services) ? serviceStore.services : []
      const nextServices = services.map((service) => {
        const relatedItems = sanitizedItems.filter((entry) => String(entry.serviceId) === String(service.id))
        if (!relatedItems.length) return service

        return relatedItems.reduce(
          (currentService, item) => applyServiceSlotDelta(currentService, item, -Math.max(0, Number(item.quantity || 0))),
          service
        )
      })

      this.bookings = upsertBooking(this.bookings, booking)
      this.allBookings = upsertBooking(this.allBookings, booking)

      persistUserScopedBookings(currentUserId, this.bookings)
      persistAllBookings(this.allBookings)
      serviceStore.setServices(nextServices)

      fireAndForget(() => bookingsApi.create(booking))
      fireAndForget(() => Promise.all(nextServices.map((service) => servicesApi.update(service.id, service))))

      return booking
    },

    async fetchMyBookings() {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()
      const currentUserId = this.syncUserScope()

      try {
        const apiBookings = await bookingsApi.getAll()
        const normalizedApiBookings = ensureArray(apiBookings)

        if (normalizedApiBookings.length) {
          this.allBookings = sortByCreatedAtDesc(normalizedApiBookings)
          persistAllBookings(this.allBookings)
        } else {
          this.allBookings = sortByCreatedAtDesc(readAllBookings())
        }

        this.bookings = this.allBookings.filter((booking) => {
          const ownerId = resolveBookingOwnerId(booking)
          if (ownerId !== GUEST_SCOPE) return ownerId === currentUserId

          const activeUserId = resolveCurrentUserId(authStore)
          return activeUserId === GUEST_SCOPE
        })

        persistUserScopedBookings(currentUserId, this.bookings)
      } catch (error) {
        this.error = error?.message || 'Không thể tải lịch sử đặt chỗ.'
        this.bookings = readUserScopedBookings(currentUserId)
        this.allBookings = readAllBookings()
      } finally {
        this.loading = false
      }
    },

    async fetchAllBookings() {
      this.loading = true
      this.error = null
      this.syncUserScope()

      try {
        const apiBookings = await bookingsApi.getAll()
        const normalizedApiBookings = ensureArray(apiBookings)

        if (normalizedApiBookings.length) {
          this.allBookings = sortByCreatedAtDesc(normalizedApiBookings)
          persistAllBookings(this.allBookings)
        } else {
          this.allBookings = sortByCreatedAtDesc(readAllBookings())
        }
      } catch (error) {
        this.error = error?.message || 'Không thể tải danh sách booking.'
        this.allBookings = readAllBookings()
      } finally {
        this.loading = false
      }
    },

    updateBookingStatus(bookingId, status) {
      const currentUserId = this.syncUserScope()

      const existing =
        this.allBookings.find((booking) => booking.id === bookingId)
        || this.bookings.find((booking) => booking.id === bookingId)

      if (!existing || existing.status === 'completed' || existing.status === status) return

      const shouldRestoreSlots = status === 'cancelled' && existing.status !== 'cancelled'

      if (shouldRestoreSlots) {
        const serviceStore = useServiceStore()
        const services = Array.isArray(serviceStore.services) ? serviceStore.services : []
        const nextServices = services.map((service) => {
          const relatedItems = existing.items.filter((entry) => String(entry.serviceId) === String(service.id))
          if (!relatedItems.length) return service

          return relatedItems.reduce(
            (currentService, item) => applyServiceSlotDelta(currentService, item, Math.max(0, Number(item.quantity || 0))),
            service
          )
        })

        serviceStore.setServices(nextServices)
        fireAndForget(() => Promise.all(nextServices.map((service) => servicesApi.update(service.id, service))))
      }

      this.bookings = this.bookings.map((booking) =>
        booking.id === bookingId ? updateBookingStatusLabel(booking, status) : booking
      )
      this.allBookings = this.allBookings.map((booking) =>
        booking.id === bookingId ? updateBookingStatusLabel(booking, status) : booking
      )

      const ownerId = resolveBookingOwnerId(existing)
      persistUserScopedBookings(ownerId, this.allBookings.filter((booking) => resolveBookingOwnerId(booking) === ownerId))
      if (ownerId === currentUserId) {
        persistUserScopedBookings(currentUserId, this.bookings)
      }
      persistAllBookings(this.allBookings)

      const updatedBooking = this.allBookings.find((booking) => booking.id === bookingId)
      if (updatedBooking) {
        fireAndForget(() => bookingsApi.update(bookingId, updatedBooking))
      }
    },

    cancelBooking(bookingId) {
      this.updateBookingStatus(bookingId, 'cancelled')
    }
  }
})
