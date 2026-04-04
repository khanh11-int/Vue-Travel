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
import { canUserCancelBooking } from '@/utils/bookingRules'

/**
 * Ép dữ liệu bất kỳ về mảng để giảm xử lý null/undefined ở các bước sau.
 * @param {*} value - Giá trị đầu vào.
 * @returns {Array} Mảng hợp lệ.
 */
const ensureArray = (value) => (Array.isArray(value) ? value : [])

/**
 * Trả về key storage dùng lưu danh sách booking toàn hệ thống.
 * @returns {string} Storage key cho all bookings.
 */
const resolveAllBookingsStorageKey = () => STORAGE_KEYS.bookings

/**
 * Suy ra owner id của booking từ payload customer, fallback guest khi thiếu.
 * @param {Object} booking - Booking cần xác định owner.
 * @returns {string} User id sở hữu booking hoặc guest.
 */
const resolveBookingOwnerId = (booking) => {
  const customerId = booking?.customer?.id ?? booking?.customer?.userId
  return customerId ? String(customerId) : GUEST_SCOPE
}

/**
 * Lấy currentUser từ auth store theo cách an toàn.
 * @param {Object} authStore - Auth store instance.
 * @returns {Object|null} User hiện tại hoặc null.
 */
const resolveCurrentUser = (authStore) => authStore?.currentUser || null

/**
 * Trả về user id hiện tại, fallback từ storage session khi chưa có user trong state.
 * @param {Object} authStore - Auth store instance.
 * @returns {string} User id hiện tại.
 */
const resolveCurrentUserId = (authStore) => {
  const currentUser = resolveCurrentUser(authStore)
  if (currentUser?.id) return String(currentUser.id)
  return getActiveUserId()
}

/**
 * Đọc lịch sử booking theo scoped user từ storage.
 * @param {string} userId - User id cần đọc.
 * @returns {Array<Object>} Danh sách booking theo user.
 */
const readUserScopedBookings = (userId) =>
  ensureArray(readStorage(getScopedKey(STORAGE_KEYS.bookings, userId), []))

/**
 * Persist lịch sử booking theo scoped user.
 * @param {string} userId - User id cần lưu.
 * @param {Array<Object>} bookings - Danh sách booking cần ghi.
 * @returns {void}
 */
const persistUserScopedBookings = (userId, bookings) => {
  persistStorage(getScopedKey(STORAGE_KEYS.bookings, userId), ensureArray(bookings))
}

/**
 * Đọc danh sách booking toàn hệ thống từ storage.
 * @returns {Array<Object>} Danh sách all bookings.
 */
const readAllBookings = () => ensureArray(readStorage(resolveAllBookingsStorageKey(), []))

/**
 * Persist danh sách booking toàn hệ thống.
 * @param {Array<Object>} bookings - Danh sách booking cần lưu.
 * @returns {void}
 */
const persistAllBookings = (bookings) => {
  persistStorage(resolveAllBookingsStorageKey(), ensureArray(bookings))
}

/**
 * Cập nhật đồng thời status và statusLabel của booking.
 * @param {Object} booking - Booking hiện tại.
 * @param {string} status - Trạng thái mới.
 * @returns {Object} Booking sau khi cập nhật trạng thái.
 */
const updateBookingStatusLabel = (booking, status) => ({
  ...booking,
  status,
  statusLabel: BOOKING_STATUS_LABELS[status] || booking.statusLabel || status
})

/**
 * Tinh line total uu tien snapshot trong bookingMeta, fallback gia service.
 * @param {Object} item - Booking item can tinh.
 * @returns {number} Tong tien dong item.
 */
const resolveItemLineTotal = (item = {}) => {
  const quantity = Math.max(1, Number(item.quantity || 1) || 1)
  const snapshotTotal = Number(item.bookingMeta?.totalPrice || 0)
  if (snapshotTotal > 0) return snapshotTotal

  const snapshotUnitPrice = Number(item.bookingMeta?.unitPrice || 0)
  if (snapshotUnitPrice > 0) return snapshotUnitPrice * quantity

  return (Number(item.service?.salePrice || 0) || 0) * quantity
}

