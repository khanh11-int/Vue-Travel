import apiClient from '@/services/axios'

const listResources = async (resource, params = {}) => {
  const response = await apiClient.get(`/${resource}`, { params })
  return response.data
}

const getResource = async (resource, id) => {
  const response = await apiClient.get(`/${resource}/${id}`)
  return response.data
}

const createResource = async (resource, payload) => {
  const response = await apiClient.post(`/${resource}`, payload)
  return response.data
}

const updateResource = async (resource, id, payload) => {
  const response = await apiClient.put(`/${resource}/${id}`, payload)
  return response.data
}

const patchResource = async (resource, id, payload) => {
  const response = await apiClient.patch(`/${resource}/${id}`, payload)
  return response.data
}

const deleteResource = async (resource, id) => {
  await apiClient.delete(`/${resource}/${id}`)
}

const buildEntityApi = (resourceName) => ({
  list: (params = {}) => listResources(resourceName, params),
  getById: (id) => getResource(resourceName, id),
  create: (payload) => createResource(resourceName, payload),
  update: (id, payload) => updateResource(resourceName, id, payload),
  patch: (id, payload) => patchResource(resourceName, id, payload),
  remove: (id) => deleteResource(resourceName, id)
})

export const categoriesApi = buildEntityApi('categories')
export const destinationsApi = buildEntityApi('destinations')
export const servicesApi = buildEntityApi('services')
export const bookingsApi = buildEntityApi('bookings')
export const commentsApi = buildEntityApi('comments')
export const promotionsApi = buildEntityApi('promotions')
export const usersApi = buildEntityApi('users')

export const seedUsersIfEmpty = async (defaultUsers = []) => {
  const currentUsers = await usersApi.list()
  if (Array.isArray(currentUsers) && currentUsers.length > 0) return currentUsers

  for (const user of defaultUsers) {
    await usersApi.create(user)
  }

  return usersApi.list()
}

export const apiHealthCheck = async () => {
  await apiClient.get('/services?_limit=1')
}
