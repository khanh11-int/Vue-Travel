const DATE_REQUIREMENTS_BY_CATEGORY = Object.freeze({
  hotel: 'range',
  ticket: 'single',
  tour: 'single',
  combo: 'single'
})

const DEFAULT_DATE_REQUIREMENT = 'single'

const resolveCategoryId = (serviceOrCategory) => {
  if (!serviceOrCategory) return ''
  if (typeof serviceOrCategory === 'string') return serviceOrCategory
  return serviceOrCategory.categoryId || ''
}

export const getDateRequirement = (serviceOrCategory) => {
  const categoryId = resolveCategoryId(serviceOrCategory)
  return DATE_REQUIREMENTS_BY_CATEGORY[categoryId] || DEFAULT_DATE_REQUIREMENT
}

export const serviceRequiresEndDate = (serviceOrCategory) => getDateRequirement(serviceOrCategory) === 'range'

export const getPrimaryDateLabel = (serviceOrCategory) => {
  const categoryId = resolveCategoryId(serviceOrCategory)

  if (categoryId === 'hotel') return 'Ngày nhận phòng'
  if (categoryId === 'ticket') return 'Ngày sử dụng'
  if (categoryId === 'tour') return 'Ngày khởi hành'
  if (categoryId === 'combo') return 'Ngày áp dụng'

  return 'Ngày bắt đầu'
}

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
