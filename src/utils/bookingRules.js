const DATE_REQUIREMENTS_BY_CATEGORY = Object.freeze({
  hotel: 'range',
  ticket: 'single',
  tour: 'single'
})

const DEFAULT_DATE_REQUIREMENT = 'single'
const BOOKING_CANCELLATION_WINDOW_MS = 3 * 24 * 60 * 60 * 1000
const GUEST_OWNER_SCOPE = 'guest'

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

/**
 * Kiểm tra booking còn được phép hủy hay không.
 * Điều kiện: đang chờ xác nhận hoặc tạo trong vòng 3 ngày gần nhất.
 * @param {Object} booking - Booking cần kiểm tra.
 * @param {Date} [referenceDate=new Date()] - Mốc thời gian so sánh.
 * @returns {boolean} True nếu booking được phép hủy.
 */
export const canCancelBooking = (booking, referenceDate = new Date()) => {
  if (!booking) return false
  if (booking.status === 'cancelled' || booking.status === 'completed') return false
  if (booking.status === 'pending') return true
  if (!booking.createdAt) return false

  const createdAt = new Date(booking.createdAt)
  const referenceTime = referenceDate instanceof Date ? referenceDate.getTime() : new Date(referenceDate).getTime()
  const createdTime = createdAt.getTime()

  if (Number.isNaN(createdTime) || Number.isNaN(referenceTime)) return false

  return referenceTime - createdTime <= BOOKING_CANCELLATION_WINDOW_MS
}

/**
 * Suy ra owner user id tu booking customer payload.
 * @param {Object} booking - Booking can xac dinh owner.
 * @returns {string} User id owner, fallback guest khi thieu thong tin.
 */
export const resolveBookingOwnerUserId = (booking) => {
  const userId = booking?.customer?.userId ?? booking?.customer?.id
  return userId ? String(userId) : GUEST_OWNER_SCOPE
}

/**
 * Kiem tra user hien tai co du quyen huy booking hay khong.
 * Dieu kien: la admin hoac chu booking, va booking phai dat canCancelBooking.
 * @param {Object} booking - Booking can kiem tra.
 * @param {Object|null} currentUser - User dang thao tac.
 * @param {Date} [referenceDate=new Date()] - Moc thoi gian so sanh.
 * @returns {boolean} True neu du quyen huy.
 */
export const canUserCancelBooking = (booking, currentUser, referenceDate = new Date()) => {
  if (!currentUser) return false
  if (!canCancelBooking(booking, referenceDate)) return false

  if (currentUser.role === 'admin') return true

  const ownerUserId = resolveBookingOwnerUserId(booking)
  if (ownerUserId === GUEST_OWNER_SCOPE) return false

  return String(currentUser.id || '') === ownerUserId
}