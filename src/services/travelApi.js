import apiClient from '@/api/axios'

export const fetchTravelBootstrap = async () => {
  const [categories, destinations, services, comments, promotions, adminSummary] = await Promise.all([
    apiClient.get('/categories'),
    apiClient.get('/destinations'),
    apiClient.get('/services'),
    apiClient.get('/comments'),
    apiClient.get('/promotions'),
    apiClient.get('/adminSummary')
  ])

  return {
    categories: categories.data,
    destinations: destinations.data,
    services: services.data,
    comments: comments.data,
    promotions: promotions.data,
    adminSummary: adminSummary.data
  }
}
