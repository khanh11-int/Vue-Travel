const DATE_REQUIREMENTS_BY_CATEGORY = Object.freeze({
  hotel: 'range',
  ticket: 'single',
  tour: 'single'
})

const DEFAULT_DATE_REQUIREMENT = 'single'

/**
 * Chuẩn hóa đầu vào để luôn lấy được category id từ string hoặc object service.
 * @param {Object|string} serviceOrCategory - Service object hoặc category id.
 * @returns {string} Category id hợp lệ hoặc chuỗi rỗng.
 */
const resolveCategoryId = (serviceOrCategory) => {
  if (!serviceOrCategory) return ''
  if (typeof serviceOrCategory === 'string') return serviceOrCategory
  return serviceOrCategory.categoryId || ''
}

/**
 * Xác định kiểu chọn ngày theo nhóm dịch vụ để dùng chung ở form tìm kiếm/đặt chỗ.
 * @param {Object|string} serviceOrCategory - Service object hoặc category id.
 * @returns {string} Kiểu ngày: range hoặc single.
 */
export const getDateRequirement = (serviceOrCategory) => {
  const categoryId = resolveCategoryId(serviceOrCategory)
  return DATE_REQUIREMENTS_BY_CATEGORY[categoryId] || DEFAULT_DATE_REQUIREMENT
}

/**
 * Kiểm tra dịch vụ có bắt buộc chọn ngày kết thúc hay không.
 * @param {Object|string} serviceOrCategory - Service object hoặc category id.
 * @returns {boolean} True nếu cần cả ngày bắt đầu và kết thúc.
 */
export const serviceRequiresEndDate = (serviceOrCategory) => getDateRequirement(serviceOrCategory) === 'range'

/**
 * Trả về nhãn ngày chính theo ngữ cảnh category để hiển thị đúng nghiệp vụ.
 * @param {Object|string} serviceOrCategory - Service object hoặc category id.
 * @returns {string} Nhãn ngày hiển thị cho người dùng.
 */
export const getPrimaryDateLabel = (serviceOrCategory) => {
  const categoryId = resolveCategoryId(serviceOrCategory)

  if (categoryId === 'hotel') return 'Ngày nhận phòng'
  if (categoryId === 'ticket') return 'Ngày sử dụng'
  if (categoryId === 'tour') return 'Ngày khởi hành'

  return 'Ngày bắt đầu'
}

/**
 * Kiểm tra dữ liệu ngày đã đủ theo rule category và đúng thứ tự thời gian chưa.
 * @param {Object} payload - Dữ liệu ngày từ form đặt chỗ.
 * @param {string} payload.startDate - Ngày bắt đầu được chọn.
 * @param {string} payload.endDate - Ngày kết thúc được chọn.
 * @param {Object|string} payload.service - Service object hoặc category id.
 * @returns {boolean} True nếu dữ liệu ngày không hợp lệ.
 */
export const isDateSelectionInvalid = ({ startDate = '', endDate = '', service }) => {
  if (!startDate) return true

  if (serviceRequiresEndDate(service) && !endDate) {
    return true
  }

  if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
    return true
  }

  return false
}