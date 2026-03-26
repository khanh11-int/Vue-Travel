/**
 * Tạo khóa định danh duy nhất cho item trong giỏ dựa trên loại booking và metadata.
 * @param {Object} item - Cart item đã chuẩn hóa.
 * @returns {string} Identity key dùng để gộp/tìm item trong cart.
 */
export const getCartIdentity = (item) => {
  const bookingType = item.bookingType || 'hotel'
  const startDate = item.startDate || item.travelDate || ''
  const endDate = item.endDate || ''
  const bookingMeta = item.bookingMeta || {}

  if (bookingType === 'hotel') {
    const rooms = Math.max(1, Number(bookingMeta.rooms || 1) || 1)
    return `${bookingType}|${item.serviceId}|${startDate}|${endDate}|rooms:${rooms}`
  }

  if (bookingType === 'tour') {
    return `${bookingType}|${item.serviceId}|${startDate}|dep:${bookingMeta.departureId || ''}`
  }

  return `${bookingType}|${item.serviceId}|${startDate}`
}

/**
 * Sinh chuỗi tóm tắt thông tin đặt chỗ để hiển thị trong card/cart/checkout.
 * @param {Object} item - Cart item hoặc booking item.
 * @returns {string} Chuỗi mô tả booking theo từng loại dịch vụ.
 */
export const buildBookingSummary = (item) => {
  const bookingType = item.bookingType || 'hotel'
  const meta = item.bookingMeta || {}
  const durationSuffix = meta.durationLabel ? ` · ${meta.durationLabel}` : ''

  if (bookingType === 'hotel') {
    return `${meta.checkInDate || item.startDate || 'Chưa chọn ngày'} - ${meta.checkOutDate || item.endDate || 'Chưa chọn ngày'}${durationSuffix} · ${meta.guests || item.quantity} khách · ${meta.rooms || 1} phòng`
  }

  if (bookingType === 'ticket') {
    return `${meta.useDate || item.startDate || 'Chưa chọn ngày'}${durationSuffix} · ${meta.ticketQuantity || item.quantity} vé`
  }

  if (bookingType === 'tour') {
    return `Khởi hành ${meta.departureDate || item.startDate || 'Chưa chọn ngày'}${durationSuffix} · ${meta.travelers || item.quantity} người`
  }

  return `Ngày bắt đầu ${item.startDate || 'Chưa chọn ngày'}${durationSuffix} · ${item.quantity || 1} người`
}

/**
 * Xác định số chỗ tối đa có thể đặt cho item theo loại dịch vụ và lịch đã chọn.
 * @param {Object} service - Service gốc.
 * @param {Object} item - Item mang bookingType và bookingMeta.
 * @returns {number} Số chỗ khả dụng cho item.
 */
export const resolveItemMaxSlots = (service, item) => {
  if (!service || !item) return 0

  const bookingType = item.bookingType || service.categoryId || 'hotel'
  const bookingMeta = item.bookingMeta || {}

  if (bookingType === 'tour') {
    const departureId = bookingMeta.departureId
    if (!departureId) return Number(service.availableSlots || 0)
    const departure = (service.departures || []).find((entry) => entry.departureId === departureId)
    return Number(departure?.remainingSlots || 0)
  }

  return Number(service.availableSlots || 0)
}
