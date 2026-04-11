const normalizeAirportCode = (value) => String(value || '').trim().toUpperCase()

const normalizePassengerCount = (value, fallback) => {
  const parsed = Number(value ?? fallback)
  return Math.max(0, Number.isFinite(parsed) ? parsed : Number(fallback) || 0)
}

export const buildFlightSearchQuery = (payload = {}) => {
  const fromAirport = normalizeAirportCode(payload.fromAirport)
  const toAirport = normalizeAirportCode(payload.toAirport)
  const departDate = String(payload.departDate || '')
  const cabinClass = String(payload.cabinClass || 'economy').trim() || 'economy'

  const adults = Math.max(1, normalizePassengerCount(payload.adults ?? payload.passengers?.adults, 1))
  const children = normalizePassengerCount(payload.children ?? payload.passengers?.children, 0)
  const infants = normalizePassengerCount(payload.infants ?? payload.passengers?.infants, 0)

  return {
    fromAirport,
    toAirport,
    departDate,
    adults: String(adults),
    children: String(children),
    infants: String(infants),
    cabinClass
  }
}