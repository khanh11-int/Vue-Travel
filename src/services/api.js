import apiClient from '@/services/axios'

// categories
export const categoriesApi = {
  /**
   * Alias tuong thich nguoc de giu cac cho goi cu hoat dong on dinh.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach category.
   */
  list(params = {}) {
    return this.getAll(params)
  },

  /**
   * Alias tuong thich nguoc de giu cac cho goi chi tiet theo id van hoat dong.
   * @param {string|number} id - Id category.
   * @returns {Promise<Object|null>} Chi tiet category.
   */
  get(id) {
    return this.getById(id)
  },

  /**
   * Lay danh sach category tu API va tra ve payload da chuan hoa.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach category.
   */
  getAll(params = {}) {
    return apiClient.get('/categories', { params }).then((res) => res.data)
  },

  /**
   * Lay chi tiet category theo id.
   * @param {string|number} id - Id category.
   * @returns {Promise<Object|null>} Chi tiet category.
   */
  getById(id) {
    return apiClient.get(`/categories/${id}`).then((res) => res.data)
  },

  /**
   * Tao moi ban ghi category.
   * @param {Object} payload - Du lieu category can luu.
   * @returns {Promise<Object>} Category sau khi tao.
   */
  create(payload) {
    return apiClient.post('/categories', payload).then((res) => res.data)
  },

  /**
   * Cap nhat toan bo mot category da ton tai.
   * @param {string|number} id - Id category.
   * @param {Object} payload - Payload category day du.
   * @returns {Promise<Object>} Category sau khi cap nhat.
   */
  update(id, payload) {
    return apiClient.put(`/categories/${id}`, payload).then((res) => res.data)
  },

  /**
   * Cap nhat mot phan du lieu category.
   * @param {string|number} id - Id category.
   * @param {Object} payload - Cac truong can cap nhat mot phan.
   * @returns {Promise<Object>} Category sau khi cap nhat.
   */
  patch(id, payload) {
    return apiClient.patch(`/categories/${id}`, payload).then((res) => res.data)
  },

  /**
   * Xoa category khoi nguon du lieu.
   * @param {string|number} id - Id category.
   * @returns {Promise<Object>} Phan hoi API sau khi xoa.
   */
  remove(id) {
    return apiClient.delete(`/categories/${id}`).then((res) => res.data)
  }
}

// destinations
export const destinationsApi = {
  /**
   * Alias tuong thich nguoc de giu cac cho goi cu hoat dong on dinh.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach diem den.
   */
  list(params = {}) {
    return this.getAll(params)
  },

  /**
   * Alias tuong thich nguoc de giu cac cho goi chi tiet theo id van hoat dong.
   * @param {string|number} id - Id diem den.
   * @returns {Promise<Object|null>} Chi tiet diem den.
   */
  get(id) {
    return this.getById(id)
  },

  /**
   * Lay danh sach diem den tu API va tra ve payload da chuan hoa.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach diem den.
   */
  getAll(params = {}) {
    return apiClient.get('/destinations', { params }).then((res) => res.data)
  },

  /**
   * Lay chi tiet diem den theo id.
   * @param {string|number} id - Id diem den.
   * @returns {Promise<Object|null>} Chi tiet diem den.
   */
  getById(id) {
    return apiClient.get(`/destinations/${id}`).then((res) => res.data)
  },

  /**
   * Tao moi ban ghi diem den.
   * @param {Object} payload - Du lieu diem den can luu.
   * @returns {Promise<Object>} Diem den sau khi tao.
   */
  create(payload) {
    return apiClient.post('/destinations', payload).then((res) => res.data)
  },

  /**
   * Cap nhat toan bo mot diem den da ton tai.
   * @param {string|number} id - Id diem den.
   * @param {Object} payload - Payload diem den day du.
   * @returns {Promise<Object>} Diem den sau khi cap nhat.
   */
  update(id, payload) {
    return apiClient.put(`/destinations/${id}`, payload).then((res) => res.data)
  },

  /**
   * Cap nhat mot phan du lieu diem den.
   * @param {string|number} id - Id diem den.
   * @param {Object} payload - Cac truong can cap nhat mot phan.
   * @returns {Promise<Object>} Diem den sau khi cap nhat.
   */
  patch(id, payload) {
    return apiClient.patch(`/destinations/${id}`, payload).then((res) => res.data)
  },

  /**
   * Xoa diem den khoi nguon du lieu.
   * @param {string|number} id - Id diem den.
   * @returns {Promise<Object>} Phan hoi API sau khi xoa.
   */
  remove(id) {
    return apiClient.delete(`/destinations/${id}`).then((res) => res.data)
  }
}

