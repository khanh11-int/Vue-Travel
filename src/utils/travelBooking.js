export const BOOKING_STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  'checked-in': 'Đã nhận phòng',
  'checked-out': 'Đã trả phòng',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy'
}

/**
 * Cập nhật số chỗ khả dụng của service và lịch con (tour) theo biến động delta.
 * @param {Object} service - Service hiện tại.
 * @param {Object} item - Mục booking/cart liên quan tới service.
 * @param {number} delta - Mức thay đổi số chỗ (âm khi đặt, dương khi hoàn slot).
 * @returns {Object} Service mới sau khi cập nhật slot.
 */
export const applyServiceSlotDelta = (service, item, delta) => {
  if (!item || item.serviceId !== service.id) return service

  const bookingType = item.bookingType || service.categoryId || 'hotel'
  const bookingMeta = item.bookingMeta || {}
  const nextService = { ...service }

  if (bookingType === 'hotel') {
    const roomType = String(bookingMeta.roomType || '').trim().toLowerCase()
    if (roomType && Array.isArray(service.roomTypes) && service.roomTypes.length) {
      nextService.roomTypes = service.roomTypes.map((entry) => {
        const value = String(entry?.value || '').trim().toLowerCase()
        if (value !== roomType) return entry
        return {
          ...entry,
          availableSlots: Math.max(0, Number(entry.availableSlots || 0) + delta)
        }
      })
      nextService.availableSlots = nextService.roomTypes.reduce(
        (sum, entry) => sum + Math.max(0, Number(entry?.availableSlots || 0)),
        0
      )
      return nextService
    }

    nextService.availableSlots = Math.max(0, Number(service.availableSlots || 0) + delta)
    return nextService
  }

  if (bookingType === 'ticket') {
    const packageId = String(bookingMeta.packageId || '').trim().toLowerCase()
    if (packageId && Array.isArray(service.ticketPackages) && service.ticketPackages.length) {
      nextService.ticketPackages = service.ticketPackages.map((entry) => {
        const id = String(entry?.id || '').trim().toLowerCase()
        if (id !== packageId) return entry
        return {
          ...entry,
          availableSlots: Math.max(0, Number(entry.availableSlots || 0) + delta)
        }
      })
      nextService.availableSlots = nextService.ticketPackages.reduce(
        (sum, entry) => sum + Math.max(0, Number(entry?.availableSlots || 0)),
        0
      )
      return nextService
    }

    nextService.availableSlots = Math.max(0, Number(service.availableSlots || 0) + delta)
    return nextService
  }

  if (bookingType === 'tour') {
    const scheduleMode = String(bookingMeta.scheduleMode || service.scheduleType || 'fixed').toLowerCase()
    if (scheduleMode === 'flexible') {
      // Flexible tours do not decrement a global slot counter.
      return service
    }

    if (bookingMeta.departureId) {
      nextService.departures = (service.departures || []).map((departure) =>
        departure.departureId === bookingMeta.departureId
          ? { ...departure, remainingSlots: Math.max(0, Number(departure.remainingSlots || 0) + delta) }
          : departure
      )
      nextService.availableSlots = (nextService.departures || []).reduce(
        (sum, departure) => sum + Math.max(0, Number(departure?.remainingSlots || 0)),
        0
      )
      return nextService
    }

    nextService.availableSlots = Math.max(0, Number(service.availableSlots || 0) + delta)
    return nextService
  }

  nextService.availableSlots = Math.max(0, Number(service.availableSlots || 0) + delta)
  return nextService
}

/**
 * Chạy promise không chặn luồng chính và bỏ qua lỗi để không làm vỡ UX cục bộ.
 * @param {Function} promiseFactory - Hàm tạo promise khi cần đồng bộ nền.
 * @returns {void}
 */
export const fireAndForget = (promiseFactory) => {
  Promise.resolve()
    .then(() => promiseFactory())
    .catch(() => {})
}

/**
 * Sắp xếp booking mới nhất lên đầu theo thời điểm tạo.
 * @param {Array<Object>} bookings - Danh sách booking cần sắp xếp.
 * @returns {Array<Object>} Danh sách đã sắp xếp giảm dần theo createdAt.
 */
export const sortByCreatedAtDesc = (bookings = []) =>
  [...bookings].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))

/**
 * Chèn mới hoặc cập nhật booking theo id, giữ cấu trúc mảng ổn định cho store.
 * @param {Array<Object>} bookings - Danh sách booking hiện tại.
 * @param {Object} booking - Booking mới hoặc cần cập nhật.
 * @returns {Array<Object>} Danh sách booking sau khi upsert.
 */
export const upsertBooking = (bookings, booking) => {
  const normalizedBookings = Array.isArray(bookings) ? bookings : []
  const index = normalizedBookings.findIndex((entry) => entry.id === booking.id)
  if (index === -1) return [booking, ...normalizedBookings]

  const next = [...normalizedBookings]
  next[index] = booking
  return next
}

/**
 * Xác định các trạng thái hợp lệ tiếp theo dựa trên trạng thái hiện tại và loại dịch vụ.
 * @param {string} currentStatus - Trạng thái hiện tại của booking.
 * @param {string} bookingType - Loại dịch vụ: 'hotel', 'tour', hoặc 'ticket'.
 * @returns {Array<string>} Danh sách trạng thái hợp lệ tiếp theo.
 */
export const getValidNextStatuses = (currentStatus, bookingType = 'hotel') => {
  const normalizedType = String(bookingType || 'hotel').toLowerCase()

  // Terminal states - không có transition tiếp theo
  if (currentStatus === 'completed' || currentStatus === 'cancelled') {
    return []
  }

  // Hotel workflow
  if (normalizedType === 'hotel') {
    const hotelStatusFlow = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['checked-in', 'cancelled'],
      'checked-in': ['checked-out', 'cancelled'],
      'checked-out': ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    }
    return hotelStatusFlow[currentStatus] || []
  }

  // Tour/Ticket workflow
  const tourTicketStatusFlow = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  }
  return tourTicketStatusFlow[currentStatus] || []
}
