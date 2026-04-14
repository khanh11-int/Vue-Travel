import { defineStore } from 'pinia'
import { flightBookingsApi, flightsApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth/useAuthStore'

const AIRPORTS = Object.freeze([
  { code: 'HAN', name: 'Nội Bài' },
  { code: 'SGN', name: 'Tân Sơn Nhất' },
  { code: 'DAD', name: 'Đà Nẵng' },
  { code: 'CXR', name: 'Cam Ranh' },
  { code: 'VCA', name: 'Cần Thơ' },
  { code: 'PQC', name: 'Phú Quốc' },
  { code: 'HPH', name: 'Cát Bi' },
  { code: 'VII', name: 'Vinh' },
  { code: 'HUI', name: 'Phú Bài' },
  { code: 'DLI', name: 'Liên Khương' },
  { code: 'VDO', name: 'Vân Đồn' },
  { code: 'DIN', name: 'Điện Biên' },
  { code: 'VDH', name: 'Đồng Hới' },
  { code: 'VCL', name: 'Chu Lai' },
  { code: 'UIH', name: 'Phù Cát' },
  { code: 'TBB', name: 'Tuy Hòa' },
  { code: 'PXU', name: 'Pleiku' },
  { code: 'BMV', name: 'Buôn Ma Thuột' },
  { code: 'THD', name: 'Thọ Xuân' },
  { code: 'VKG', name: 'Rạch Giá' },
  { code: 'CAH', name: 'Cà Mau' },
  { code: 'VCS', name: 'Côn Đảo' }
])

const CABIN_OPTIONS = Object.freeze([
  { value: 'economy', label: 'Phổ thông' },
  { value: 'premium', label: 'Phổ thông đặc biệt' },
  { value: 'business', label: 'Thương gia' }
])

const TIME_WINDOWS = Object.freeze([
  { value: 'early', label: '00:00 - 05:59', fromHour: 0, toHour: 5 },
  { value: 'morning', label: '06:00 - 11:59', fromHour: 6, toHour: 11 },
  { value: 'afternoon', label: '12:00 - 17:59', fromHour: 12, toHour: 17 },
  { value: 'evening', label: '18:00 - 23:59', fromHour: 18, toHour: 23 }
])

const BAGGAGE_OPTIONS = Object.freeze([
  { kg: 0, label: '+0 kg', price: 0 },
  { kg: 20, label: '+20 kg', price: 432985 },
  { kg: 30, label: '+30 kg', price: 544854 },
  { kg: 40, label: '+40 kg', price: 656722 },
  { kg: 50, label: '+50 kg', price: 824656 },
  { kg: 60, label: '+60 kg', price: 936788 },
  { kg: 70, label: '+70 kg', price: 1048657 }
])

const toTodayISO = () => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const normalizeAirportCode = (value) => String(value || '').trim().toUpperCase()
const ensureArray = (value) => (Array.isArray(value) ? value : [])

const buildDefaultSearchParams = () => ({
  fromAirport: 'HAN',
  toAirport: 'SGN',
  departDate: toTodayISO(),
  passengers: {
    adults: 1,
    children: 0,
    infants: 0
  },
  cabinClass: 'economy'
})

const buildDefaultFilters = () => ({
  airlines: [],
  timeWindows: [],
  priceRange: [0, 10000000]
})

const toPassengerTotal = (passengers = {}) => {
  const adults = Math.max(1, Number(passengers.adults || 1) || 1)
  const children = Math.max(0, Number(passengers.children || 0) || 0)
  const infants = Math.max(0, Number(passengers.infants || 0) || 0)
  return adults + children + infants
}

const resolveCabinFare = (flight, cabinClass = 'economy') => {
  const fares = flight?.cabinFares && typeof flight.cabinFares === 'object' ? flight.cabinFares : {}
  const fallbackOrder = [cabinClass, 'economy', 'premium', 'business']

  for (const key of fallbackOrder) {
    const fare = fares[key]
    if (!fare) continue

    return {
      cabinClass: key,
      label: String(fare.label || key),
      price: Math.max(0, Number(fare.price || 0) || 0),
      baggage: String(fare.baggage || ''),
      refundPolicy: String(fare.refundPolicy || ''),
      seatLeft: Math.max(0, Number(fare.seatLeft || 0) || 0)
    }
  }

  return {
    cabinClass,
    label: cabinClass,
    price: Math.max(0, Number(flight?.basePrice || 0) || 0),
    baggage: '',
    refundPolicy: '',
    seatLeft: Math.max(0, Number(flight?.availableSeats || 0) || 0)
  }
}

const hourOfTime = (value) => {
  const normalized = String(value || '').trim()
  if (!normalized.includes(':')) return -1
  const [hour] = normalized.split(':')
  const parsed = Number(hour)
  return Number.isFinite(parsed) ? parsed : -1
}

const isInTimeWindow = (timeValue, selectedWindows = []) => {
  const windows = ensureArray(selectedWindows)
  if (!windows.length) return true

  const hour = hourOfTime(timeValue)
  if (hour < 0) return false

  const availableWindows = TIME_WINDOWS.filter((window) => windows.includes(window.value))
  return availableWindows.some((window) => hour >= window.fromHour && hour <= window.toHour)
}

const sortFlights = (flights, sortBy = 'price-lowest') => {
  const source = ensureArray(flights).slice()

  if (sortBy === 'depart-earliest') {
    return source.sort((left, right) => {
      const leftHour = hourOfTime(left.departureTime)
      const rightHour = hourOfTime(right.departureTime)
      return leftHour - rightHour
    })
  }

  if (sortBy === 'duration-shortest') {
    return source.sort((left, right) => Number(left.durationMinutes || 0) - Number(right.durationMinutes || 0))
  }

  return source.sort((left, right) => Number(left.effectiveFare || 0) - Number(right.effectiveFare || 0))
}

const getBaggagePrice = (kg = 0) => {
  const normalizedKg = Math.max(0, Number(kg || 0) || 0)
  const matched = BAGGAGE_OPTIONS.find((item) => Number(item.kg) === normalizedKg)
  return matched ? Math.max(0, Number(matched.price || 0) || 0) : 0
}

export const useFlightStore = defineStore('flight', {
  state: () => ({
    airports: AIRPORTS,
    cabinOptions: CABIN_OPTIONS,
    baggageOptions: BAGGAGE_OPTIONS,
    timeWindows: TIME_WINDOWS,
    searchParams: buildDefaultSearchParams(),
    filters: buildDefaultFilters(),
    sortBy: 'price-lowest',
    flights: [],
    selectedFlightId: '',
    selectedFare: null,
    paymentMethod: 'cash',
    contactForm: {
      fullName: '',
      email: '',
      phone: ''
    },
    passengerForms: [],
    bookingResult: null,
    loading: false,
    error: null,
    validationErrors: {}
  }),

  getters: {
    totalPassengers(state) {
      return toPassengerTotal(state.searchParams.passengers)
    },

    selectedFlight(state) {
      return state.flights.find((flight) => String(flight.id) === String(state.selectedFlightId)) || null
    },

    processedFlights(state) {
      const { filters, sortBy } = state
      const { airlines, timeWindows, priceRange } = filters
      const [priceMin, priceMax] = Array.isArray(priceRange) ? priceRange : [0, 10000000]

      const filtered = ensureArray(state.flights).filter((flight) => {
        if (ensureArray(airlines).length && !airlines.includes(flight.airlineCode)) return false
        if (!isInTimeWindow(flight.departureTime, timeWindows)) return false

        const effectiveFare = Number(flight.effectiveFare || 0)
        if (effectiveFare < Number(priceMin || 0)) return false
        if (effectiveFare > Number(priceMax || Number.MAX_SAFE_INTEGER)) return false

        const seats = Math.max(0, Number(flight.effectiveSeatLeft || 0) || 0)
        if (seats < this.totalPassengers) return false

        return true
      })

      return sortFlights(filtered, sortBy)
    },

    airlineOptions(state) {
      const seen = new Set()
      return ensureArray(state.flights)
        .filter((flight) => {
          if (!flight.airlineCode || seen.has(flight.airlineCode)) return false
          seen.add(flight.airlineCode)
          return true
        })
        .map((flight) => ({
          code: flight.airlineCode,
          name: flight.airlineName || flight.airlineCode
        }))
    },

    canConfirmBooking(state) {
      return Boolean(state.selectedFare && state.selectedFlightId)
    },

    baseFareTotal(state) {
      const unitPrice = Math.max(0, Number(state.selectedFare?.price || 0) || 0)
      return unitPrice * this.totalPassengers
    },

    baggageTotal(state) {
      return ensureArray(state.passengerForms).reduce((total, passenger) => {
        const kg = Math.max(0, Number(passenger?.checkedBaggageKg || 0) || 0)
        return total + getBaggagePrice(kg)
      }, 0)
    },

    totalAmount() {
      return this.baseFareTotal + this.baggageTotal
    }
  },

  actions: {
    hydrateFromQuery(query = {}) {
      const fromAirport = normalizeAirportCode(query.fromAirport || this.searchParams.fromAirport)
      const toAirport = normalizeAirportCode(query.toAirport || this.searchParams.toAirport)
      const departDate = String(query.departDate || this.searchParams.departDate || toTodayISO())
      const adults = Math.max(1, Number(query.adults || this.searchParams.passengers.adults || 1) || 1)
      const children = Math.max(0, Number(query.children || this.searchParams.passengers.children || 0) || 0)
      const infants = Math.max(0, Number(query.infants || this.searchParams.passengers.infants || 0) || 0)
      const cabinClass = String(query.cabinClass || this.searchParams.cabinClass || 'economy')

      this.searchParams = {
        fromAirport,
        toAirport,
        departDate,
        passengers: {
          adults,
          children,
          infants
        },
        cabinClass
      }

      this.ensurePassengerForms()
    },

    updateSearchField(key, value) {
      if (key === 'fromAirport' || key === 'toAirport') {
        this.searchParams[key] = normalizeAirportCode(value)
        return
      }

      if (key === 'departDate' || key === 'cabinClass') {
        this.searchParams[key] = String(value || '')
      }
    },

    updatePassengers(payload = {}) {
      const adults = Math.max(1, Number(payload.adults ?? this.searchParams.passengers.adults) || 1)
      const children = Math.max(0, Number(payload.children ?? this.searchParams.passengers.children) || 0)
      const infants = Math.max(0, Number(payload.infants ?? this.searchParams.passengers.infants) || 0)

      this.searchParams.passengers = { adults, children, infants }
      this.ensurePassengerForms()
    },

    swapAirports() {
      const nextFrom = this.searchParams.toAirport
      const nextTo = this.searchParams.fromAirport
      this.searchParams.fromAirport = nextFrom
      this.searchParams.toAirport = nextTo
    },

    setFilters(payload = {}) {
      const normalizedAirlines = ensureArray(payload.airlines ?? this.filters.airlines).map((item) => String(item || ''))
      const normalizedTime = ensureArray(payload.timeWindows ?? this.filters.timeWindows).map((item) => String(item || ''))
      const nextPriceRange = Array.isArray(payload.priceRange) ? payload.priceRange : this.filters.priceRange
      const [priceMin, priceMax] = nextPriceRange

      this.filters = {
        airlines: normalizedAirlines,
        timeWindows: normalizedTime,
        priceRange: [
          Math.max(0, Number(priceMin || 0) || 0),
          Math.max(0, Number(priceMax || 10000000) || 10000000)
        ]
      }
    },

    setSortBy(value) {
      this.sortBy = String(value || 'price-lowest')
    },

    ensurePassengerForms() {
      const adults = Math.max(1, Number(this.searchParams.passengers.adults || 1) || 1)
      const children = Math.max(0, Number(this.searchParams.passengers.children || 0) || 0)
      const infants = Math.max(0, Number(this.searchParams.passengers.infants || 0) || 0)

      const desired = [
        ...Array.from({ length: adults }, (_, index) => ({ type: 'adult', index: index + 1 })),
        ...Array.from({ length: children }, (_, index) => ({ type: 'child', index: index + 1 })),
        ...Array.from({ length: infants }, (_, index) => ({ type: 'infant', index: index + 1 }))
      ]

      this.passengerForms = desired.map((descriptor, index) => {
        const existing = this.passengerForms[index]
        return {
          type: descriptor.type,
          fullName: existing?.fullName || '',
          gender: existing?.gender || 'male',
          dob: existing?.dob || '',
          passportOrId: existing?.passportOrId || '',
          checkedBaggageKg: Math.max(0, Number(existing?.checkedBaggageKg || 0) || 0)
        }
      })
    },

    updatePassengerBaggage(index, kg) {
      const passenger = this.passengerForms[index]
      if (!passenger) return

      const normalizedKg = Math.max(0, Number(kg || 0) || 0)
      if (passenger.type === 'infant' && normalizedKg > 0) {
        passenger.checkedBaggageKg = 0
        return
      }

      const matched = this.baggageOptions.find((item) => Number(item.kg) === normalizedKg)
      passenger.checkedBaggageKg = matched ? normalizedKg : 0
    },

    setPaymentMethod(method) {
      const normalized = String(method || 'cash').trim()
      this.paymentMethod = normalized === 'vietqr' ? 'vietqr' : 'cash'
    },

    validateSearchParams() {
      const errors = {}
      const validAirportCodes = new Set(this.airports.map((item) => item.code))
      const fromAirport = normalizeAirportCode(this.searchParams.fromAirport)
      const toAirport = normalizeAirportCode(this.searchParams.toAirport)
      const departDate = String(this.searchParams.departDate || '')
      const todayISO = toTodayISO()
      const totalPassengers = this.totalPassengers
      const adults = Math.max(1, Number(this.searchParams.passengers.adults || 1) || 1)
      const infants = Math.max(0, Number(this.searchParams.passengers.infants || 0) || 0)

      if (!validAirportCodes.has(fromAirport)) {
        errors.fromAirport = 'Điểm đi không hợp lệ.'
      }
      if (!validAirportCodes.has(toAirport)) {
        errors.toAirport = 'Điểm đến không hợp lệ.'
      }
      if (fromAirport && toAirport && fromAirport === toAirport) {
        errors.route = 'Điểm đi và điểm đến không được trùng nhau.'
      }
      if (!departDate) {
        errors.departDate = 'Vui lòng chọn ngày bay.'
      } else if (departDate < todayISO) {
        errors.departDate = 'Ngày bay phải từ hôm nay trở đi.'
      }
      if (totalPassengers > 9) {
        errors.passengers = 'Tổng số hành khách tối đa là 9.'
      }
      if (infants > adults) {
        errors.passengers = 'Số em bé không được vượt quá số người lớn.'
      }

      this.validationErrors = errors
      return !Object.keys(errors).length
    },

    async searchFlights() {
      this.error = null
      this.bookingResult = null

      if (!this.validateSearchParams()) return

      this.loading = true
      this.selectedFlightId = ''
      this.selectedFare = null

      try {
        const params = {
          fromAirport: this.searchParams.fromAirport,
          toAirport: this.searchParams.toAirport,
          flightDate: this.searchParams.departDate
        }

        let flights = await flightsApi.getAll(params)
        if (!Array.isArray(flights) || !flights.length) {
          const fallbackFlights = await flightsApi.getAll()
          flights = ensureArray(fallbackFlights).filter((flight) => {
            return String(flight.fromAirport) === String(params.fromAirport)
              && String(flight.toAirport) === String(params.toAirport)
              && String(flight.flightDate) === String(params.flightDate)
          })
        }

        const normalized = ensureArray(flights).map((flight) => {
          const cabinFare = resolveCabinFare(flight, this.searchParams.cabinClass)
          return {
            ...flight,
            effectiveFare: cabinFare.price,
            effectiveSeatLeft: cabinFare.seatLeft,
            effectiveCabin: cabinFare.cabinClass,
            effectiveCabinLabel: cabinFare.label
          }
        })

        this.flights = normalized

        const prices = normalized.map((item) => Number(item.effectiveFare || 0)).filter((value) => value > 0)
        const minPrice = prices.length ? Math.min(...prices) : 0
        const maxPrice = prices.length ? Math.max(...prices) : 10000000

        this.filters.priceRange = [minPrice, maxPrice]
      } catch (error) {
        this.flights = []
        this.error = error?.message || 'Không thể tải danh sách chuyến bay.'
      } finally {
        this.loading = false
      }
    },

    selectFare(flightId, fare) {
      this.selectedFlightId = String(flightId || '')
      this.selectedFare = fare || null
      this.bookingResult = null
      this.ensurePassengerForms()
    },

    updateContactForm(payload = {}) {
      this.contactForm = {
        ...this.contactForm,
        fullName: String(payload.fullName !== undefined ? payload.fullName : this.contactForm.fullName || ''),
        email: String(payload.email !== undefined ? payload.email : this.contactForm.email || ''),
        phone: String(payload.phone !== undefined ? payload.phone : this.contactForm.phone || '')
      }
    },

    updatePassenger(index, payload = {}) {
      if (!this.passengerForms[index]) return

      this.passengerForms[index] = {
        ...this.passengerForms[index],
        ...payload,
        fullName: String(payload.fullName !== undefined ? payload.fullName : this.passengerForms[index].fullName || ''),
        gender: String(payload.gender !== undefined ? payload.gender : this.passengerForms[index].gender || 'male'),
        dob: String(payload.dob !== undefined ? payload.dob : this.passengerForms[index].dob || ''),
        passportOrId: String(payload.passportOrId !== undefined ? payload.passportOrId : this.passengerForms[index].passportOrId || '')
      }
    },

    validateBookingForm() {
      const errors = {}

      if (!this.canConfirmBooking) {
        errors.selectedFare = 'Vui lòng chọn hạng vé trước khi tiếp tục.'
      }

      if (!this.contactForm.fullName.trim()) {
        errors.fullName = 'Vui lòng nhập họ tên liên hệ.'
      }

      const email = this.contactForm.email.trim()
      if (!email) {
        errors.email = 'Vui lòng nhập email liên hệ.'
      } else if (!/^\S+@\S+\.\S+$/.test(email)) {
        errors.email = 'Email không đúng định dạng.'
      }

      const phoneDigits = this.contactForm.phone.replace(/\D/g, '')
      if (!phoneDigits) {
        errors.phone = 'Vui lòng nhập số điện thoại liên hệ.'
      } else if (phoneDigits.length < 9 || phoneDigits.length > 11) {
        errors.phone = 'Số điện thoại không hợp lệ.'
      }

      this.passengerForms.forEach((passenger, index) => {
        if (!String(passenger.fullName || '').trim()) {
          errors[`passenger-${index}`] = `Vui lòng nhập họ tên hành khách ${index + 1}.`
        }
      })

      this.validationErrors = errors

      return !Object.keys(errors).length
    },

    async confirmBooking(paymentMethod = 'cash') {
      this.error = null

      if (!this.validateBookingForm()) return null

      const selectedFlight = this.selectedFlight
      if (!selectedFlight || !this.selectedFare) {
        this.error = 'Không tìm thấy chuyến bay đã chọn.'
        return null
      }

      this.loading = true
      this.setPaymentMethod(paymentMethod)
      const authStore = useAuthStore()
      const currentUserId = authStore.currentUser?.id ?? null

      try {
        const bookingCode = `FL${Date.now().toString().slice(-8)}`
        const normalizedPassengers = this.passengerForms.map((passenger) => {
          const checkedBaggageKg = Math.max(0, Number(passenger?.checkedBaggageKg || 0) || 0)
          return {
            ...passenger,
            checkedBaggageKg,
            checkedBaggageFee: getBaggagePrice(checkedBaggageKg)
          }
        })

        const unitPrice = Number(this.selectedFare.price || 0) || 0
        const baseFareTotal = unitPrice * this.totalPassengers
        const baggageTotal = normalizedPassengers.reduce((sum, item) => sum + Number(item.checkedBaggageFee || 0), 0)
        const totalPrice = baseFareTotal + baggageTotal

        const payload = {
          id: Date.now(),
          bookingCode,
          userId: currentUserId,
          customerUserId: currentUserId,
          flightId: selectedFlight.id,
          flightNumber: selectedFlight.flightNumber,
          fromAirport: selectedFlight.fromAirport,
          toAirport: selectedFlight.toAirport,
          flightDate: selectedFlight.flightDate,
          departureTime: selectedFlight.departureTime,
          arrivalTime: selectedFlight.arrivalTime,
          airlineCode: selectedFlight.airlineCode,
          airlineName: selectedFlight.airlineName,
          cabinClass: this.selectedFare.cabinClass,
          cabinLabel: this.selectedFare.label,
          passengers: normalizedPassengers,
          contact: {
            fullName: this.contactForm.fullName.trim(),
            email: this.contactForm.email.trim(),
            phone: this.contactForm.phone.replace(/\D/g, '')
          },
          passengerCounts: {
            ...this.searchParams.passengers,
            total: this.totalPassengers
          },
          paymentMethod: this.paymentMethod,
          priceSummary: {
            unitPrice,
            baseFareTotal,
            baggageTotal,
            totalPrice
          },
          unitPrice,
          totalPrice,
          status: 'confirmed',
          createdAt: new Date().toISOString()
        }

        const created = await flightBookingsApi.create(payload)
        this.bookingResult = created
        return created
      } catch (error) {
        this.error = error?.message || 'Không thể xác nhận đặt vé.'
        return null
      } finally {
        this.loading = false
      }
    },

    async loadBookingByCode(bookingCode = '') {
      const normalizedCode = String(bookingCode || '').trim()
      if (!normalizedCode) return null

      try {
        const result = await flightBookingsApi.getAll({ bookingCode: normalizedCode })
        const booking = Array.isArray(result) ? result[0] : null
        if (booking) {
          this.bookingResult = booking
          return booking
        }
        return null
      } catch {
        return null
      }
    },

    resetSelection() {
      this.selectedFlightId = ''
      this.selectedFare = null
      this.bookingResult = null
      this.paymentMethod = 'cash'
      this.validationErrors = {}
      this.contactForm = {
        fullName: '',
        email: '',
        phone: ''
      }
      this.passengerForms = []
    }
  }
})
