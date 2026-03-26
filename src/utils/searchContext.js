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
  return ''
}

/**
 * Chuẩn hóa số lượng theo quy ước field của từng category (vé/khách/phòng).
 * @param {Object} query - Query params hiện tại trên URL.
 * @param {string} category - Nhóm dịch vụ đang xử lý.
 * @returns {number} Số lượng đầu vào đã quy đổi.
 */
export const resolveQuantityByCategory = (query, category) => {
  if (category === 'ticket') return Number(query.ticketQuantity || 1)
  if (category === 'tour') return Number(query.travelers || 1)
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
    const rooms = Number(query.rooms || 1)
    return `Nhận phòng: ${startDate || 'Chưa chọn'} · Trả phòng: ${endDate || 'Chưa chọn'} · ${quantityLabel} · ${rooms} phòng`
  }

  if (category === 'ticket') {
    return `Ngày sử dụng: ${startDate || 'Chưa chọn'} · ${quantityLabel}`
  }

  if (category === 'tour') {
    return `Ngày khởi hành: ${startDate || 'Chưa chọn'} · ${quantityLabel}`
  }

  return `Ngày bắt đầu: ${startDate || 'Chưa chọn'} · ${quantityLabel}`
}