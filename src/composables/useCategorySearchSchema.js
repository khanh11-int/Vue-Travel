import { computed, ref, watch } from 'vue'

const DEFAULT_GUEST_QUERY_KEYS = {
  guests: 'guests',
  adults: 'adults',
  children: 'children',
  rooms: 'rooms',
  childrenAges: 'childrenAges'
}

export const useCategorySearchSchema = ({
  route,
  serviceStore,
  guestRoomStore = null,
  activeCategoryId = null,
  storeByCategory = false,
  defaultSearchPath = '/dich-vu',
  includeRouteQueryDefaults = true,
  forceDefaultSearchPath = false
}) => {
  const todayISO = (() => {
    const now = new Date()
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 10)
  })()

  const getQueryValue = (key) => {
    if (!key) return ''
    const value = route.query[key]
    return Array.isArray(value) ? String(value[0] || '') : String(value || '')
  }

  const categories = computed(() => {
    return Array.isArray(serviceStore.categories)
      ? serviceStore.categories.filter((category) => category?.status !== 'inactive')
      : []
  })

  const matchedCategoryByPath = computed(() => {
    return categories.value.find((category) => category.searchPath === route.path || category.homePath === route.path) || null
  })

  const routeCategoryId = computed(() => {
    return String(route.query.category || matchedCategoryByPath.value?.id || categories.value[0]?.id || '')
  })

  const currentCategoryId = computed(() => {
    if (activeCategoryId?.value) return String(activeCategoryId.value)
    return routeCategoryId.value
  })

  watch(categories, (nextCategories) => {
    if (!activeCategoryId) return
    if (activeCategoryId.value) return

    activeCategoryId.value = routeCategoryId.value || String(nextCategories[0]?.id || '')
  }, { immediate: true })

  const activeCategory = computed(() => {
    return categories.value.find((category) => String(category.id) === currentCategoryId.value)
      || matchedCategoryByPath.value
      || categories.value[0]
      || null
  })

  const activeSearchConfig = computed(() => activeCategory.value?.searchConfig || null)
  const activeSearchFields = computed(() => {
    return Array.isArray(activeSearchConfig.value?.fields) ? activeSearchConfig.value.fields : []
  })

  const createDefaultFormState = (searchConfig = null) => {
    const defaults = searchConfig?.defaults && typeof searchConfig.defaults === 'object'
      ? { ...searchConfig.defaults }
      : {}
    const fields = Array.isArray(searchConfig?.fields) ? searchConfig.fields : []

    fields.forEach((field) => {
      if (field.type === 'guest-room') return

      if (field.type === 'date-range') {
        const startKey = field.startKey || 'startDate'
        const endKey = field.endKey || 'endDate'
        const startQueryKey = field.startQueryKey || startKey
        const endQueryKey = field.endQueryKey || endKey

        const startQueryValue = includeRouteQueryDefaults ? getQueryValue(startQueryKey) : ''
        const endQueryValue = includeRouteQueryDefaults ? getQueryValue(endQueryKey) : ''

        defaults[startKey] = startQueryValue || defaults[startKey] || ''
        defaults[endKey] = endQueryValue || defaults[endKey] || ''
        return
      }

      const key = field.key
      if (!key) return

      const queryKey = field.queryKey || key
      const queryValue = includeRouteQueryDefaults ? getQueryValue(queryKey) : ''

      if (field.type === 'number') {
        const minimum = Number(field.min || 1)
        const parsed = Number(queryValue || defaults[key] || field.defaultValue || minimum)
        defaults[key] = Math.max(minimum, Number.isFinite(parsed) ? parsed : minimum)
        return
      }

      defaults[key] = queryValue || defaults[key] || ''
    })

    return defaults
  }

  const applyGuestRoomFromQuery = () => {
    if (!guestRoomStore) return
    if (!includeRouteQueryDefaults) return

    const guestField = activeSearchFields.value.find((field) => field.type === 'guest-room')
    if (!guestField) return

    const queryKeys = { ...DEFAULT_GUEST_QUERY_KEYS, ...(guestField.queryKeys || {}) }
    guestRoomStore.setFromQuery({
      guests: getQueryValue(queryKeys.guests),
      adults: getQueryValue(queryKeys.adults),
      children: getQueryValue(queryKeys.children),
      rooms: getQueryValue(queryKeys.rooms),
      childrenAges: getQueryValue(queryKeys.childrenAges)
    })
  }

  const form = ref({})
  const formStateByCategory = ref({})

  if (storeByCategory) {
    watch([activeSearchConfig, currentCategoryId], () => {
      const categoryId = currentCategoryId.value
      if (!categoryId) return

      if (!formStateByCategory.value[categoryId]) {
        formStateByCategory.value = {
          ...formStateByCategory.value,
          [categoryId]: createDefaultFormState(activeSearchConfig.value)
        }
      }
    }, { immediate: true })

    watch([categories, activeSearchConfig], () => {
      const nextState = { ...formStateByCategory.value }

      categories.value.forEach((category) => {
        const categoryId = String(category.id)
        if (nextState[categoryId]) return
        nextState[categoryId] = createDefaultFormState(category.searchConfig || null)
      })

      formStateByCategory.value = nextState
    }, { immediate: true })
  } else {
    watch([activeSearchConfig, () => route.fullPath], () => {
      form.value = createDefaultFormState(activeSearchConfig.value)
      applyGuestRoomFromQuery()
    }, { immediate: true })
  }

  const currentFormState = computed(() => {
    if (!storeByCategory) return form.value

    const categoryId = currentCategoryId.value
    if (!categoryId) return {}
    return formStateByCategory.value[categoryId] || {}
  })

  const updateFieldValue = (key, value) => {
    if (!key) return

    if (!storeByCategory) {
      form.value = {
        ...form.value,
        [key]: value
      }
      return
    }

    const categoryId = currentCategoryId.value
    if (!categoryId) return

    const current = formStateByCategory.value[categoryId] || {}
    formStateByCategory.value = {
      ...formStateByCategory.value,
      [categoryId]: {
        ...current,
        [key]: value
      }
    }
  }

  const guestRoomSelection = computed({
    get: () => guestRoomStore?.selection || {},
    set: (value) => {
      if (!guestRoomStore) return
      guestRoomStore.setSelection(value)
    }
  })

  const searchButtonLabel = computed(() => {
    return activeSearchConfig.value?.submitLabel || 'Tìm dịch vụ'
  })

  const searchBasePath = computed(() => {
    if (forceDefaultSearchPath) return defaultSearchPath
    return activeCategory.value?.searchPath || defaultSearchPath
  })

  const searchTarget = computed(() => {
    const query = new URLSearchParams()
    if (currentCategoryId.value) {
      query.set('category', currentCategoryId.value)
    }

    activeSearchFields.value.forEach((field) => {
      if (field.type === 'guest-room') {
        if (!guestRoomStore) return

        const guestRoomQuery = guestRoomStore.getQueryPayload()
        const queryKeys = { ...DEFAULT_GUEST_QUERY_KEYS, ...(field.queryKeys || {}) }

        query.set(queryKeys.guests, guestRoomQuery.guests)
        query.set(queryKeys.adults, guestRoomQuery.adults)
        query.set(queryKeys.children, guestRoomQuery.children)
        query.set(queryKeys.rooms, guestRoomQuery.rooms)

        if (guestRoomQuery.childrenAges) {
          query.set(queryKeys.childrenAges, guestRoomQuery.childrenAges)
        }
        return
      }

      if (field.type === 'date-range') {
        const startKey = field.startKey || 'startDate'
        const endKey = field.endKey || 'endDate'
        const startValue = currentFormState.value[startKey]
        const endValue = currentFormState.value[endKey]

        if (startValue) query.set(field.startQueryKey || startKey, startValue)
        if (endValue) query.set(field.endQueryKey || endKey, endValue)
        return
      }

      if (!field.key) return

      if (field.type === 'number') {
        const min = Number(field.min || 1)
        const raw = Number(currentFormState.value[field.key] || field.defaultValue || min)
        const normalized = Math.max(min, Number.isFinite(raw) ? raw : min)
        query.set(field.queryKey || field.key, String(normalized))
        return
      }

      const fieldValue = currentFormState.value[field.key]
      if (fieldValue) {
        query.set(field.queryKey || field.key, String(fieldValue))
      }
    })

    return `${searchBasePath.value}?${query.toString()}`
  })

  return {
    todayISO,
    categories,
    activeCategory,
    currentCategoryId,
    activeSearchConfig,
    activeSearchFields,
    form: currentFormState,
    updateFieldValue,
    guestRoomSelection,
    searchButtonLabel,
    searchTarget
  }
}
