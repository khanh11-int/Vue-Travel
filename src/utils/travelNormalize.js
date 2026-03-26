import { serviceRequiresEndDate } from '@/utils/bookingRules'

/**
 * Suy ra bookingType từ item hoặc fallback theo category của service.
 * @param {Object} service - Service gốc.
 * @param {Object|null} item - Item hiện tại có thể đã mang bookingType.
 * @returns {string} Booking type hợp lệ.
 */
export const getBookingType = (service, item = null) => {
  if (item?.bookingType) return item.bookingType
  return service?.categoryId || 'hotel'
}

/**
 * Chuẩn hóa cấu trúc bookingMeta theo từng loại dịch vụ để thống nhất dữ liệu lưu trữ.
 * @param {Object} payload - Tham số đầu vào dùng để xây bookingMeta.
 * @param {string} payload.bookingType - Loại booking.
 * @param {string} payload.startDate - Ngày bắt đầu.
 * @param {string} payload.endDate - Ngày kết thúc.
 * @param {number} payload.quantity - Số lượng đặt.
 * @param {Object} payload.bookingMeta - Metadata gốc từ UI.
 * @returns {Object} Booking metadata đã chuẩn hóa.
 */
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
    departureId: bookingMeta.departureId || '',
    departureDate: bookingMeta.departureDate || startDate || '',
    travelers: Math.max(1, Number(bookingMeta.travelers ?? normalizedQuantity) || 1),
    durationLabel: bookingMeta.durationLabel || '',
    unitPrice: Number(bookingMeta.unitPrice || 0) || 0
  }
}

/**
 * Trích xuất cặp ngày start/end từ bookingMeta theo từng bookingType.
 * @param {string} bookingType - Loại booking.
 * @param {Object} bookingMeta - Metadata đã chuẩn hóa.
 * @returns {{startDate: string, endDate: string}} Khoảng ngày tương ứng.
 */
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
    startDate: bookingMeta.departureDate || '',
    endDate: ''
  }
}

/**
 * Trích xuất số lượng chính từ bookingMeta theo loại dịch vụ.
 * @param {string} bookingType - Loại booking.
 * @param {Object} bookingMeta - Metadata đã chuẩn hóa.
 * @returns {number} Số lượng hợp lệ (>=1).
 */
export const extractQuantityFromBookingMeta = (bookingType, bookingMeta) => {
  if (bookingType === 'hotel') return Math.max(1, Number(bookingMeta.guests || 1) || 1)
  if (bookingType === 'ticket') return Math.max(1, Number(bookingMeta.ticketQuantity || 1) || 1)
  return Math.max(1, Number(bookingMeta.travelers || 1) || 1)
}

/**
 * Chuẩn hóa cấu trúc service khi đọc từ storage để tránh thiếu field theo category.
 * @param {Array<Object>} services - Danh sách service thô từ storage.
 * @returns {Array<Object>} Danh sách service đã chuẩn hóa.
 */
export const normalizeServicesFromStorage = (services = []) => {
  if (!Array.isArray(services)) return []

  return services.map((service) => {
    const nextService = { ...service }

    if (nextService.categoryId === 'tour' && !Array.isArray(nextService.departures)) {
      nextService.departures = []
    }

    return nextService
  })
}

/**
 * Chuẩn hóa cart item từ dữ liệu cũ/mới về một schema đồng nhất cho xử lý nghiệp vụ.
 * @param {Object} item - Cart item cần chuẩn hóa.
 * @param {Array<Object>} services - Danh sách service để suy luận category/rules.
 * @returns {Object} Cart item đã chuẩn hóa đầy đủ.
 */
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