// services
export const servicesApi = {
  /**
   * Alias tuong thich nguoc de giu cac cho goi cu hoat dong on dinh.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach dich vu.
   */
  list(params = {}) {
    return this.getAll(params)
  },

  /**
   * Alias tuong thich nguoc de giu cac cho goi chi tiet theo id van hoat dong.
   * @param {string|number} id - Id dich vu.
   * @returns {Promise<Object|null>} Chi tiet dich vu.
   */
  get(id) {
    return this.getById(id)
  },

  /**
   * Lay danh sach dich vu tu API va tra ve payload da chuan hoa.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach dich vu.
   */
  getAll(params = {}) {
    const serviceResources = [
      { categoryId: 'hotel', path: '/hotels' },
      { categoryId: 'ticket', path: '/tickets' },
      { categoryId: 'tour', path: '/tours' },
      { categoryId: 'flight', path: '/flights' }
    ]

    const attachCategoryFallback = (items, categoryId) =>
      (Array.isArray(items) ? items : []).map((item) => ({
        ...item,
        categoryId: item?.categoryId || categoryId
      }))

    return Promise.allSettled(
      serviceResources.map(({ categoryId, path }) =>
        apiClient.get(path, { params }).then((res) => attachCategoryFallback(res.data, categoryId))
      )
    ).then((results) => {
      const merged = results
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value)

      return merged
    })
  },

  /**
   * Lay chi tiet dich vu theo id.
   * @param {string|number} id - Id dich vu.
   * @returns {Promise<Object|null>} Chi tiet dich vu.
   */
  getById(id) {
    const serviceResources = [
      { categoryId: 'hotel', path: '/hotels' },
      { categoryId: 'ticket', path: '/tickets' },
      { categoryId: 'tour', path: '/tours' },
      { categoryId: 'flight', path: '/flights' }
    ]

    return Promise.allSettled(
      serviceResources.map(({ categoryId, path }) =>
        apiClient.get(`${path}/${id}`).then((res) => ({ ...res.data, categoryId: res.data?.categoryId || categoryId }))
      )
    ).then((results) => {
      const matched = results.find((result) => result.status === 'fulfilled')
      if (matched) return matched.value

      throw new Error('Khong tim thay dich vu trong hotels/tickets/tours.')
    })
  },

  /**
   * Tao moi ban ghi dich vu.
   * @param {Object} payload - Du lieu dich vu can luu.
   * @returns {Promise<Object>} Dich vu sau khi tao.
   */
  create(payload) {
    const categoryId = String(payload?.categoryId || 'hotel').toLowerCase()
    const targetPath = {
      hotel: '/hotels',
      ticket: '/tickets',
      tour: '/tours',
      flight: '/flights'
    }[categoryId] || '/hotels'

    return apiClient.post(targetPath, { ...payload, categoryId }).then((res) => res.data)
  },

  /**
   * Cap nhat toan bo mot dich vu da ton tai.
   * @param {string|number} id - Id dich vu.
   * @param {Object} payload - Payload dich vu day du.
   * @returns {Promise<Object>} Dich vu sau khi cap nhat.
   */
  update(id, payload) {
    const serviceResources = [
      { categoryId: 'hotel', path: '/hotels' },
      { categoryId: 'ticket', path: '/tickets' },
      { categoryId: 'tour', path: '/tours' },
      { categoryId: 'flight', path: '/flights' }
    ]

    const explicitCategoryId = String(payload?.categoryId || '').toLowerCase()
    const explicitPath = {
      hotel: '/hotels',
      ticket: '/tickets',
      tour: '/tours'
    }[explicitCategoryId]

    const updateByPath = (path) => apiClient.put(`${path}/${id}`, payload).then((res) => res.data)

    if (explicitPath) {
      return updateByPath(explicitPath)
    }

    return Promise.allSettled(
      serviceResources.map(({ path }) => apiClient.get(`${path}/${id}`))
    ).then((results) => {
      const foundIndex = results.findIndex((result) => result.status === 'fulfilled')
      if (foundIndex > -1) {
        return updateByPath(serviceResources[foundIndex].path)
      }

      throw new Error('Khong tim thay dich vu de cap nhat trong hotels/tickets/tours.')
    })
  },

  /**
   * Cap nhat mot phan du lieu dich vu.
   * @param {string|number} id - Id dich vu.
   * @param {Object} payload - Cac truong can cap nhat mot phan.
   * @returns {Promise<Object>} Dich vu sau khi cap nhat.
   */
  patch(id, payload) {
    const serviceResources = [
      { categoryId: 'hotel', path: '/hotels' },
      { categoryId: 'ticket', path: '/tickets' },
      { categoryId: 'tour', path: '/tours' }
    ]

    const explicitCategoryId = String(payload?.categoryId || '').toLowerCase()
    const explicitPath = {
      hotel: '/hotels',
      ticket: '/tickets',
      tour: '/tours'
    }[explicitCategoryId]

    const patchByPath = (path) => apiClient.patch(`${path}/${id}`, payload).then((res) => res.data)

    if (explicitPath) {
      return patchByPath(explicitPath)
    }

    return Promise.allSettled(
      serviceResources.map(({ path }) => apiClient.get(`${path}/${id}`))
    ).then((results) => {
      const foundIndex = results.findIndex((result) => result.status === 'fulfilled')
      if (foundIndex > -1) {
        return patchByPath(serviceResources[foundIndex].path)
      }

      throw new Error('Khong tim thay dich vu de cap nhat trong hotels/tickets/tours.')
    })
  },

  /**
   * Xoa dich vu khoi nguon du lieu.
   * @param {string|number} id - Id dich vu.
   * @returns {Promise<Object>} Phan hoi API sau khi xoa.
   */
  remove(id) {
    const serviceResources = ['/hotels', '/tickets', '/tours']

    return Promise.allSettled(
      serviceResources.map((path) => apiClient.get(`${path}/${id}`))
    ).then((results) => {
      const foundIndex = results.findIndex((result) => result.status === 'fulfilled')
      if (foundIndex > -1) {
        return apiClient.delete(`${serviceResources[foundIndex]}/${id}`).then((res) => res.data)
      }

      throw new Error('Khong tim thay dich vu de xoa trong hotels/tickets/tours.')
    })
  }
}

