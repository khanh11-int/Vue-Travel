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

  if (bookingType === 'combo') {
    return `${bookingType}|${item.serviceId}|${startDate}|pkg:${bookingMeta.packageId || ''}|dep:${bookingMeta.departureId || ''}`
  }

  return `${bookingType}|${item.serviceId}|${startDate}`
}

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

  return `Áp dụng ${meta.applyDate || item.startDate || 'Chưa chọn ngày'}${durationSuffix} · ${meta.travelers || item.quantity} người`
}

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

  if (bookingType === 'combo' && service.isFixedSchedule !== false) {
    const packageId = bookingMeta.packageId
    if (!packageId) return Number(service.availableSlots || 0)
    const selectedPackage = (service.packages || []).find((entry) => entry.packageId === packageId)
    return Number(selectedPackage?.remainingSlots || 0)
  }

  return Number(service.availableSlots || 0)
}