export const useBookingStore = defineStore('travelBooking', {
  /**
   * Khởi tạo booking state theo user scope hiện tại và dữ liệu all bookings.
   * @returns {Object} Booking state ban đầu.
   */
  state: () => {
    const authStore = useAuthStore()
    const currentUserId = resolveCurrentUserId(authStore)

    return {
      bookings: readUserScopedBookings(currentUserId),
      allBookings: readAllBookings(),
      guestLookupResults: [],
      loading: false,
      error: null
    }
  },

  getters: {
    /**
     * Trả lịch sử booking của user hiện tại theo thứ tự mới nhất trước.
     * @param {Object} state - Booking state.
     * @returns {Array<Object>} Booking history của user.
     */
    bookingHistory(state) {
      return sortByCreatedAtDesc(state.bookings)
    },

    /**
     * Trả lịch sử booking toàn hệ thống theo thứ tự mới nhất trước.
     * @param {Object} state - Booking state.
     * @returns {Array<Object>} Lịch sử booking cho admin.
     */
    adminBookingHistory(state) {
      return sortByCreatedAtDesc(state.allBookings)
    }
  },

  actions: {
    /**
     * Đồng bộ lại lịch sử booking theo user scope hiện tại.
     * @returns {string} User id đang active sau khi sync.
     */
    syncUserScope() {
      const authStore = useAuthStore()
      const currentUserId = resolveCurrentUserId(authStore)
      this.bookings = readUserScopedBookings(currentUserId)
      return currentUserId
    },

    /**
     * Tạo booking mới, trừ slot dịch vụ liên quan, lưu cả scoped + global booking.
     * Side effect: cập nhật service store, ghi localStorage, gọi API nền.
     * @param {Object} payload - Dữ liệu checkout cần tạo booking.
     * @returns {Object} Booking vừa tạo.
     */
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
      const sanitizedItems = ensureArray(items).map((item) => ({
        ...item,
        lineTotal: resolveItemLineTotal(item)
      }))
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

    /**
     * Tải booking của user hiện tại từ API, fallback sang storage khi lỗi mạng.
     * @returns {Promise<void>}
     */
    async fetchMyBookings() {
      this.loading = true
      this.error = null
      const currentUserId = this.syncUserScope()

      try {
        const apiBookings = await bookingsApi.getAll({ 'customer.userId': currentUserId })
        const normalizedApiBookings = ensureArray(apiBookings)

        if (normalizedApiBookings.length) {
          this.bookings = sortByCreatedAtDesc(normalizedApiBookings)
          persistUserScopedBookings(currentUserId, this.bookings)
        } else {
          this.bookings = sortByCreatedAtDesc(readUserScopedBookings(currentUserId))
        }
      } catch (error) {
        this.error = error?.message || 'Không thể tải lịch sử đặt chỗ.'
        this.bookings = readUserScopedBookings(currentUserId)
      } finally {
        this.loading = false
      }
    },

    /**
     * Tra cuu booking cho guest theo ma hoac so dien thoai tai API layer.
     * @param {Object} payload - Dieu kien tra cuu.
     * @param {string} payload.code - Ma booking.
     * @param {string} payload.phone - So dien thoai.
     * @returns {Promise<Array<Object>>} Ket qua booking da sap xep.
     */
    async lookupGuestBookings({ code = '', phone = '' } = {}) {
      this.loading = true
      this.error = null

      try {
        const foundBookings = await bookingsApi.lookupGuest({ code, phone })
        this.guestLookupResults = sortByCreatedAtDesc(ensureArray(foundBookings))
        return this.guestLookupResults
      } catch (error) {
        this.error = error?.message || 'Không thể tra cứu booking.'
        this.guestLookupResults = []
        return []
      } finally {
        this.loading = false
      }
    },

    /**
     * Tải booking toàn hệ thống từ API cho màn admin, fallback storage khi lỗi.
     * @returns {Promise<void>}
     */
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

    /**
     * Cập nhật trạng thái booking và hoàn slot về dịch vụ nếu chuyển sang cancelled.
     * Side effect: ghi lại scoped/global storage và đồng bộ API nền.
     * @param {number|string} bookingId - Id booking cần cập nhật.
     * @param {string} status - Trạng thái mới.
     * @returns {void}
     */
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

    /**
     * Shortcut hủy booking bằng cách cập nhật trạng thái cancelled.
     * @param {number|string} bookingId - Id booking cần hủy.
     * @returns {void}
     */
    cancelBooking(bookingId) {
      const authStore = useAuthStore()
      const currentUser = resolveCurrentUser(authStore)
      const booking = this.allBookings.find((entry) => entry.id === bookingId) || this.bookings.find((entry) => entry.id === bookingId)

      if (!canUserCancelBooking(booking, currentUser)) return false

      this.updateBookingStatus(bookingId, 'cancelled')
      return true
    }
  }
})
