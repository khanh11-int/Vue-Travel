export const BOOKING_STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  completed: 'Hoàn thành',
  cancelled: 'Hủy'
}

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

  if (bookingType === 'combo' && service.isFixedSchedule !== false && bookingMeta.packageId) {
    nextService.packages = (service.packages || []).map((pkg) =>
      pkg.packageId === bookingMeta.packageId
        ? { ...pkg, remainingSlots: Math.max(0, Number(pkg.remainingSlots || 0) + delta) }
        : pkg
    )
  }

  return nextService
}

export const fireAndForget = (promiseFactory) => {
  Promise.resolve()
    .then(() => promiseFactory())
    .catch(() => {})
}

export const sortByCreatedAtDesc = (bookings = []) =>
  [...bookings].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))

export const upsertBooking = (bookings, booking) => {
  const normalizedBookings = Array.isArray(bookings) ? bookings : []
  const index = normalizedBookings.findIndex((entry) => entry.id === booking.id)
  if (index === -1) return [booking, ...normalizedBookings]

  const next = [...normalizedBookings]
  next[index] = booking
  return next
}
