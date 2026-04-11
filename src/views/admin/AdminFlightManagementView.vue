<template>
  <section class="admin-page">
    <div class="panel-card">
      <div class="section-heading compact admin-heading-stack">
        <div>
          <p class="eyebrow">Quản lý chuyến bay</p>
          <h2>Danh sách chuyến bay nội địa</h2>
          <p class="muted small-text">Thêm, sửa và xóa các chuyến bay hiển thị trên trang khách.</p>
        </div>
        <button class="primary-button" type="button" @click="startCreate">+ Thêm chuyến bay</button>
      </div>

      <div class="admin-toolbar flight-toolbar">
        <input v-model="filters.keyword" type="text" placeholder="Tìm theo số hiệu, hãng bay hoặc sân bay" />
        <select v-model="filters.fromAirport">
          <option value="">Tất cả điểm đi</option>
          <option v-for="airport in airportOptions" :key="`from-${airport.code}`" :value="airport.code">
            {{ airport.name }} ({{ airport.code }})
          </option>
        </select>
        <select v-model="filters.toAirport">
          <option value="">Tất cả điểm đến</option>
          <option v-for="airport in airportOptions" :key="`to-${airport.code}`" :value="airport.code">
            {{ airport.name }} ({{ airport.code }})
          </option>
        </select>
        <input v-model="filters.flightDate" type="date" />
      </div>

      <div class="flight-form-grid">
        <section class="flight-form-card panel-card">
          <div class="service-form-section__header">
            <div>
              <p class="eyebrow">{{ editingFlightId ? 'Chỉnh sửa chuyến bay' : 'Thêm chuyến bay mới' }}</p>
              <h3>{{ editingFlightId ? 'Cập nhật thông tin chuyến bay' : 'Nhập thông tin chuyến bay' }}</h3>
            </div>
          </div>

          <div class="admin-form-grid flight-form-fields">
            <div class="field-group">
              <label>Số hiệu chuyến bay</label>
              <input v-model="form.flightNumber" type="text" placeholder="VN215" />
            </div>
            <div class="field-group">
              <label>Mã hãng bay</label>
              <input v-model="form.airlineCode" type="text" placeholder="VN" />
            </div>
            <div class="field-group">
              <label>Tên hãng bay</label>
              <input v-model="form.airlineName" type="text" placeholder="Vietnam Airlines" />
            </div>
            <div class="field-group">
              <label>Máy bay</label>
              <input v-model="form.aircraft" type="text" placeholder="Airbus A321" />
            </div>
            <div class="field-group">
              <label>Điểm đi</label>
              <select v-model="form.fromAirport">
                <option value="">Chọn sân bay</option>
                <option v-for="airport in airportOptions" :key="`form-from-${airport.code}`" :value="airport.code">
                  {{ airport.name }} ({{ airport.code }})
                </option>
              </select>
            </div>
            <div class="field-group">
              <label>Điểm đến</label>
              <select v-model="form.toAirport">
                <option value="">Chọn sân bay</option>
                <option v-for="airport in airportOptions" :key="`form-to-${airport.code}`" :value="airport.code">
                  {{ airport.name }} ({{ airport.code }})
                </option>
              </select>
            </div>
            <div class="field-group">
              <label>Ngày bay</label>
              <input v-model="form.flightDate" type="date" />
            </div>
            <div class="field-group">
              <label>Giờ khởi hành</label>
              <input v-model="form.departureTime" type="time" />
            </div>
            <div class="field-group">
              <label>Giờ đến</label>
              <input v-model="form.arrivalTime" type="time" />
            </div>
            <div class="field-group">
              <label>Thời lượng (phút)</label>
              <input v-model.number="form.durationMinutes" type="number" min="0" />
            </div>
            <div class="field-group">
              <label>Số điểm dừng</label>
              <input v-model.number="form.stopCount" type="number" min="0" />
            </div>
            <div class="field-group">
              <label>Số chỗ còn lại</label>
              <input v-model.number="form.availableSlots" type="number" min="0" />
            </div>
          </div>

          <div class="fare-editor-grid">
            <article v-for="fareKey in fareKeys" :key="fareKey" class="fare-editor-card">
              <h4>{{ fareLabels[fareKey] }}</h4>
              <div class="admin-form-grid flight-form-fields">
                <div class="field-group">
                  <label>Nhãn</label>
                  <input v-model="form.cabinFares[fareKey].label" type="text" />
                </div>
                <div class="field-group">
                  <label>Giá</label>
                  <input v-model.number="form.cabinFares[fareKey].price" type="number" min="0" />
                </div>
                <div class="field-group">
                  <label>Hành lý</label>
                  <input v-model="form.cabinFares[fareKey].baggage" type="text" placeholder="20kg ký gửi + 12kg xách tay" />
                </div>
                <div class="field-group">
                  <label>Chính sách hoàn/đổi</label>
                  <input v-model="form.cabinFares[fareKey].refundPolicy" type="text" placeholder="Hoàn/đổi linh hoạt" />
                </div>
                <div class="field-group">
                  <label>Số chỗ</label>
                  <input v-model.number="form.cabinFares[fareKey].seatLeft" type="number" min="0" />
                </div>
              </div>
            </article>
          </div>

          <div class="admin-form-actions">
            <button class="secondary-button" type="button" @click="resetForm">Làm mới</button>
            <button class="primary-button" type="button" @click="saveFlight">{{ editingFlightId ? 'Cập nhật' : 'Lưu chuyến bay' }}</button>
          </div>
          <small v-if="errorMessage" class="error-text">{{ errorMessage }}</small>
        </section>

        <section class="flight-list-card panel-card">
          <div class="section-heading compact">
            <div>
              <p class="eyebrow">Danh sách hiện có</p>
              <h3>{{ filteredFlights.length }} chuyến bay</h3>
            </div>
          </div>

          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Chuyến bay</th>
                  <th>Tuyến bay</th>
                  <th>Ngày</th>
                  <th>Giá từ</th>
                  <th>Chỗ</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="flight in filteredFlights" :key="flight.id">
                  <td>
                    <strong>{{ flight.flightNumber }}</strong>
                    <p class="muted small-text">{{ flight.airlineName }}</p>
                  </td>
                  <td>
                    <strong>{{ flight.fromAirport }} → {{ flight.toAirport }}</strong>
                    <p class="muted small-text">{{ flight.departureTime }} - {{ flight.arrivalTime }}</p>
                  </td>
                  <td>{{ formatDateVN(flight.flightDate) }}</td>
                  <td>{{ formatCurrency(resolveStartingFare(flight)) }}</td>
                  <td>{{ resolveAvailableSeats(flight) }}</td>
                  <td>
                    <div class="table-actions">
                      <button class="secondary-button" type="button" @click="editFlight(flight)">Sửa</button>
                      <button class="ghost-button" type="button" @click="removeFlight(flight.id)">Xóa</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useFlightStore } from '@/stores/flight/useFlightStore'