// bookings
export const bookingsApi = {
  /**
   * Alias tuong thich nguoc de giu cac cho goi cu hoat dong on dinh.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach booking.
   */
  list(params = {}) {
    return this.getAll(params)
  },

  /**
   * Alias tuong thich nguoc de giu cac cho goi chi tiet theo id van hoat dong.
   * @param {string|number} id - Id booking.
   * @returns {Promise<Object|null>} Chi tiet booking.
   */
  get(id) {
    return this.getById(id)
  },

  /**
   * Lay danh sach booking tu API va tra ve payload da chuan hoa.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach booking.
   */
  getAll(params = {}) {
    return apiClient.get('/bookings', { params }).then((res) => res.data)
  },

  /**
   * Tra cuu booking cho guest theo ma dat cho hoac so dien thoai o API layer.
   * Khong tai toan bo bookings ve client de loc.
   * @param {Object} payload - Du lieu tra cuu.
   * @param {string} payload.code - Ma booking.
   * @param {string} payload.phone - So dien thoai.
   * @returns {Promise<Array>} Danh sach booking khop dieu kien.
   */
  async lookupGuest({ code = '', phone = '' } = {}) {
    const normalizedCode = String(code || '').trim().toUpperCase()
    const normalizedPhone = String(phone || '').replace(/\D/g, '')
    const requests = []

    if (normalizedCode) {
      requests.push(apiClient.get('/bookings', { params: { code: normalizedCode } }))
    }

    if (normalizedPhone) {
      requests.push(apiClient.get('/bookings', { params: { 'customer.phone': normalizedPhone } }))
    }

    if (!requests.length) return []

    const responses = await Promise.all(requests)
    const merged = responses.flatMap((response) => (Array.isArray(response?.data) ? response.data : []))
    const seen = new Set()

    return merged.filter((booking) => {
      const dedupeKey = String(booking?.id || booking?.code || '')
      if (!dedupeKey || seen.has(dedupeKey)) return false
      seen.add(dedupeKey)
      return true
    })
  },

  /**
   * Lay chi tiet booking theo id.
   * @param {string|number} id - Id booking.
   * @returns {Promise<Object|null>} Chi tiet booking.
   */
  getById(id) {
    return apiClient.get(`/bookings/${id}`).then((res) => res.data)
  },

  /**
   * Tao moi ban ghi booking.
   * @param {Object} payload - Du lieu booking can luu.
   * @returns {Promise<Object>} Booking sau khi tao.
   */
  create(payload) {
    return apiClient.post('/bookings', payload).then((res) => res.data)
  },

  /**
   * Cap nhat toan bo mot booking da ton tai.
   * @param {string|number} id - Id booking.
   * @param {Object} payload - Payload booking day du.
   * @returns {Promise<Object>} Booking sau khi cap nhat.
   */
  update(id, payload) {
    return apiClient.put(`/bookings/${id}`, payload).then((res) => res.data)
  },

  /**
   * Cap nhat mot phan du lieu booking.
   * @param {string|number} id - Id booking.
   * @param {Object} payload - Cac truong can cap nhat mot phan.
   * @returns {Promise<Object>} Booking sau khi cap nhat.
   */
  patch(id, payload) {
    return apiClient.patch(`/bookings/${id}`, payload).then((res) => res.data)
  },

  /**
   * Xoa booking khoi nguon du lieu.
   * @param {string|number} id - Id booking.
   * @returns {Promise<Object>} Phan hoi API sau khi xoa.
   */
  remove(id) {
    return apiClient.delete(`/bookings/${id}`).then((res) => res.data)
  }
}

