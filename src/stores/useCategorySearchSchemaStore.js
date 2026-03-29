import { defineStore } from 'pinia'

/**
 * Store lưu state schema tìm kiếm theo category để các composable/view
 * chỉ làm nhiệm vụ bind route và computed, không tự giữ state local phức tạp.
 */
export const useCategorySearchSchemaStore = defineStore('category-search-schema', {
  state: () => ({
    form: {},
    formStateByCategory: {}
  }),

  actions: {
    /**
     * Set toàn bộ form cho mode single-state.
     * @param {Object} nextForm
     */
    setForm(nextForm) {
      this.form = nextForm && typeof nextForm === 'object' ? { ...nextForm } : {}
    },

    /**
     * Đảm bảo có state cho category id khi chạy mode storeByCategory.
     * @param {string} categoryId
     * @param {Object} defaultForm
     */
    ensureCategoryFormState(categoryId, defaultForm = {}) {
      const key = String(categoryId || '').trim()
      if (!key) return
      if (this.formStateByCategory[key]) return

      this.formStateByCategory = {
        ...this.formStateByCategory,
        [key]: { ...defaultForm }
      }
    },

    /**
     * Đồng bộ map state theo danh sách category hiện tại.
     * @param {Array<Object>} categories
     * @param {(category: Object) => Object} getDefaults
     */
    syncCategoryFormState(categories = [], getDefaults = () => ({})) {
      const nextState = { ...this.formStateByCategory }

      categories.forEach((category) => {
        const categoryId = String(category?.id || '').trim()
        if (!categoryId || nextState[categoryId]) return
        nextState[categoryId] = { ...(getDefaults(category) || {}) }
      })

      this.formStateByCategory = nextState
    },

    /**
     * Cập nhật field cho single-state hoặc per-category state.
     * @param {Object} payload
     * @param {boolean} payload.storeByCategory
     * @param {string} payload.categoryId
     * @param {string} payload.key
     * @param {*} payload.value
     */
    setFieldValue({ storeByCategory = false, categoryId = '', key = '', value }) {
      if (!key) return

      if (!storeByCategory) {
        this.form = {
          ...this.form,
          [key]: value
        }
        return
      }

      const categoryKey = String(categoryId || '').trim()
      if (!categoryKey) return

      const current = this.formStateByCategory[categoryKey] || {}
      this.formStateByCategory = {
        ...this.formStateByCategory,
        [categoryKey]: {
          ...current,
          [key]: value
        }
      }
    },

    /**
     * Lấy state form hiện hành theo mode.
     * @param {Object} payload
     * @param {boolean} payload.storeByCategory
     * @param {string} payload.categoryId
     * @returns {Object}
     */
    getCurrentFormState({ storeByCategory = false, categoryId = '' }) {
      if (!storeByCategory) return this.form || {}
      const key = String(categoryId || '').trim()
      if (!key) return {}
      return this.formStateByCategory[key] || {}
    }
  }
})
