import { defineStore } from 'pinia'
import { bookingsApi, servicesApi } from '@/services/api'
import { getTravelContextStore as useTravelContextStore } from '@/stores/getTravelContextStore'
import { useTravelCartStore } from '@/stores/useCartStore'
import {
  BOOKING_STATUS_LABELS,
  STORAGE_KEYS,
  applyServiceSlotDelta,
  fireAndForget
} from '@/stores/travelShared'

const sortByCreatedAtDesc = (bookings = []) =>
  [...bookings].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))

const upsertBooking = (bookings, booking) => {
  const normalizedBookings = Array.isArray(bookings) ? bookings : []
  const index = normalizedBookings.findIndex((entry) => entry.id === booking.id)
  if (index === -1) return [booking, ...normalizedBookings]

  const next = [...normalizedBookings]
  next[index] = booking
  return next
}

export const useBookingStore = defineStore('travelBooking', {
  state: () => ({}),

  getters: {
    bookingHistory() {
      const contextStore = useTravelContextStore()
      return sortByCreatedAtDesc(contextStore.state.bookings)
    },

    adminBookingHistory() {
      const contextStore = useTravelContextStore()
      return sortByCreatedAtDesc(contextStore.state.allBookings)
    }
  },

  actions: {
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
      const contextStore = useTravelContextStore()
      const cartStore = useTravelCartStore()
      contextStore.syncScopeFromSession()

      const booking = {
        id: Date.now(),
        code: `VV${Date.now().toString().slice(-6)}`,
        customer,
        items,
        subtotal,
        discount,
        serviceFee,
        total,
        promotion,
        status: 'pending',
        statusLabel: 'Chờ xác nhận',
        createdAt: new Date().toISOString(),
        visible: true
      }

      contextStore.state.services = contextStore.state.services.map((service) => {
        const relatedItems = items.filter((entry) => String(entry.serviceId) === String(service.id))
        if (!relatedItems.length) return service

        return relatedItems.reduce(
          (currentService, item) => applyServiceSlotDelta(currentService, item, -Math.max(0, Number(item.quantity || 0))),
          service
        )
      })

      contextStore.state.bookings = [booking, ...contextStore.state.bookings]
      contextStore.state.allBookings = upsertBooking(contextStore.state.allBookings, booking)
      contextStore.persistServices()
      contextStore.persistScoped(STORAGE_KEYS.bookings, contextStore.state.bookings)
      contextStore.persistAllBookings()

      fireAndForget(() => bookingsApi.create(booking))
      fireAndForget(() => Promise.all(contextStore.state.services.map((service) => servicesApi.update(service.id, service))))

      if (clearPromotionAfterBooking) {
        cartStore.clearAppliedPromotion()
      }

      if (clearCartAfterBooking) {
        cartStore.clearCart()
      }

      return booking
    },

    updateBookingStatus(bookingId, status) {
      const contextStore = useTravelContextStore()
      contextStore.syncScopeFromSession()

      const existing =
        contextStore.state.allBookings.find((booking) => booking.id === bookingId)
        || contextStore.state.bookings.find((booking) => booking.id === bookingId)

      if (!existing || existing.status === 'completed' || existing.status === status) return

      const shouldRestoreSlots = status === 'cancelled' && existing.status !== 'cancelled'

      if (shouldRestoreSlots) {
        contextStore.state.services = contextStore.state.services.map((service) => {
          const relatedItems = existing.items.filter((entry) => String(entry.serviceId) === String(service.id))
          if (!relatedItems.length) return service

          return relatedItems.reduce(
            (currentService, item) => applyServiceSlotDelta(currentService, item, Math.max(0, Number(item.quantity || 0))),
            service
          )
        })
        contextStore.persistServices()
        fireAndForget(() => Promise.all(contextStore.state.services.map((service) => servicesApi.update(service.id, service))))
      }

      contextStore.state.bookings = contextStore.state.bookings.map((booking) =>
        booking.id === bookingId
          ? { ...booking, status, statusLabel: BOOKING_STATUS_LABELS[status] || booking.statusLabel }
          : booking
      )
      contextStore.state.allBookings = contextStore.state.allBookings.map((booking) =>
        booking.id === bookingId
          ? { ...booking, status, statusLabel: BOOKING_STATUS_LABELS[status] || booking.statusLabel }
          : booking
      )

      contextStore.persistScoped(STORAGE_KEYS.bookings, contextStore.state.bookings)
      contextStore.persistAllBookings()

      const updatedBooking = contextStore.state.allBookings.find((booking) => booking.id === bookingId)
      if (updatedBooking) {
        fireAndForget(() => bookingsApi.update(bookingId, updatedBooking))
      }
    }
  }
})
