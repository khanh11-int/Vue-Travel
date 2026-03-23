import { defineStore } from 'pinia'

export const useSearchStore = defineStore('search', {
  state: () => ({
    keyword: '',
    category: '',
    destination: '',
    date: '',
    sortBy: 'popular',
    priceRange: [0, 10000000],
    guests: 1
  }),

  getters: {
    hasActiveFilters(state) {
      return (
        state.keyword !== ''
        || state.category !== ''
        || state.destination !== ''
        || state.date !== ''
        || state.sortBy !== 'popular'
        || state.priceRange[0] !== 0
        || state.priceRange[1] !== 10000000
        || state.guests !== 1
      )
    }
  },

  actions: {
    setKeyword(value) {
      this.keyword = String(value || '')
    },

    setCategory(value) {
      this.category = String(value || '')
    },

    setDestination(value) {
      this.destination = String(value || '')
    },

    setDate(value) {
      this.date = String(value || '')
    },

    setSortBy(value) {
      this.sortBy = String(value || 'popular')
    },

    setPriceRange(min, max) {
      this.priceRange = [Math.max(0, Number(min) || 0), Math.max(0, Number(max) || 10000000)]
    },

    setGuests(value) {
      this.guests = Math.max(1, Number(value) || 1)
    },

    resetFilters() {
      this.keyword = ''
      this.category = ''
      this.destination = ''
      this.date = ''
      this.sortBy = 'popular'
      this.priceRange = [0, 10000000]
      this.guests = 1
    }
  }
})