import { flightsApi } from '@/services/api'
import { formatDateVN } from '@/utils/formatters'

const flightStore = useFlightStore()
const airportOptions = computed(() => flightStore.airports)
const flightRows = ref([])
const errorMessage = ref('')
const editingFlightId = ref('')

const fareKeys = ['economy', 'premium', 'business']
const fareLabels = {
  economy: 'Phổ thông',
  premium: 'Phổ thông đặc biệt',
  business: 'Thương gia'
}

const createFare = (overrides = {}) => ({
  label: '',
  price: 0,
  baggage: '',
  refundPolicy: '',
  seatLeft: 0,
  ...overrides
})

const createForm = () => ({
  id: '',
  flightNumber: '',
  airlineCode: '',
  airlineName: '',
  fromAirport: '',
  toAirport: '',
  flightDate: '',
  departureTime: '',
  arrivalTime: '',
  durationMinutes: 0,
  stopCount: 0,
  aircraft: '',
  availableSlots: 0,
  cabinFares: {
    economy: createFare({ label: 'Phổ thông' }),
    premium: createFare({ label: 'Phổ thông đặc biệt' }),
    business: createFare({ label: 'Thương gia' })
  }
})

const form = reactive(createForm())
const filters = reactive({ keyword: '', fromAirport: '', toAirport: '', flightDate: '' })

const loadFlights = async () => {
  try {
    const data = await flightsApi.getAll()
    flightRows.value = Array.isArray(data) ? data : []
  } catch (error) {
    errorMessage.value = error?.message || 'Không thể tải danh sách chuyến bay.'
  }
}