// booking details
export const bookingDetailsApi = {
  /**
   * Lay danh sach chi tiet hoa don tu API.
   * @param {Object} params - Query params dung de loc phia server.
   * @returns {Promise<Array>} Danh sach booking detail.
   */
  getAll(params = {}) {
    return apiClient.get('/bookingDetails', { params }).then((res) => res.data)
  },

  /**
   * Lay chi tiet hoa don theo id.
   * @param {string|number} id - Id booking detail.
   * @returns {Promise<Object|null>} Chi tiet booking detail.
   */
  getById(id) {
    return apiClient.get(`/bookingDetails/${id}`).then((res) => res.data)
  },

  /**
   * Tao moi mot booking detail.
   * @param {Object} payload - Du lieu chi tiet hoa don.
   * @returns {Promise<Object>} Booking detail sau khi tao.
   */
  create(payload) {
    return apiClient.post('/bookingDetails', payload).then((res) => res.data)
  },

  /**
   * Cap nhat booking detail.
   * @param {string|number} id - Id booking detail.
   * @param {Object} payload - Du lieu cap nhat.
   * @returns {Promise<Object>} Booking detail sau khi cap nhat.
   */
  update(id, payload) {
    return apiClient.put(`/bookingDetails/${id}`, payload).then((res) => res.data)
  },

  /**
   * Xoa booking detail.
   * @param {string|number} id - Id booking detail.
   * @returns {Promise<Object>} Phan hoi API sau khi xoa.
   */
  remove(id) {
    return apiClient.delete(`/bookingDetails/${id}`).then((res) => res.data)
  }
}

