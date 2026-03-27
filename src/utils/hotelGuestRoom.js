export const DEFAULT_CHILD_AGE = 8
export const MAX_CHILDREN = 6

export const HOTEL_GUEST_ROOM_DEFAULTS = {
  adults: 2,
  children: 0,
  rooms: 1,
  childrenAges: []
}

const normalizeInteger = (value, minimum) => {
  const normalized = Math.floor(Number(value) || 0)
  return Math.max(minimum, normalized)
}

const normalizeChildAge = (value) => {
  const age = Math.floor(Number(value))
  if (Number.isNaN(age)) return DEFAULT_CHILD_AGE
  return Math.min(17, Math.max(0, age))
}

export const normalizeGuestRoomSelection = (payload = {}) => {
  const adults = normalizeInteger(payload.adults, 1)
  const children = Math.min(MAX_CHILDREN, normalizeInteger(payload.children, 0))
  const rooms = normalizeInteger(payload.rooms, 1)
  const sourceAges = Array.isArray(payload.childrenAges) ? payload.childrenAges : []
  const normalizedAges = sourceAges.slice(0, children).map(normalizeChildAge)

  while (normalizedAges.length < children) {
    normalizedAges.push(DEFAULT_CHILD_AGE)
  }

  return {
    adults,
    children,
    rooms,
    childrenAges: normalizedAges
  }
}

export const calculateTotalGuests = (selection = {}) => {
  const normalized = normalizeGuestRoomSelection(selection)
  return normalized.adults + normalized.children
}

export const formatGuestRoomSummary = (selection = {}) => {
  const normalized = normalizeGuestRoomSelection(selection)
  return `${normalized.adults} người lớn, ${normalized.children} Trẻ em, ${normalized.rooms} phòng`
}

export const parseChildrenAgesParam = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => parseChildrenAgesParam(item))
  }

  if (value === undefined || value === null || value === '') return []

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeChildAge)
}

export const serializeChildrenAges = (childrenAges = []) => {
  const normalized = Array.isArray(childrenAges) ? childrenAges.map(normalizeChildAge) : []
  if (!normalized.length) return ''
  return normalized.join(',')
}

export const parseGuestRoomFromQuery = (query = {}) => {
  const hasAdults = query.adults !== undefined
  const hasChildren = query.children !== undefined
  const hasRooms = query.rooms !== undefined
  const hasChildrenAges = query.childrenAges !== undefined
  const hasGuests = query.guests !== undefined

  if (!hasAdults && !hasChildren && !hasRooms && !hasChildrenAges && !hasGuests) {
    return null
  }

  const parsedChildren = normalizeInteger(query.children, 0)
  const parsedGuests = normalizeInteger(query.guests, 1)
  const parsedAdults = hasAdults
    ? normalizeInteger(query.adults, 1)
    : Math.max(1, parsedGuests - parsedChildren)
  const parsedRooms = normalizeInteger(query.rooms, 1)

  return normalizeGuestRoomSelection({
    adults: parsedAdults,
    children: parsedChildren,
    rooms: parsedRooms,
    childrenAges: parseChildrenAgesParam(query.childrenAges)
  })
}
