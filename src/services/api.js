import apiClient from '@/services/axios'

// categories
export const categoriesApi = {
  list(params = {}) {
    return this.getAll(params)
  },

  get(id) {
    return this.getById(id)
  },

  getAll(params = {}) {
    return apiClient.get('/categories', { params }).then((res) => res.data)
  },

  getById(id) {
    return apiClient.get(`/categories/${id}`).then((res) => res.data)
  },

  create(payload) {
    return apiClient.post('/categories', payload).then((res) => res.data)
  },

  update(id, payload) {
    return apiClient.put(`/categories/${id}`, payload).then((res) => res.data)
  },

  patch(id, payload) {
    return apiClient.patch(`/categories/${id}`, payload).then((res) => res.data)
  },

  remove(id) {
    return apiClient.delete(`/categories/${id}`).then((res) => res.data)
  }
}

// destinations
export const destinationsApi = {
  list(params = {}) {
    return this.getAll(params)
  },

  get(id) {
    return this.getById(id)
  },

  getAll(params = {}) {
    return apiClient.get('/destinations', { params }).then((res) => res.data)
  },

  getById(id) {
    return apiClient.get(`/destinations/${id}`).then((res) => res.data)
  },

  create(payload) {
    return apiClient.post('/destinations', payload).then((res) => res.data)
  },

  update(id, payload) {
    return apiClient.put(`/destinations/${id}`, payload).then((res) => res.data)
  },

  patch(id, payload) {
    return apiClient.patch(`/destinations/${id}`, payload).then((res) => res.data)
  },

  remove(id) {
    return apiClient.delete(`/destinations/${id}`).then((res) => res.data)
  }
}

// services
export const servicesApi = {
  list(params = {}) {
    return this.getAll(params)
  },

  get(id) {
    return this.getById(id)
  },

  getAll(params = {}) {
    return apiClient.get('/services', { params }).then((res) => res.data)
  },

  getById(id) {
    return apiClient.get(`/services/${id}`).then((res) => res.data)
  },

  create(payload) {
    return apiClient.post('/services', payload).then((res) => res.data)
  },

  update(id, payload) {
    return apiClient.put(`/services/${id}`, payload).then((res) => res.data)
  },

  patch(id, payload) {
    return apiClient.patch(`/services/${id}`, payload).then((res) => res.data)
  },

  remove(id) {
    return apiClient.delete(`/services/${id}`).then((res) => res.data)
  }
}

// bookings
export const bookingsApi = {
  list(params = {}) {
    return this.getAll(params)
  },

  get(id) {
    return this.getById(id)
  },

  getAll(params = {}) {
    return apiClient.get('/bookings', { params }).then((res) => res.data)
  },

  getById(id) {
    return apiClient.get(`/bookings/${id}`).then((res) => res.data)
  },

  create(payload) {
    return apiClient.post('/bookings', payload).then((res) => res.data)
  },

  update(id, payload) {
    return apiClient.put(`/bookings/${id}`, payload).then((res) => res.data)
  },

  patch(id, payload) {
    return apiClient.patch(`/bookings/${id}`, payload).then((res) => res.data)
  },

  remove(id) {
    return apiClient.delete(`/bookings/${id}`).then((res) => res.data)
  }
}

// comments
export const commentsApi = {
  list(params = {}) {
    return this.getAll(params)
  },

  get(id) {
    return this.getById(id)
  },

  getAll(params = {}) {
    return apiClient.get('/comments', { params }).then((res) => res.data)
  },

  getById(id) {
    return apiClient.get(`/comments/${id}`).then((res) => res.data)
  },

  create(payload) {
    return apiClient.post('/comments', payload).then((res) => res.data)
  },

  update(id, payload) {
    return apiClient.put(`/comments/${id}`, payload).then((res) => res.data)
  },

  patch(id, payload) {
    return apiClient.patch(`/comments/${id}`, payload).then((res) => res.data)
  },

  remove(id) {
    return apiClient.delete(`/comments/${id}`).then((res) => res.data)
  }
}

// promotions
export const promotionsApi = {
  list(params = {}) {
    return this.getAll(params)
  },

  get(id) {
    return this.getById(id)
  },

  getAll(params = {}) {
    return apiClient.get('/promotions', { params }).then((res) => res.data)
  },

  getById(id) {
    return apiClient.get(`/promotions/${id}`).then((res) => res.data)
  },

  create(payload) {
    return apiClient.post('/promotions', payload).then((res) => res.data)
  },

  update(id, payload) {
    return apiClient.put(`/promotions/${id}`, payload).then((res) => res.data)
  },

  patch(id, payload) {
    return apiClient.patch(`/promotions/${id}`, payload).then((res) => res.data)
  },

  remove(id) {
    return apiClient.delete(`/promotions/${id}`).then((res) => res.data)
  }
}

// users
export const usersApi = {
  list(params = {}) {
    return this.getAll(params)
  },

  get(id) {
    return this.getById(id)
  },

  getAll(params = {}) {
    return apiClient.get('/users', { params }).then((res) => res.data)
  },

  getById(id) {
    return apiClient.get(`/users/${id}`).then((res) => res.data)
  },

  create(payload) {
    return apiClient.post('/users', payload).then((res) => res.data)
  },

  update(id, payload) {
    return apiClient.put(`/users/${id}`, payload).then((res) => res.data)
  },

  patch(id, payload) {
    return apiClient.patch(`/users/${id}`, payload).then((res) => res.data)
  },

  remove(id) {
    return apiClient.delete(`/users/${id}`).then((res) => res.data)
  }
}

export async function seedUsersIfEmpty(defaultUsers = []) {
  const currentUsers = await usersApi.getAll()
  if (Array.isArray(currentUsers) && currentUsers.length > 0) return currentUsers

  for (const user of defaultUsers) {
    await usersApi.create(user)
  }

  return usersApi.getAll()
}

export async function apiHealthCheck() {
  await apiClient.get('/services?_limit=1')
}