// flights
export const flightsApi = {
  /**
   * Alias tuong thich nguoc de giu cac cho goi cu hoat dong on dinh.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach chuyen bay.
   */
  list(params = {}) {
    return this.getAll(params)
  },

  /**
   * Alias tuong thich nguoc de giu cac cho goi chi tiet theo id van hoat dong.
   * @param {string|number} id - Id chuyen bay.
   * @returns {Promise<Object|null>} Chi tiet chuyen bay.
   */
  get(id) {
    return this.getById(id)
  },

  /**
   * Lay danh sach chuyen bay tu API va tra ve payload da chuan hoa.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach chuyen bay.
   */
  getAll(params = {}) {
    return apiClient.get('/flights', { params }).then((res) => res.data)
  },

  /**
   * Lay chi tiet chuyen bay theo id.
   * @param {string|number} id - Id chuyen bay.
   * @returns {Promise<Object|null>} Chi tiet chuyen bay.
   */
  getById(id) {
    return apiClient.get(`/flights/${id}`).then((res) => res.data)
  },

  /**
   * Tao moi ban ghi chuyen bay.
   * @param {Object} payload - Du lieu chuyen bay can luu.
   * @returns {Promise<Object>} Chuyen bay sau khi tao.
   */
  create(payload) {
    return apiClient.post('/flights', payload).then((res) => res.data)
  },

  /**
   * Cap nhat toan bo mot chuyen bay da ton tai.
   * @param {string|number} id - Id chuyen bay.
   * @param {Object} payload - Payload chuyen bay day du.
   * @returns {Promise<Object>} Chuyen bay sau khi cap nhat.
   */
  update(id, payload) {
    return apiClient.put(`/flights/${id}`, payload).then((res) => res.data)
  },

  /**
   * Cap nhat mot phan du lieu chuyen bay.
   * @param {string|number} id - Id chuyen bay.
   * @param {Object} payload - Cac truong can cap nhat mot phan.
   * @returns {Promise<Object>} Chuyen bay sau khi cap nhat.
   */
  patch(id, payload) {
    return apiClient.patch(`/flights/${id}`, payload).then((res) => res.data)
  },

  /**
   * Xoa chuyen bay khoi nguon du lieu.
   * @param {string|number} id - Id chuyen bay.
   * @returns {Promise<Object>} Phan hoi API sau khi xoa.
   */
  remove(id) {
    return apiClient.delete(`/flights/${id}`).then((res) => res.data)
  }
}

// flight bookings
export const flightBookingsApi = {
  /**
   * Lay danh sach booking ve may bay tu API.
   * @param {Object} params - Query params dung de loc phia server.
   * @returns {Promise<Array>} Danh sach flight booking.
   */
  getAll(params = {}) {
    return apiClient.get('/flightBookings', { params }).then((res) => res.data)
  },

  /**
   * Lay chi tiet flight booking theo id.
   * @param {string|number} id - Id flight booking.
   * @returns {Promise<Object|null>} Chi tiet flight booking.
   */
  getById(id) {
    return apiClient.get(`/flightBookings/${id}`).then((res) => res.data)
  },

  /**
   * Tao moi mot flight booking.
   * @param {Object} payload - Du lieu flight booking.
   * @returns {Promise<Object>} Flight booking sau khi tao.
   */
  create(payload) {
    return apiClient.post('/flightBookings', payload).then((res) => res.data)
  },

  /**
   * Cap nhat flight booking.
   * @param {string|number} id - Id flight booking.
   * @param {Object} payload - Du lieu cap nhat.
   * @returns {Promise<Object>} Flight booking sau khi cap nhat.
   */
  update(id, payload) {
    return apiClient.put(`/flightBookings/${id}`, payload).then((res) => res.data)
  },

  /**
   * Xoa flight booking.
   * @param {string|number} id - Id flight booking.
   * @returns {Promise<Object>} Phan hoi API sau khi xoa.
   */
  remove(id) {
    return apiClient.delete(`/flightBookings/${id}`).then((res) => res.data)
  }
}

