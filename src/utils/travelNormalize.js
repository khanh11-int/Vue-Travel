import { serviceRequiresEndDate } from '@/utils/bookingRules'

export const getBookingType = (service, item = null) => {
  if (item?.bookingType) return item.bookingType
  return service?.categoryId || 'hotel'
}

export const buildBookingMeta = ({ bookingType, startDate = '', endDate = '', quantity = 1, bookingMeta = {} }) => {
  const normalizedQuantity = Math.max(1, Number(quantity) || 1)

  if (bookingType === 'hotel') {
    return {
      checkInDate: bookingMeta.checkInDate || startDate || '',
      checkOutDate: bookingMeta.checkOutDate || endDate || '',
      guests: Math.max(1, Number(bookingMeta.guests ?? normalizedQuantity) || 1),
      rooms: Math.max(1, Number(bookingMeta.rooms ?? 1) || 1),
      durationLabel: bookingMeta.durationLabel || '',
      unitPrice: Number(bookingMeta.unitPrice || 0) || 0
    }
  }

  if (bookingType === 'ticket') {
    return {
      useDate: bookingMeta.useDate || startDate || '',
      ticketQuantity: Math.max(1, Number(bookingMeta.ticketQuantity ?? normalizedQuantity) || 1),
      durationLabel: bookingMeta.durationLabel || '',
      unitPrice: Number(bookingMeta.unitPrice || 0) || 0
    }
  }

  if (bookingType === 'tour') {
    return {
      departureId: bookingMeta.departureId || '',
      departureDate: bookingMeta.departureDate || startDate || '',
      travelers: Math.max(1, Number(bookingMeta.travelers ?? normalizedQuantity) || 1),
      durationLabel: bookingMeta.durationLabel || '',
      unitPrice: Number(bookingMeta.unitPrice || 0) || 0
    }
  }

  return {
    packageId: bookingMeta.packageId || '',
    departureId: bookingMeta.departureId || '',
    applyDate: bookingMeta.applyDate || startDate || '',
    travelers: Math.max(1, Number(bookingMeta.travelers ?? normalizedQuantity) || 1),
    durationLabel: bookingMeta.durationLabel || '',
    unitPrice: Number(bookingMeta.unitPrice || 0) || 0
  }
}

export const extractDateRangeFromBookingMeta = (bookingType, bookingMeta) => {
  if (bookingType === 'hotel') {
    return {
      startDate: bookingMeta.checkInDate || '',
      endDate: bookingMeta.checkOutDate || ''
    }
  }

  if (bookingType === 'ticket') {
    return {
      startDate: bookingMeta.useDate || '',
      endDate: ''
    }
  }

  if (bookingType === 'tour') {
    return {
      startDate: bookingMeta.departureDate || '',
      endDate: ''
    }
  }

  return {
    startDate: bookingMeta.applyDate || '',
    endDate: ''
  }
}

export const extractQuantityFromBookingMeta = (bookingType, bookingMeta) => {
  if (bookingType === 'hotel') return Math.max(1, Number(bookingMeta.guests || 1) || 1)
  if (bookingType === 'ticket') return Math.max(1, Number(bookingMeta.ticketQuantity || 1) || 1)
  return Math.max(1, Number(bookingMeta.travelers || 1) || 1)
}

export const normalizeServicesFromStorage = (services = []) => {
  if (!Array.isArray(services)) return []

  return services.map((service) => {
    const nextService = { ...service }

    if (nextService.categoryId === 'tour' && !Array.isArray(nextService.departures)) {
      nextService.departures = []
    }

    if (nextService.categoryId === 'combo') {
      if (!Array.isArray(nextService.packages)) {
        nextService.packages = []
      }
      if (typeof nextService.isFixedSchedule !== 'boolean') {
        nextService.isFixedSchedule = nextService.packages.length > 0
      }
    }

    return nextService
  })
}

export const normalizeCartItem = (item, services) => {
  const service = services.find((entry) => entry.id === item.serviceId)
  const bookingType = getBookingType(service, item)
  const fallbackStartDate = item.startDate || item.travelDate || ''
  const fallbackEndDate = serviceRequiresEndDate(service) ? (item.endDate || '') : ''
  const inferredQuantity = Math.max(1, Number(item.quantity) || 1)

  const normalizedMeta = buildBookingMeta({
    bookingType,
    startDate: fallbackStartDate,
    endDate: fallbackEndDate,
    quantity: inferredQuantity,
    bookingMeta: item.bookingMeta || {}
  })
  const derivedDates = extractDateRangeFromBookingMeta(bookingType, normalizedMeta)
  const normalizedQuantity = extractQuantityFromBookingMeta(bookingType, normalizedMeta)
  const normalizedStartDate = derivedDates.startDate || fallbackStartDate
  const normalizedEndDate = serviceRequiresEndDate(service) ? (derivedDates.endDate || fallbackEndDate) : ''

  return {
    serviceId: item.serviceId,
    bookingType,
    bookingMeta: normalizedMeta,
    quantity: normalizedQuantity,
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    travelDate: normalizedStartDate
  }
}
