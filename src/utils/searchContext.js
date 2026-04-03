import { calculateTotalGuests } from '@/utils/hotelGuestRoom'

/**
 * Ưu tiên đọc category từ query, nếu thiếu thì dùng fallback để giữ context tìm kiếm.
 * @param {Object} query - Query params hiện tại trên URL.
 * @param {string} fallback - Category dự phòng.
 * @returns {string} Category đã chuẩn hóa.
 */
export const resolveCategoryFromQuery = (query, fallback = '') => String(query.category || fallback || '').trim()

/**
 * Ánh xạ tên field ngày bắt đầu theo từng category để tái sử dụng cho list/detail.
 * @param {Object} query - Query params hiện tại trên URL.
 * @param {string} category - Nhóm dịch vụ đang xử lý.
 * @returns {string} Ngày bắt đầu theo đúng category.
 */
export const resolveStartDateByCategory = (query, category) => {
  if (category === 'hotel') {
    return query.checkInDate || query.startDate || query.date || ''
  }
  if (category === 'ticket') {
    return query.useDate || query.startDate || query.date || ''
  }
  if (category === 'tour') {
    return query.departureDate || query.startDate || query.date || ''
  }
  return query.startDate || query.date || ''
}

/**
 * Lấy ngày kết thúc theo category, chỉ áp dụng cho hotel và trả rỗng cho loại khác.
 * @param {Object} query - Query params hiện tại trên URL.
 * @param {string} category - Nhóm dịch vụ đang xử lý.
 * @returns {string} Ngày kết thúc hoặc chuỗi rỗng.
 */
export const resolveEndDateByCategory = (query, category) => {
  if (category === 'hotel') {
    return query.checkOutDate || query.endDate || query.returnDate || ''
  }
  if (category === 'tour') {
    return query.endDate || query.returnDate || ''
  }
  return ''
}

/**
 * Chuẩn hóa số lượng theo quy ước field của từng category (vé/khách/phòng).
 * @param {Object} query - Query params hiện tại trên URL.
 * @param {string} category - Nhóm dịch vụ đang xử lý.
 * @returns {number} Số lượng đầu vào đã quy đổi.
 */
export const resolveQuantityByCategory = (query, category) => {
  if (category === 'ticket') return Number(query.quantity || query.ticketQuantity || 1)
  if (category === 'tour') return Number(query.travelers || query.quantity || 1)
  if (category === 'hotel') {
    const hasHotelGuestFields = query.adults !== undefined || query.children !== undefined
    if (hasHotelGuestFields) {
      return calculateTotalGuests({
        adults: Number(query.adults || 1),
        children: Number(query.children || 0),
        rooms: Number(query.rooms || 1)
      })
    }
  }
  return Number(query.guests || 1)
}

/**
 * Tạo chuỗi tóm tắt tiêu chí tìm kiếm để hiển thị nhanh trên trang danh sách.
 * @param {Object} query - Query params hiện tại trên URL.
 * @param {string} category - Nhóm dịch vụ đang xử lý.
 * @returns {string} Chuỗi mô tả ngắn gọn các điều kiện tìm kiếm.
 */
export const resolveSearchSummary = (query, category) => {
  const startDate = resolveStartDateByCategory(query, category)
  const endDate = resolveEndDateByCategory(query, category)
  const quantity = Math.max(1, resolveQuantityByCategory(query, category) || 1)
  const quantityLabel = category === 'ticket' ? `${quantity} vé` : `${quantity} khách`

  if (category === 'hotel') {
    const adults = Math.max(1, Number(query.adults || Math.max(1, quantity - Number(query.children || 0))) || 1)
    const children = Math.max(0, Number(query.children || 0) || 0)
    const rooms = Number(query.rooms || 1)
    return `Nhận phòng: ${startDate || 'Chưa chọn'} · Trả phòng: ${endDate || 'Chưa chọn'} · ${adults} người lớn · ${children} trẻ em · ${rooms} phòng`
  }

  if (category === 'ticket') {
    const adults = Math.max(1, Number(query.adults || query.ticketQuantity || Math.max(1, quantity - Number(query.children || 0))) || 1)
    const children = Math.max(0, Number(query.children || 0) || 0)
    return `Ngày sử dụng: ${startDate || 'Chưa chọn'} · ${adults} người lớn · ${children} trẻ em`
  }

  if (category === 'tour') {
    const adults = Math.max(1, Number(query.adults || Math.max(1, quantity - Number(query.children || 0))) || 1)
    const children = Math.max(0, Number(query.children || 0) || 0)
    return `Khởi hành: ${startDate || 'Chưa chọn'} · Kết thúc: ${endDate || 'Chưa chọn'} · ${adults} người lớn · ${children} trẻ em`
  }

  return `Ngày bắt đầu: ${startDate || 'Chưa chọn'} · ${quantityLabel}`
}