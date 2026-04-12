import { buildFlightSearchQuery } from '@/utils/flightSearchRoute'

const DEFAULT_GUEST_QUERY_KEYS = {
  guests: 'guests',
  adults: 'adults',
  children: 'children',
  rooms: 'rooms',
  childrenAges: 'childrenAges'
}

export const getTodayISO = () => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const readQueryValue = (query = {}, key = '') => {
  if (!key) return ''
  const value = query[key]
  return Array.isArray(value) ? String(value[0] || '') : String(value || '')
}

const normalizeChildrenAges = (source, children, fallbackAge = 8) => {
  const list = Array.isArray(source)
    ? source
    : String(source || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

  return list
    .slice(0, Math.max(0, Number(children || 0) || 0))
    .map((age) => Math.min(17, Math.max(1, Number(age) || fallbackAge)))
}

export const createSearchModelByCategory = ({ categoryId = '', searchConfig = null, routeQuery = {}, todayISO = getTodayISO() }) => {
  const resolvedCategoryId = String(categoryId || '').trim()
  const fields = Array.isArray(searchConfig?.fields) ? searchConfig.fields : []
  const defaults = searchConfig?.defaults && typeof searchConfig.defaults === 'object' ? { ...searchConfig.defaults } : {}

  const model = {}

  fields.forEach((field) => {
    if (field.type === 'guest-room') return

    if (field.type === 'date-range') {
      const startKey = field.startKey || 'startDate'
      const endKey = field.endKey || 'endDate'
      model[startKey] = readQueryValue(routeQuery, field.startQueryKey || startKey) || defaults[startKey] || ''
      model[endKey] = readQueryValue(routeQuery, field.endQueryKey || endKey) || defaults[endKey] || ''
      return
    }

    const key = field.key
    if (!key) return

    const queryValue = readQueryValue(routeQuery, field.queryKey || key)
    if (field.type === 'number') {
      const min = Number(field.min || 1)
      const parsed = Number(queryValue || defaults[key] || field.defaultValue || min)
      model[key] = Math.max(min, Number.isFinite(parsed) ? parsed : min)
      return
    }

    model[key] = queryValue || defaults[key] || ''
  })

  // Keep all guest/traveler selectors inside one shared model so UnifiedSearchPanel can stay stateless.
  if (resolvedCategoryId === 'hotel') {
    const adults = Math.max(1, Number(readQueryValue(routeQuery, 'adults') || 1) || 1)
    const children = Math.max(0, Number(readQueryValue(routeQuery, 'children') || 0) || 0)
    const rooms = Math.max(1, Number(readQueryValue(routeQuery, 'rooms') || 1) || 1)

    model.guestRoomSelection = {
      adults,
      children,
      rooms,
      childrenAges: normalizeChildrenAges(readQueryValue(routeQuery, 'childrenAges'), children)
    }
  }

  if (resolvedCategoryId === 'ticket') {
    const tickets = Math.max(1, Number(readQueryValue(routeQuery, 'ticketQuantity') || readQueryValue(routeQuery, 'adults') || readQueryValue(routeQuery, 'quantity') || 2) || 2)
    const children = Math.max(0, Number(readQueryValue(routeQuery, 'children') || 0) || 0)

    model.ticketGuestSelection = {
      tickets,
      children,
      childrenAges: normalizeChildrenAges(readQueryValue(routeQuery, 'childrenAges'), children)
    }
  }

  if (resolvedCategoryId === 'tour') {
    const adults = Math.max(1, Number(readQueryValue(routeQuery, 'adults') || readQueryValue(routeQuery, 'travelers') || readQueryValue(routeQuery, 'quantity') || 2) || 2)
    const children = Math.max(0, Number(readQueryValue(routeQuery, 'children') || 0) || 0)

    model.tourTravelerSelection = {
      adults,
      children,
      childrenAges: normalizeChildrenAges(readQueryValue(routeQuery, 'childrenAges'), children)
    }
  }

  if (resolvedCategoryId === 'flight') {
    const adults = Math.max(1, Number(readQueryValue(routeQuery, 'adults') || 1) || 1)
    const children = Math.max(0, Number(readQueryValue(routeQuery, 'children') || 0) || 0)
    const infants = Math.max(0, Number(readQueryValue(routeQuery, 'infants') || 0) || 0)

    model.fromAirport = String(readQueryValue(routeQuery, 'fromAirport') || model.fromAirport || 'HAN').trim().toUpperCase()
    model.toAirport = String(readQueryValue(routeQuery, 'toAirport') || model.toAirport || 'SGN').trim().toUpperCase()
    model.departDate = String(readQueryValue(routeQuery, 'departDate') || model.departDate || todayISO)
    model.cabinClass = String(readQueryValue(routeQuery, 'cabinClass') || model.cabinClass || 'economy')
    model.passengers = {
      adults,
      children,
      infants
    }
  }

  return model
}

const buildGuestQuery = (categoryId, field, modelValue = {}) => {
  const queryKeys = { ...DEFAULT_GUEST_QUERY_KEYS, ...(field?.queryKeys || {}) }

  if (categoryId === 'hotel') {
    const selection = modelValue.guestRoomSelection || {}
    const adults = Math.max(1, Number(selection.adults || 1) || 1)
    const children = Math.max(0, Number(selection.children || 0) || 0)
    const rooms = Math.max(1, Number(selection.rooms || 1) || 1)
    const childrenAges = normalizeChildrenAges(selection.childrenAges, children)

    return {
      [queryKeys.guests]: String(adults + children),
      [queryKeys.adults]: String(adults),
      [queryKeys.children]: String(children),
      [queryKeys.rooms]: String(rooms),
      ...(childrenAges.length ? { [queryKeys.childrenAges]: childrenAges.join(',') } : {})
    }
  }

  if (categoryId === 'ticket') {
    const selection = modelValue.ticketGuestSelection || {}
    const tickets = Math.max(1, Number(selection.tickets || 1) || 1)
    const children = Math.max(0, Number(selection.children || 0) || 0)
    const childrenAges = normalizeChildrenAges(selection.childrenAges, children)

    return {
      ticketQuantity: String(tickets),
      adults: String(tickets),
      children: String(children),
      quantity: String(tickets + children),
      ...(childrenAges.length ? { childrenAges: childrenAges.join(',') } : {})
    }
  }

  if (categoryId === 'tour') {
    const selection = modelValue.tourTravelerSelection || {}
    const adults = Math.max(1, Number(selection.adults || 1) || 1)
    const children = Math.max(0, Number(selection.children || 0) || 0)
    const childrenAges = normalizeChildrenAges(selection.childrenAges, children)

    return {
      travelers: String(adults + children),
      adults: String(adults),
      children: String(children),
      quantity: String(adults + children),
      ...(childrenAges.length ? { childrenAges: childrenAges.join(',') } : {})
    }
  }

  return {}
}

export const buildSearchQueryByCategory = ({
  category,
  searchConfig = null,
  modelValue = {},
  targetPath = ''
}) => {
  const categoryId = String(category?.id || category || '').trim()
  const fields = Array.isArray(searchConfig?.fields) ? searchConfig.fields : []

  if (categoryId === 'flight') {
    const fromAirport = String(modelValue.fromAirport || '').trim().toUpperCase()
    const toAirport = String(modelValue.toAirport || '').trim().toUpperCase()
    const departDate = String(modelValue.departDate || '')
    const passengers = modelValue.passengers && typeof modelValue.passengers === 'object'
      ? modelValue.passengers
      : {}
    const adults = Math.max(1, Number(passengers.adults || 1) || 1)
    const children = Math.max(0, Number(passengers.children || 0) || 0)
    const infants = Math.max(0, Number(passengers.infants || 0) || 0)

    const todayISO = getTodayISO()
    const errors = []

    if (!fromAirport || !toAirport) errors.push('Vui long chon diem di va diem den.')
    if (fromAirport && toAirport && fromAirport === toAirport) errors.push('Diem di va diem den khong duoc trung nhau.')
    if (!departDate || departDate < todayISO) errors.push('Ngay bay phai tu hom nay tro di.')
    if (infants > adults) errors.push('So em be khong duoc vuot so nguoi lon.')

    if (errors.length) {
      return {
        path: '/ve-may-bay/ket-qua',
        query: {},
        errors
      }
    }

    return {
      path: '/ve-may-bay/ket-qua',
      query: buildFlightSearchQuery({
        fromAirport,
        toAirport,
        departDate,
        cabinClass: String(modelValue.cabinClass || 'economy').trim() || 'economy',
        adults,
        children,
        infants
      }),
      errors: []
    }
  }

  const query = {}
  if (categoryId) {
    query.category = categoryId
  }

  fields.forEach((field) => {
    if (field.type === 'guest-room') {
      Object.assign(query, buildGuestQuery(categoryId, field, modelValue))
      return
    }

    if (field.type === 'date-range') {
      const startKey = field.startKey || 'startDate'
      const endKey = field.endKey || 'endDate'
      const startValue = modelValue[startKey]
      const endValue = modelValue[endKey]

      if (startValue) query[field.startQueryKey || startKey] = String(startValue)
      if (endValue) query[field.endQueryKey || endKey] = String(endValue)
      return
    }

    if (!field.key) return

    if (field.type === 'number') {
      const min = Number(field.min || 1)
      const raw = Number(modelValue[field.key] || field.defaultValue || min)
      query[field.queryKey || field.key] = String(Math.max(min, Number.isFinite(raw) ? raw : min))
      return
    }

    const fieldValue = modelValue[field.key]
    if (fieldValue) {
      query[field.queryKey || field.key] = String(fieldValue)
    }
  })

  return {
    path: targetPath || searchConfig?.searchPath || category?.searchPath || '/dich-vu',
    query,
    errors: []
  }
}
