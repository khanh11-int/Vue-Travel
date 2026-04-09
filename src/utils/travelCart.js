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
    const roomType = String(bookingMeta.roomType || '').trim().toLowerCase() || 'default'
    return `${bookingType}|${item.serviceId}|${startDate}|${endDate}|rooms:${rooms}|roomType:${roomType}`
  }

  if (bookingType === 'tour') {
    const scheduleMode = bookingMeta.scheduleMode || 'fixed'
    const flexibleEndDate = bookingMeta.endDate || endDate || ''
    return `${bookingType}|${item.serviceId}|mode:${scheduleMode}|${startDate}|${flexibleEndDate}|dep:${bookingMeta.departureId || ''}`
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
    const adults = Math.max(1, Number(meta.adults || Math.max(1, (meta.guests || item.quantity || 1) - Number(meta.children || 0))) || 1)
    const children = Math.max(0, Number(meta.children || 0) || 0)
    const roomTypeText = meta.roomType ? ` · ${meta.roomType}` : ''
    return `${meta.checkInDate || item.startDate || 'Chưa chọn ngày'} - ${meta.checkOutDate || item.endDate || 'Chưa chọn ngày'}${durationSuffix} · ${adults} người lớn · ${children} trẻ em · ${meta.rooms || 1} phòng${roomTypeText}`
  }

  if (bookingType === 'ticket') {
    const adults = Math.max(1, Number(meta.adults || 1) || 1)
    const children = Math.max(0, Number(meta.children || 0) || 0)
    const chargeableTickets = Math.max(1, Number(meta.ticketQuantity || 1) || 1)
    return `${meta.useDate || item.startDate || 'Chưa chọn ngày'}${durationSuffix} · ${adults} người lớn · ${children} trẻ em · ${chargeableTickets} vé tính phí`
  }

  if (bookingType === 'tour') {
    const adults = Math.max(1, Number(meta.adults || 1) || 1)
    const children = Math.max(0, Number(meta.children || 0) || 0)
    if (meta.scheduleMode === 'flexible') {
      return `Linh hoạt ${meta.departureDate || item.startDate || 'Chưa chọn ngày'} - ${meta.endDate || item.endDate || 'Chưa chọn ngày'}${durationSuffix} · ${adults} người lớn · ${children} trẻ em`
    }
    return `Khởi hành ${meta.departureDate || item.startDate || 'Chưa chọn ngày'}${durationSuffix} · ${adults} người lớn · ${children} trẻ em`
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

  if (bookingType === 'hotel') {
    const roomType = String(bookingMeta.roomType || '').trim().toLowerCase()
    const roomTypes = Array.isArray(service.roomTypes) ? service.roomTypes : []
    if (roomType && roomTypes.length) {
      const matched = roomTypes.find((entry) => String(entry?.value || '').trim().toLowerCase() === roomType)
      if (matched) return Math.max(0, Number(matched.availableSlots || 0))
    }
    return Math.max(0, Number(service.availableSlots || 0))
  }

  if (bookingType === 'ticket') {
    const packageId = String(bookingMeta.packageId || '').trim().toLowerCase()
    const packages = Array.isArray(service.ticketPackages) ? service.ticketPackages : []
    if (packageId && packages.length) {
      const matched = packages.find((entry) => String(entry?.id || '').trim().toLowerCase() === packageId)
      if (matched) return Math.max(0, Number(matched.availableSlots || 0))
    }
    return Math.max(0, Number(service.availableSlots || 0))
  }

  if (bookingType === 'tour') {
    const scheduleMode = String(bookingMeta.scheduleMode || service.scheduleType || 'fixed').toLowerCase()
    if (scheduleMode === 'flexible') return Number.MAX_SAFE_INTEGER
    const departureId = bookingMeta.departureId
    if (!departureId) return Math.max(0, Number(service.availableSlots || 0))
    const departure = (service.departures || []).find((entry) => entry.departureId === departureId)
    return Math.max(0, Number(departure?.remainingSlots || 0))
  }

  return Math.max(0, Number(service.availableSlots || 0))
}