// comments
export const commentsApi = {
  /**
   * Alias tuong thich nguoc de giu cac cho goi cu hoat dong on dinh.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach binh luan.
   */
  list(params = {}) {
    return this.getAll(params)
  },

  /**
   * Alias tuong thich nguoc de giu cac cho goi chi tiet theo id van hoat dong.
   * @param {string|number} id - Id binh luan.
   * @returns {Promise<Object|null>} Chi tiet binh luan.
   */
  get(id) {
    return this.getById(id)
  },

  /**
   * Lay danh sach binh luan tu API va tra ve payload da chuan hoa.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach binh luan.
   */
  getAll(params = {}) {
    return apiClient.get('/comments', { params }).then((res) => res.data)
  },

  /**
   * Lay chi tiet binh luan theo id.
   * @param {string|number} id - Id binh luan.
   * @returns {Promise<Object|null>} Chi tiet binh luan.
   */
  getById(id) {
    return apiClient.get(`/comments/${id}`).then((res) => res.data)
  },

  /**
   * Tao moi ban ghi binh luan.
   * @param {Object} payload - Du lieu binh luan can luu.
   * @returns {Promise<Object>} Binh luan sau khi tao.
   */
  create(payload) {
    return apiClient.post('/comments', payload).then((res) => res.data)
  },

  /**
   * Cap nhat toan bo mot binh luan da ton tai.
   * @param {string|number} id - Id binh luan.
   * @param {Object} payload - Payload binh luan day du.
   * @returns {Promise<Object>} Binh luan sau khi cap nhat.
   */
  update(id, payload) {
    return apiClient.put(`/comments/${id}`, payload).then((res) => res.data)
  },

  /**
   * Cap nhat mot phan du lieu binh luan.
   * @param {string|number} id - Id binh luan.
   * @param {Object} payload - Cac truong can cap nhat mot phan.
   * @returns {Promise<Object>} Binh luan sau khi cap nhat.
   */
  patch(id, payload) {
    return apiClient.patch(`/comments/${id}`, payload).then((res) => res.data)
  },

  /**
   * Xoa binh luan khoi nguon du lieu.
   * @param {string|number} id - Id binh luan.
   * @returns {Promise<Object>} Phan hoi API sau khi xoa.
   */
  remove(id) {
    return apiClient.delete(`/comments/${id}`).then((res) => res.data)
  }
}

// promotions
export const promotionsApi = {
  /**
   * Alias tuong thich nguoc de giu cac cho goi cu hoat dong on dinh.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach khuyen mai.
   */
  list(params = {}) {
    return this.getAll(params)
  },

  /**
   * Alias tuong thich nguoc de giu cac cho goi chi tiet theo id van hoat dong.
   * @param {string|number} id - Id khuyen mai.
   * @returns {Promise<Object|null>} Chi tiet khuyen mai.
   */
  get(id) {
    return this.getById(id)
  },

  /**
   * Lay danh sach khuyen mai tu API va tra ve payload da chuan hoa.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach khuyen mai.
   */
  getAll(params = {}) {
    return apiClient.get('/promotions', { params }).then((res) => res.data)
  },

  /**
   * Lay chi tiet khuyen mai theo id.
   * @param {string|number} id - Id khuyen mai.
   * @returns {Promise<Object|null>} Chi tiet khuyen mai.
   */
  getById(id) {
    return apiClient.get(`/promotions/${id}`).then((res) => res.data)
  },

  /**
   * Tao moi ban ghi khuyen mai.
   * @param {Object} payload - Du lieu khuyen mai can luu.
   * @returns {Promise<Object>} Khuyen mai sau khi tao.
   */
  create(payload) {
    return apiClient.post('/promotions', payload).then((res) => res.data)
  },

  /**
   * Cap nhat toan bo mot khuyen mai da ton tai.
   * @param {string|number} id - Id khuyen mai.
   * @param {Object} payload - Payload khuyen mai day du.
   * @returns {Promise<Object>} Khuyen mai sau khi cap nhat.
   */
  update(id, payload) {
    return apiClient.put(`/promotions/${id}`, payload).then((res) => res.data)
  },

  /**
   * Cap nhat mot phan du lieu khuyen mai.
   * @param {string|number} id - Id khuyen mai.
   * @param {Object} payload - Cac truong can cap nhat mot phan.
   * @returns {Promise<Object>} Khuyen mai sau khi cap nhat.
   */
  patch(id, payload) {
    return apiClient.patch(`/promotions/${id}`, payload).then((res) => res.data)
  },

  /**
   * Xoa khuyen mai khoi nguon du lieu.
   * @param {string|number} id - Id khuyen mai.
   * @returns {Promise<Object>} Phan hoi API sau khi xoa.
   */
  remove(id) {
    return apiClient.delete(`/promotions/${id}`).then((res) => res.data)
  }
}

