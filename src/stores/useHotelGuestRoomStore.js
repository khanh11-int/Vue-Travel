import { defineStore } from 'pinia'
import {
  HOTEL_GUEST_ROOM_DEFAULTS,
  calculateTotalGuests,
  formatGuestRoomSummary,
  normalizeGuestRoomSelection,
  parseGuestRoomFromQuery,
  serializeChildrenAges
} from '@/utils/hotelGuestRoom'

export const useHotelGuestRoomStore = defineStore('hotelGuestRoom', {
  state: () => ({
    selection: normalizeGuestRoomSelection(HOTEL_GUEST_ROOM_DEFAULTS)
  }),

  getters: {
    totalGuests(state) {
      return calculateTotalGuests(state.selection)
    },

    summaryText(state) {
      return formatGuestRoomSummary(state.selection)
    }
  },

  actions: {
    setSelection(payload) {
      this.selection = normalizeGuestRoomSelection(payload)
    },

    setFromQuery(query = {}) {
      const parsed = parseGuestRoomFromQuery(query)
      if (!parsed) return
      this.selection = parsed
    },

    getQueryPayload() {
      const normalized = normalizeGuestRoomSelection(this.selection)
      const childrenAges = serializeChildrenAges(normalized.childrenAges)

      return {
        guests: String(normalized.adults + normalized.children),
        adults: String(normalized.adults),
        children: String(normalized.children),
        rooms: String(normalized.rooms),
        childrenAges
      }
    }
  }
})