const resolveStartingFare = (flight) => {
  const fares = flight?.cabinFares || {}
  const values = Object.values(fares)
    .map((fare) => Number(fare?.price || 0) || 0)
    .filter((value) => value > 0)
  return values.length ? Math.min(...values) : 0
}

const resolveAvailableSeats = (flight) => {
  const fares = flight?.cabinFares || {}
  const values = Object.values(fares)
    .map((fare) => Number(fare?.seatLeft || 0) || 0)
    .filter((value) => value >= 0)
  return values.length ? Math.max(...values) : Number(flight?.availableSlots || 0) || 0
}

const formatCurrency = (value) => {
  const amount = Math.max(0, Number(value || 0) || 0)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount)
}

const filteredFlights = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()
  return flightRows.value.filter((flight) => {
    const matchesKeyword = !keyword || [flight.flightNumber, flight.airlineName, flight.airlineCode, flight.fromAirport, flight.toAirport]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
    const matchesFrom = !filters.fromAirport || String(flight.fromAirport) === String(filters.fromAirport)
    const matchesTo = !filters.toAirport || String(flight.toAirport) === String(filters.toAirport)
    const matchesDate = !filters.flightDate || String(flight.flightDate) === String(filters.flightDate)
    return matchesKeyword && matchesFrom && matchesTo && matchesDate
  })
})

const resetForm = () => {
  Object.assign(form, createForm())
  editingFlightId.value = ''
  errorMessage.value = ''
}

const startCreate = () => {
  resetForm()
}

const editFlight = (flight) => {
  Object.assign(form, createForm(), {
    ...flight,
    cabinFares: {
      economy: createFare({ label: flight.cabinFares?.economy?.label || 'Phổ thông', ...flight.cabinFares?.economy }),
      premium: createFare({ label: flight.cabinFares?.premium?.label || 'Phổ thông đặc biệt', ...flight.cabinFares?.premium }),
      business: createFare({ label: flight.cabinFares?.business?.label || 'Thương gia', ...flight.cabinFares?.business })
    }
  })
  editingFlightId.value = String(flight.id)
}

const saveFlight = async () => {
  errorMessage.value = ''

  if (!form.flightNumber || !form.airlineName || !form.fromAirport || !form.toAirport || !form.flightDate) {
    errorMessage.value = 'Vui lòng nhập đủ thông tin chuyến bay.'
    return
  }

  const payload = {
    ...form,
    availableSlots: Math.max(0, Number(form.availableSlots || 0) || 0),
    durationMinutes: Math.max(0, Number(form.durationMinutes || 0) || 0),
    stopCount: Math.max(0, Number(form.stopCount || 0) || 0),
    cabinFares: fareKeys.reduce((accumulator, key) => {
      accumulator[key] = {
        label: String(form.cabinFares[key].label || fareLabels[key]),
        price: Math.max(0, Number(form.cabinFares[key].price || 0) || 0),
        baggage: String(form.cabinFares[key].baggage || ''),
        refundPolicy: String(form.cabinFares[key].refundPolicy || ''),
        seatLeft: Math.max(0, Number(form.cabinFares[key].seatLeft || 0) || 0)
      }
      return accumulator
    }, {})
  }

  try {
    if (editingFlightId.value) {
      await flightsApi.update(editingFlightId.value, payload)
    } else {
      await flightsApi.create({
        ...payload,
        id: `F${Date.now()}`
      })
    }

    await loadFlights()
    resetForm()
  } catch (error) {
    errorMessage.value = error?.message || 'Không thể lưu chuyến bay.'
  }
}

const removeFlight = async (id) => {
  try {
    await flightsApi.remove(id)
    await loadFlights()
    if (String(editingFlightId.value) === String(id)) {
      resetForm()
    }
  } catch (error) {
    errorMessage.value = error?.message || 'Không thể xóa chuyến bay.'
  }
}

onMounted(() => {
  loadFlights()
})
</script>

<style scoped>
.flight-form-grid {
  display: grid;
  gap: 12px;
}

.flight-form-card,
.flight-list-card {
  display: grid;
  gap: 14px;
}

.flight-form-fields {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.fare-editor-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.fare-editor-card {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  padding: 12px;
  background: rgba(248, 250, 252, 0.72);
}

.fare-editor-card h4 {
  margin: 0 0 10px;
}

.table-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 1200px) {
  .flight-form-fields,
  .fare-editor-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .flight-form-fields,
  .fare-editor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
