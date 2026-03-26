/**
 * Định dạng số tiền theo chuẩn Việt Nam và gắn hậu tố VND để hiển thị nhất quán.
 * @param {number|string} value - Giá trị tiền thô.
 * @returns {string} Chuỗi tiền đã định dạng.
 */
export const formatCurrencyVND = (value = 0) => {
  const normalizedValue = Number(value) || 0
  return `${new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0
  }).format(normalizedValue)} VND`
}

/**
 * Định dạng ngày về chuẩn dd/mm/yyyy cho giao diện tiếng Việt.
 * @param {string|Date} dateValue - Giá trị ngày đầu vào.
 * @returns {string} Nhãn ngày đã định dạng.
 */
export const formatDateVN = (dateValue) => {
  if (!dateValue) return 'Chưa chọn ngày'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(dateValue))
}

/**
 * Ghép cặp ngày bắt đầu/kết thúc thành chuỗi khoảng ngày có fallback khi thiếu dữ liệu.
 * @param {string|Date} startDate - Ngày bắt đầu.
 * @param {string|Date} endDate - Ngày kết thúc.
 * @returns {string} Chuỗi khoảng ngày dễ đọc.
 */
export const formatDateRangeVN = (startDate, endDate) => {
  if (!startDate && !endDate) return 'Chưa chọn ngày'
  if (startDate && !endDate) return formatDateVN(startDate)
  if (!startDate && endDate) return formatDateVN(endDate)
  return `${formatDateVN(startDate)} - ${formatDateVN(endDate)}`
}