export const resolveCategoryFromQuery = (query, fallback = '') => String(query.category || fallback || '').trim()

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
  if (category === 'combo') {
    return query.applyDate || query.departureDate || query.startDate || query.date || ''
  }
  return query.startDate || query.date || ''
}

export const resolveEndDateByCategory = (query, category) => {
  if (category === 'hotel') {
    return query.checkOutDate || query.endDate || query.returnDate || ''
  }
  return ''
}

export const resolveQuantityByCategory = (query, category) => {
  if (category === 'ticket') return Number(query.ticketQuantity || 1)
  if (category === 'tour' || category === 'combo') return Number(query.travelers || 1)
  return Number(query.guests || 1)
}

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

  if (category === 'combo') {
    return `Ngày áp dụng: ${startDate || 'Chưa chọn'} · ${quantityLabel}`
  }

  return `Ngày bắt đầu: ${startDate || 'Chưa chọn'} · ${quantityLabel}`
}
