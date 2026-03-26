const DETAIL_ROUTE_BY_CATEGORY = {
  hotel: 'hotel-detail',
  ticket: 'ticket-detail',
  tour: 'tour-detail'
}

/**
 * Trả về tên route chi tiết theo category, có fallback an toàn cho dữ liệu thiếu.
 * @param {string} categoryId - Mã category của dịch vụ.
 * @returns {string} Tên route chi tiết tương ứng.
 */
export const getDetailRouteName = (categoryId = '') => DETAIL_ROUTE_BY_CATEGORY[categoryId] || 'hotel-detail'

/**
 * Tạo object location cho router từ service object hoặc từ cặp category/slug.
 * @param {Object|string} serviceOrCategory - Service object hoặc category id.
 * @param {Object|string} slugOrQuery - Query khi truyền object, hoặc slug khi truyền category.
 * @param {Object} maybeQuery - Query params khi truyền category + slug.
 * @returns {Object} Router location dùng trực tiếp cho router-link/router.push.
 */
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
