# Vue Travel

Nền tảng web đặt dịch vụ du lịch nội địa Việt Nam, xây dựng với Vue 3, tập trung vào trải nghiệm tìm kiếm nhanh, đặt dịch vụ linh hoạt và quản trị dữ liệu tập trung cho nhiều loại sản phẩm du lịch.

---

## Mục lục

1. [Tổng quan dự án](#tổng-quan-dự-án)
2. [Điểm nổi bật](#điểm-nổi-bật)
3. [Chức năng chính](#chức-năng-chính)
4. [Kiến trúc kỹ thuật](#kiến-trúc-kỹ-thuật)
5. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
6. [Công nghệ sử dụng](#công-nghệ-sử-dụng)
7. [Cài đặt và chạy local](#cài-đặt-và-chạy-local)
8. [Biến môi trường](#biến-môi-trường)
9. [Scripts](#scripts)
10. [Tài khoản demo](#tài-khoản-demo)
11. [Mock API và dữ liệu](#mock-api-và-dữ-liệu)
12. [Luồng sử dụng tiêu biểu](#luồng-sử-dụng-tiêu-biểu)
13. [Roadmap đề xuất](#roadmap-đề-xuất)
14. [Lưu ý cho môi trường học tập/đồ án](#lưu-ý-cho-môi-trường-học-tậpđồ-án)

---

## Tổng quan dự án

**Vue Travel** mô phỏng một hệ thống đặt dịch vụ du lịch đa danh mục:

- Khách sạn (`hotel`)
- Vé tham quan (`ticket`)
- Tour (`tour`)
- Chuyến bay (`flight`)

Ứng dụng bao gồm:

- Khu vực người dùng (tra cứu, lọc, xem chi tiết, wishlist, checkout, lịch sử đặt chỗ)
- Khu vực quản trị (`/admin`) để quản lý dịch vụ, booking, danh mục, khách hàng, khuyến mãi và bình luận
- Mock API dùng `json-server` qua file `db.json`, thuận tiện cho học tập, demo và phát triển nhanh

---

## Điểm nổi bật

- Thiết kế theo hướng **đa dịch vụ trong một codebase**.
- Có **Unified Search Panel** để chuẩn hóa trải nghiệm tìm kiếm theo từng danh mục.
- Luồng flight tách nhiều bước rõ ràng: tìm kiếm -> kết quả -> nhập thông tin -> checkout -> hóa đơn.
- Dùng **Pinia** để quản lý state tập trung và tái sử dụng giữa nhiều view.
- Có sẵn **demo account** cho cả `admin` và `customer`.
- Router có guard phân quyền theo vai trò.

---

## Chức năng chính

### 1. Phía khách hàng

- Trang chủ tổng hợp dịch vụ nổi bật.
- Danh sách dịch vụ theo từng nhóm: khách sạn, vé tham quan, tour, vé máy bay.
- Tìm kiếm và lọc theo danh mục.
- Xem chi tiết dịch vụ và đặt chỗ.
- Wishlist cá nhân.
- Luồng thanh toán và xác nhận đặt chỗ.
- Lịch sử đặt chỗ và xem chi tiết đơn.
- Đăng nhập/đăng ký.

### 2. Phía quản trị

- Dashboard quản trị tổng quan.
- Quản lý dịch vụ theo danh mục.
- Quản lý booking theo loại sản phẩm.
- Quản lý chuyến bay và flight booking.
- Quản lý danh mục, khách hàng, bình luận, khuyến mãi.

---

## Kiến trúc kỹ thuật

### 1. Frontend Architecture

- `Vue 3` + `Vue Router 4` cho SPA.
- `Pinia` cho state management.
- `Axios` làm HTTP client.
- Tách lớp rõ ràng:
  - `views`: màn hình theo route
  - `components`: UI tái sử dụng
  - `stores`: business state
  - `services`: gọi API
  - `utils`: xử lý chuẩn hóa dữ liệu và logic phụ trợ

### 2. Data Flow (mô hình tổng quát)

1. Người dùng thao tác trên UI (`views/components`)
2. Store nhận action và gọi `services/api`
3. API gọi `json-server` qua `axios`
4. Dữ liệu trả về được normalize qua `utils`
5. Store cập nhật state và render lại giao diện

### 3. Route Layout

- `ClientLayout`: toàn bộ route người dùng.
- `AdminLayout`: toàn bộ route quản trị, có kiểm soát quyền qua `meta.requiresAdmin`.

---

## Cấu trúc thư mục

```text
vue-travel/
|-- public/
|-- src/
|   |-- assets/                       # CSS, hình ảnh
|   |-- components/
|   |   |-- common/                   # Component dùng chung
|   |   `-- travel/                   # Component nghiệp vụ du lịch
|   |-- layouts/
|   |   |-- ClientLayout.vue
|   |   `-- AdminLayout.vue
|   |-- router/
|   |   `-- index.js
|   |-- services/
|   |   |-- axios.js                  # Cấu hình axios client
|   |   `-- api.js                    # API layer theo resource
|   |-- stores/                       # Pinia stores theo domain
|   |-- utils/                        # Helper/normalize/query builder
|   |-- views/
|   |   |-- client/
|   |   |   |-- flight/
|   |   |   |-- hotel/
|   |   |   |-- ticket/
|   |   |   `-- tour/
|   |   `-- admin/
|   |-- App.vue
|   `-- main.js
|-- db.json                           # Mock database cho json-server
|-- .env.example
|-- package.json
`-- README.md
```

---

## Công nghệ sử dụng

- **Framework:** Vue 3
- **Router:** Vue Router 4
- **State Management:** Pinia
- **HTTP Client:** Axios
- **Mock Backend:** JSON Server
- **Build Toolchain:** Vue CLI 5
- **Linting:** ESLint

---

## Cài đặt và chạy local

### 1. Cài dependencies

```bash
npm install
```

### 2. Tạo file môi trường

Tạo `.env` từ `.env.example`:

```env
VITE_API_URL=http://localhost:3000
```

### 3. Chạy API mock

```bash
npm run api
```

### 4. Chạy frontend

```bash
npm run serve
```

### 5. Chạy cả 2 cùng lúc (Windows)

```bash
npm run dev:full
```

### 6. Truy cập

- Frontend: `http://localhost:8080`
- API: `http://localhost:3000`

---

## Biến môi trường

| Biến | Mô tả | Mặc định |
|---|---|---|
| `VITE_API_URL` | URL backend/mock API | `http://localhost:3000` |

Ghi chú:

- Code hiện có cơ chế fallback qua `process.env.VUE_APP_API_BASE_URL`.
- Nếu không cấu hình gì, ứng dụng vẫn fallback về `http://localhost:3000`.

---

## Scripts

| Script | Ý nghĩa |
|---|---|
| `npm run serve` | Chạy frontend ở chế độ phát triển |
| `npm run api` | Chạy `json-server --watch db.json --port 3000` |
| `npm run dev:full` | Chạy đồng thời API + frontend |
| `npm run build` | Build production |
| `npm run lint` | Kiểm tra lint |

---

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@vtravel.vn` | `123456` |
| Customer | `user@vtravel.vn` | `123456` |

---

## Mock API và dữ liệu

Nguồn dữ liệu được lưu trong `db.json` với các resource chính:

- `categories`
- `destinations`
- `hotels`
- `tickets`
- `tours`
- `flights`
- `bookings`
- `bookingDetails`
- `flightBookings`
- `comments`
- `promotions`
- `users`

Ví dụ endpoint:

- `GET /hotels`
- `GET /tours`
- `GET /flights`
- `GET /bookings`
- `POST /bookings`

---

## Luồng sử dụng tiêu biểu

### Luồng khách hàng

1. Vào trang chủ, chọn loại dịch vụ.
2. Dùng panel tìm kiếm theo danh mục.
3. Xem danh sách kết quả và vào trang chi tiết.
4. Chọn thông tin đặt chỗ, thêm vào luồng checkout.
5. Hoàn tất đặt chỗ và xem lịch sử đơn.

### Luồng quản trị

1. Đăng nhập bằng tài khoản admin.
2. Vào `/admin`.
3. Quản lý dịch vụ/booking/danh mục/khuyến mãi.
4. Theo dõi và cập nhật dữ liệu vận hành.

---

## Roadmap đề xuất

- Tích hợp backend thật (Node/Nest/Laravel) thay cho json-server.
- Bổ sung JWT + refresh token.
- Áp dụng phân trang, lọc nâng cao phía server.
- Thêm unit test cho `utils` và `stores`.
- Thêm e2e test cho luồng booking chính.
- Tách module admin và client để tối ưu maintainability.

---

## Lưu ý cho môi trường học tập/đồ án

- Đây là dự án phù hợp cho bài tập lớn môn Frontend/Vue vì đã có:
  - Quản lý state thực tế
  - Nhiều route và vai trò người dùng
  - Mô hình dữ liệu đa dạng
  - Luồng nghiệp vụ rõ ràng
- Có thể mở rộng thêm:
  - Thanh toán thực tế
  - Upload hình ảnh
  - Báo cáo doanh thu
  - Dashboard thống kê nâng cao
