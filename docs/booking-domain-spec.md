# Viet Voyage Booking Domain Spec (Vietnam Domestic)

## 1) Scope and Goal
- Product scope: Vietnam domestic travel only.
- Tech scope: Vue 3 frontend, mock data, localStorage.
- Business goal: Separate search and booking behavior by service type, not a single date model for all.

## 2) Service Types and Booking Rules

### 2.1 Hotel
- User inputs:
  - checkInDate
  - checkOutDate
  - guests
  - rooms
- Rules:
  - checkOutDate must be after checkInDate.
  - No date in the past.
  - guests >= 1, rooms >= 1.

### 2.2 Ticket
- User inputs:
  - useDate
  - ticketQuantity
- Rules:
  - useDate must be today or later.
  - No checkOutDate field.

### 2.3 Tour
- User inputs:
  - departureId (from predefined schedule list)
  - travelers
- Rules:
  - User cannot free-pick checkOutDate.
  - System derives and displays endDate from selected departure.
  - Selected departure must have remainingSlots > 0.

### 2.4 Combo
- User inputs:
  - packageId or departureId (predefined package/batch)
  - travelers or packageQuantity
- Rules:
  - Fixed schedule combos do not allow free date range input.
  - Selection must be in apply window and have remaining slots.

## 3) Home UX Contract (Traveloka-like tabs)
- Tabs:
  - Hotel
  - Ticket
  - Tour
  - Combo
- Each tab has its own form model and submit action.
- Do not reuse one generic form for all tabs.

## 4) Route Query Contract

### 4.1 List page route
- Path: /dich-vu
- Shared params:
  - category: hotel | ticket | tour | combo
  - destination: string
- Hotel params:
  - checkInDate
  - checkOutDate
  - guests
  - rooms
- Ticket params:
  - useDate
  - ticketQuantity
- Tour params:
  - departureDate (optional prefilter)
  - travelers
- Combo params:
  - applyDate (optional prefilter)
  - travelers

### 4.2 Detail page route
- Path: /dich-vu/:slug
- Optional prefill by category:
  - Hotel: checkInDate, checkOutDate, guests, rooms
  - Ticket: useDate, ticketQuantity
  - Tour: departureId, travelers
  - Combo: packageId or departureId, travelers

### 4.3 Checkout route
- Path: /thanh-toan
- Existing direct mode can remain:
  - mode=direct
  - serviceId
  - booking payload by bookingType

## 5) Data Model Contract

### 5.1 Service base fields (all types)
- id, slug, name, categoryId, destination, province
- salePrice, rating, availableSlots, status
- shortDescription, description, image, gallery
- bookingType: hotel | ticket | tour | combo
- pricingModel: per_night | per_ticket | per_person | per_package

### 5.2 Hotel-specific fields
- roomTypes: Array<{ code, name, maxGuests, pricePerNight, availableRooms }>
- checkInTime, checkOutTime
- blackoutDates: string[]

### 5.3 Ticket-specific fields
- ticketTypes: Array<{ code, name, price, minAge?, maxAge? }>
- validDateRanges: Array<{ startDate, endDate }>
- isOpenDateTicket: boolean

### 5.4 Tour-specific fields
- departures: Array<{
  departureId,
  startDate,
  endDate,
  durationDays,
  durationNights,
  remainingSlots,
  priceOverride?
}>
- meetingPoint

### 5.5 Combo-specific fields
- isFixedSchedule: boolean
- packages: Array<{
  packageId,
  name,
  applyFrom,
  applyTo,
  departureId?,
  startDate?,
  endDate?,
  durationDays,
  durationNights,
  remainingSlots,
  packagePrice
}>

## 6) Cart Item Contract (Critical)
- Replace implicit date fields with explicit bookingMeta by type.

```ts
interface CartItem {
  serviceId: number
  bookingType: 'hotel' | 'ticket' | 'tour' | 'combo'
  quantity: number
  bookingMeta:
    | { checkInDate: string; checkOutDate: string; guests: number; rooms: number }
    | { useDate: string; ticketQuantity: number }
    | { departureId: string; startDate: string; endDate: string; travelers: number }
    | { packageId?: string; departureId?: string; startDate?: string; endDate?: string; travelers: number }
}
```

## 7) Validation Matrix
- Hotel:
  - checkInDate required
  - checkOutDate required
  - checkOutDate > checkInDate
  - checkInDate >= today
- Ticket:
  - useDate required
  - useDate >= today
- Tour:
  - departureId required
  - selected departure remainingSlots > 0
- Combo:
  - packageId or departureId required
  - applyFrom <= selectedDate <= applyTo (if date is required by package)

## 8) Page-level Change Map
- Home tabs and per-type forms:
  - src/views/client/HomeView.vue
- List filter summary and quick book behavior per type:
  - src/views/client/TravelListView.vue
- Detail booking panel by type:
  - src/views/client/TravelDetailView.vue
- Cart row rendering and validation by bookingMeta:
  - src/views/client/CartView.vue
- Checkout review and booking submission by bookingMeta:
  - src/views/client/CheckoutView.vue
- Store normalization and persistence by bookingType:
  - src/stores/useTravelStore.js
- Shared rule helpers:
  - src/utils/bookingRules.js

## 9) Implementation Phases

### Phase A (UI and Query Separation)
- Add Home tabs and separate form models.
- Pass category-aware query contract to list and detail.
- Keep current storage shape for compatibility in this phase.

### Phase B (Data and Store Refactor)
- Introduce bookingType + bookingMeta in cart items.
- Add migration from old startDate/endDate records to new bookingMeta.
- Update cart key strategy to include bookingMeta signature.

### Phase C (Tour and Combo Schedule Productization)
- Add departures/packages into mock data.
- Render schedule pickers in detail page.
- Lock free-date input for fixed schedule products.

### Phase D (Checkout and History Alignment)
- Update checkout payload and booking history labels by bookingType.
- Validate against remaining slots from selected departure/package.

## 10) Non-Functional Constraints
- Keep localStorage backward compatibility for existing users.
- Do not break current auth and route guard flows.
- Keep mobile-first responsive behavior.

## 11) Acceptance Criteria
- Home has 4 independent tabs and form models.
- Tour/combo no longer require free-form endDate input.
- Hotel still requires valid check-in/check-out.
- Ticket uses single useDate only.
- Cart and checkout validations are based on bookingType.
- All flows build successfully with mock data and localStorage.
