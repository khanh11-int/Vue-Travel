const DETAIL_ROUTE_BY_CATEGORY = {
  hotel: 'hotel-detail',
  ticket: 'ticket-detail',
  tour: 'tour-detail',
  combo: 'combo-detail'
}

export const getDetailRouteName = (categoryId = '') => DETAIL_ROUTE_BY_CATEGORY[categoryId] || 'hotel-detail'

export const getDetailRouteLocation = (serviceOrCategory, slugOrQuery = {}, maybeQuery = {}) => {
  if (typeof serviceOrCategory === 'object' && serviceOrCategory !== null) {
    return {
      name: getDetailRouteName(serviceOrCategory.categoryId),
      params: { slug: serviceOrCategory.slug },
      query: slugOrQuery || {}
    }
  }

  return {
    name: getDetailRouteName(serviceOrCategory),
    params: { slug: String(slugOrQuery || '') },
    query: maybeQuery || {}
  }
}
