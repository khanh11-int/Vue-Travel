export const BOOKING_STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  completed: 'Hoàn thành',
  cancelled: 'Hủy'
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
  const nextService = {
    ...service,
    availableSlots: Math.max(0, Number(service.availableSlots || 0) + delta)
  }

  if (bookingType === 'tour' && bookingMeta.departureId) {
    nextService.departures = (service.departures || []).map((departure) =>
      departure.departureId === bookingMeta.departureId
        ? { ...departure, remainingSlots: Math.max(0, Number(departure.remainingSlots || 0) + delta) }
        : departure
    )
  }

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
