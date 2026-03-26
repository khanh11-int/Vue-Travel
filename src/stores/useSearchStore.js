import { defineStore } from 'pinia'

export const useSearchStore = defineStore('search', {
  /**
   * Khởi tạo state bộ lọc tìm kiếm với giá trị mặc định cho UI.
   * @returns {Object} Search state mặc định.
   */
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
    /**
     * Kiểm tra có bộ lọc nào đang được áp dụng ngoài giá trị mặc định hay không.
     * @param {Object} state - Search state hiện tại.
     * @returns {boolean} True nếu có filter đang active.
     */
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
    /**
     * Cập nhật từ khóa tìm kiếm.
     * @param {string} value - Từ khóa người dùng nhập.
     * @returns {void}
     */
    setKeyword(value) {
      this.keyword = String(value || '')
    },

    /**
     * Cập nhật category filter hiện tại.
     * @param {string} value - Mã category.
     * @returns {void}
     */
    setCategory(value) {
      this.category = String(value || '')
    },

    /**
     * Cập nhật điểm đến filter.
     * @param {string} value - Tên điểm đến.
     * @returns {void}
     */
    setDestination(value) {
      this.destination = String(value || '')
    },

    /**
     * Cập nhật ngày tìm kiếm chính.
     * @param {string} value - Ngày tìm kiếm từ UI.
     * @returns {void}
     */
    setDate(value) {
      this.date = String(value || '')
    },

    /**
     * Cập nhật tiêu chí sắp xếp kết quả.
     * @param {string} value - Kiểu sort mong muốn.
     * @returns {void}
     */
    setSortBy(value) {
      this.sortBy = String(value || 'popular')
    },

    /**
     * Cập nhật khoảng giá và ép về số không âm để tránh filter lỗi.
     * @param {number|string} min - Giá tối thiểu.
     * @param {number|string} max - Giá tối đa.
     * @returns {void}
     */
    setPriceRange(min, max) {
      this.priceRange = [Math.max(0, Number(min) || 0), Math.max(0, Number(max) || 10000000)]
    },

    /**
     * Cập nhật số lượng khách tối thiểu bằng 1.
     * @param {number|string} value - Số khách.
     * @returns {void}
     */
    setGuests(value) {
      this.guests = Math.max(1, Number(value) || 1)
    },

    /**
     * Đưa toàn bộ filter về trạng thái mặc định.
     * @returns {void}
     */
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