// users
export const usersApi = {
  /**
   * Alias tuong thich nguoc de giu cac cho goi cu hoat dong on dinh.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach nguoi dung.
   */
  list(params = {}) {
    return this.getAll(params)
  },

  /**
   * Alias tuong thich nguoc de giu cac cho goi chi tiet theo id van hoat dong.
   * @param {string|number} id - Id nguoi dung.
   * @returns {Promise<Object|null>} Chi tiet nguoi dung.
   */
  get(id) {
    return this.getById(id)
  },

  /**
   * Lay danh sach nguoi dung tu API va tra ve payload da chuan hoa.
   * @param {Object} params - Query params dung de loc/sap xep phia server.
   * @returns {Promise<Array>} Danh sach nguoi dung.
   */
  getAll(params = {}) {
    return apiClient.get('/users', { params }).then((res) => res.data)
  },

  /**
   * Lay chi tiet nguoi dung theo id.
   * @param {string|number} id - Id nguoi dung.
   * @returns {Promise<Object|null>} Chi tiet nguoi dung.
   */
  getById(id) {
    return apiClient.get(`/users/${id}`).then((res) => res.data)
  },

  /**
   * Tao moi ban ghi nguoi dung.
   * @param {Object} payload - Du lieu nguoi dung can luu.
   * @returns {Promise<Object>} Nguoi dung sau khi tao.
   */
  create(payload) {
    return apiClient.post('/users', payload).then((res) => res.data)
  },

  /**
   * Cap nhat toan bo mot nguoi dung da ton tai.
   * @param {string|number} id - Id nguoi dung.
   * @param {Object} payload - Payload nguoi dung day du.
   * @returns {Promise<Object>} Nguoi dung sau khi cap nhat.
   */
  update(id, payload) {
    return apiClient.put(`/users/${id}`, payload).then((res) => res.data)
  },

  /**
   * Cap nhat mot phan du lieu nguoi dung.
   * @param {string|number} id - Id nguoi dung.
   * @param {Object} payload - Cac truong can cap nhat mot phan.
   * @returns {Promise<Object>} Nguoi dung sau khi cap nhat.
   */
  patch(id, payload) {
    return apiClient.patch(`/users/${id}`, payload).then((res) => res.data)
  },

  /**
   * Xoa nguoi dung khoi nguon du lieu.
   * @param {string|number} id - Id nguoi dung.
   * @returns {Promise<Object>} Phan hoi API sau khi xoa.
   */
  remove(id) {
    return apiClient.delete(`/users/${id}`).then((res) => res.data)
  }
}

/**
 * Khoi tao user mac dinh chi khi bang users dang trong.
 * @param {Array<Object>} defaultUsers - Danh sach user mac dinh cho moi truong local/demo.
 * @returns {Promise<Array>} Danh sach user cuoi cung sau khi seed.
 */
export async function seedUsersIfEmpty(defaultUsers = []) {
  const currentUsers = await usersApi.getAll()
  if (Array.isArray(currentUsers) && currentUsers.length > 0) return currentUsers

  for (const user of defaultUsers) {
    await usersApi.create(user)
  }

  return usersApi.getAll()
}

/**
 * Goi request nhe de kiem tra API con hoat dong hay khong.
 * @returns {Promise<void>} Resolve khi endpoint truy cap duoc.
 */
export async function apiHealthCheck() {
  await apiClient.get('/services?_limit=1')
}
