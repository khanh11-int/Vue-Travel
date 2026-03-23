import { defineStore } from 'pinia'
import axios from 'axios'
import { APIURL } from '@/constaint'

export const useTravelApiStore = defineStore('travelApi', {
  state: () => ({
    services: [],
    categories: [],
    destinations: [],
    comments: [],
    promotions: [],
    bookings: [],
    users: [],
    serviceDetail: null,
    error: null,
    loading: false
  }),

  actions: {
    async fetchCollection({ endpoint, target, fallback = [] }) {
      this.loading = true
      try {
        const response = await axios.get(`${APIURL}/${endpoint}`)
        this[target] = Array.isArray(response.data) ? response.data : fallback
        this.error = null
      } catch (error) {
        this[target] = fallback
        this.error = error?.message || `Khong tai duoc du lieu tu ${endpoint}`
        console.error(`Loi khong tai duoc du lieu tu ${endpoint}:`, error)
      } finally {
        this.loading = false
      }
    },

    async fetchServices() {
      await this.fetchCollection({ endpoint: 'services', target: 'services' })
    },

    async fetchCategories() {
      await this.fetchCollection({ endpoint: 'categories', target: 'categories' })
    },

    async fetchDestinations() {
      await this.fetchCollection({ endpoint: 'destinations', target: 'destinations' })
    },

    async fetchComments() {
      await this.fetchCollection({ endpoint: 'comments', target: 'comments' })
    },

    async fetchPromotions() {
      await this.fetchCollection({ endpoint: 'promotions', target: 'promotions' })
    },

    async fetchBookings() {
      await this.fetchCollection({ endpoint: 'bookings', target: 'bookings' })
    },

    async fetchUsers() {
      await this.fetchCollection({ endpoint: 'users', target: 'users' })
    },

    async fetchServiceDetail(id) {
      this.loading = true
      try {
        const response = await axios.get(`${APIURL}/services/${id}`)
        this.serviceDetail = response.data || null
        this.error = null
      } catch (error) {
        this.serviceDetail = null
        this.error = error?.message || 'Khong tai duoc chi tiet dich vu'
        console.error('Loi khong tai duoc chi tiet dich vu:', error)
      } finally {
        this.loading = false
      }
    },

    async bootstrapTravelData() {
      await Promise.all([
        this.fetchServices(),
        this.fetchCategories(),
        this.fetchDestinations(),
        this.fetchComments(),
        this.fetchPromotions(),
        this.fetchBookings()
      ])
    },

    clearServiceDetail() {
      this.serviceDetail = null
    },

    clearError() {
      this.error = null
    }
  }
})
