import { createRouter, createWebHistory } from 'vue-router'
import ClientLayout from '@/layouts/ClientLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import HomeView from '@/views/client/HomeView.vue'
import HotelHome from '@/views/client/hotel/HotelHome.vue'
import HotelDetailView from '@/views/client/hotel/HotelDetailView.vue'
import TicketHome from '@/views/client/ticket/TicketHome.vue'
import FlightHome from '@/views/client/flight/FlightHome.vue'
import FlightResultsView from '@/views/client/flight/FlightResultsView.vue'
import FlightContactView from '@/views/client/flight/FlightContactView.vue'
import FlightCheckoutView from '@/views/client/flight/FlightCheckoutView.vue'
import FlightInvoiceView from '@/views/client/flight/FlightInvoiceView.vue'
import TicketDetailView from '@/views/client/ticket/TicketDetailView.vue'
import TourHome from '@/views/client/tour/TourHome.vue'
import TourDetailView from '@/views/client/tour/TourDetailView.vue'
import TravelListView from '@/views/client/TravelListView.vue'
import WishlistView from '@/views/client/WishlistView.vue'
import CheckoutView from '@/views/client/CheckoutView.vue'
import BookingSuccessView from '@/views/client/BookingSuccessView.vue'
import BookingHistoryView from '@/views/client/BookingHistoryView.vue'
import BookingDetailView from '@/views/client/BookingDetailView.vue'
import LoginView from '@/views/client/LoginView.vue'
import AdminDashboardView from '@/views/admin/AdminDashboardView.vue'
import AdminServiceManagementView from '@/views/admin/AdminServiceManagementView.vue'
import AdminBookingManagementView from '@/views/admin/AdminBookingManagementView.vue'
import AdminFlightManagementView from '@/views/admin/AdminFlightManagementView.vue'
import AdminFlightBookingManagementView from '@/views/admin/AdminFlightBookingManagementView.vue'
import AdminCommentManagementView from '@/views/admin/AdminCommentManagementView.vue'
import AdminPromotionManagementView from '@/views/admin/AdminPromotionManagementView.vue'
import AdminCategoryManagementView from '@/views/admin/AdminCategoryManagementView.vue'
import AdminCustomerManagementView from '@/views/admin/AdminCustomerManagementView.vue'
import { useAuthStore } from '@/stores/auth/useAuthStore'

const routes = [
  {
    path: '/',
    component: ClientLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: HomeView,
        meta: { title: 'Vtravel | Du lịch nội địa Việt Nam' }
      },
      {
        path: 'hotel',
        name: 'hotel-home',
        component: HotelHome,
        meta: { title: 'Khám phá khách sạn nội địa Việt Nam' }
      },
      {
        path: 'dich-vu',
        name: 'travel-list',
        component: TravelListView,
        meta: { title: 'Khám phá dịch vụ du lịch Việt Nam' }
      },
      {
        path: 'khach-san',
        name: 'hotel-search',
        component: HotelHome,
        meta: { title: 'Tìm khách sạn nội địa' }
      },
      {
        path: 'khach-san/:slug',
        name: 'hotel-detail',
        component: HotelDetailView,
        props: true,
        meta: { title: 'Chi tiết khách sạn' }
      },
      {
        path: 've-tham-quan',
        name: 'ticket-search',
        component: TicketHome,
        meta: { title: 'Tìm vé tham quan nội địa' }
      },
      {
        path: 've-may-bay',
        name: 'flight-home',
        component: FlightHome,
        meta: { title: 'Vé máy bay nội địa Việt Nam' }
      },
      {
        path: 've-may-bay/ket-qua',
        name: 'flight-results',
        component: FlightResultsView,
        meta: { title: 'Kết quả chuyến bay' }
      },
      {
        path: 've-may-bay/thong-tin',
        name: 'flight-contact',
        component: FlightContactView,
        meta: { title: 'Thông tin liên hệ chuyến bay' }
      },
      {
        path: 've-may-bay/checkout',
        name: 'flight-checkout',
        component: FlightCheckoutView,
        meta: { title: 'Thanh toán chuyến bay' }
      },
      {
        path: 've-may-bay/hoa-don',
        name: 'flight-invoice',
        component: FlightInvoiceView,
        meta: { title: 'Hóa đơn chuyến bay' }
      },
      {
        path: 've-tham-quan/:slug',
        name: 'ticket-detail',
        component: TicketDetailView,
        props: true,
        meta: { title: 'Chi tiết vé tham quan' }
      },
      {
        path: 'tour',
        name: 'tour-search',
        component: TourHome,
        meta: { title: 'Tìm tour nội địa' }
      },
      {
        path: 'tour/:slug',
        name: 'tour-detail',
        component: TourDetailView,
        props: true,
        meta: { title: 'Chi tiết tour' }
      },
      {
        path: 'wishlist',
        name: 'wishlist',
        component: WishlistView,
        meta: { title: 'Danh sách yêu thích' }
      },
      {
        path: 'gio-hang',
        name: 'cart',
        redirect: { name: 'travel-list' }
      },
      {
        path: 'thanh-toan',
        name: 'checkout',
        component: CheckoutView,
        meta: { title: 'Thanh toán đặt chỗ' }
      },
      {
        path: 'dat-cho-thanh-cong',
        name: 'booking-success',
        component: BookingSuccessView,
        meta: { title: 'Đặt chỗ thành công' }
      },
      {
        path: 'lich-su-dat-cho',
        name: 'booking-history',
        component: BookingHistoryView,
        meta: { title: 'Lịch sử đặt chỗ' }
      },
      {
        path: 'lich-su-dat-cho/:id',
        name: 'booking-detail',
        component: BookingDetailView,
        props: true,
        meta: { title: 'Chi tiết đơn đặt chỗ' }
      },
      {
        path: 'dang-nhap',
        name: 'login',
        component: LoginView,
        meta: { title: 'Đăng nhập / Đăng ký' }
      }
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true, title: 'Quản trị Vtravel' },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: AdminDashboardView,
        meta: { requiresAdmin: true, title: 'Dashboard quản trị' }
      },
      {
        path: 'services',
        name: 'admin-services',
        component: AdminServiceManagementView,
        meta: { requiresAdmin: true, title: 'Quản lý dịch vụ' }
      },
      {
        path: 'services/hotel',
        name: 'admin-services-hotel',
        component: AdminServiceManagementView,
        meta: { requiresAdmin: true, title: 'Quản lý khách sạn', categoryId: 'hotel' }
      },
      {
        path: 'services/ticket',
        name: 'admin-services-ticket',
        component: AdminServiceManagementView,
        meta: { requiresAdmin: true, title: 'Quản lý vé tham quan', categoryId: 'ticket' }
      },
      {
        path: 'services/tour',
        name: 'admin-services-tour',
        component: AdminServiceManagementView,
        meta: { requiresAdmin: true, title: 'Quản lý tour', categoryId: 'tour' }
      },
      {
        path: 'services/flight',
        name: 'admin-services-flight',
        component: AdminFlightManagementView,
        meta: { requiresAdmin: true, title: 'Quản lý chuyến bay' }
      },
      {
        path: 'services/create',
        name: 'admin-services-create',
        component: AdminServiceManagementView,
        meta: { requiresAdmin: true, title: 'Thêm dịch vụ' }
      },
      {
        path: 'bookings',
        name: 'admin-bookings',
        component: AdminBookingManagementView,
        meta: { requiresAdmin: true, title: 'Quản lý đơn đặt chỗ' }
      },
      {
        path: 'bookings/hotel',
        name: 'admin-bookings-hotel',
        component: AdminBookingManagementView,
        meta: { requiresAdmin: true, title: 'Quản lý booking khách sạn', categoryId: 'hotel' }
      },
      {
        path: 'bookings/ticket',
        name: 'admin-bookings-ticket',
        component: AdminBookingManagementView,
        meta: { requiresAdmin: true, title: 'Quản lý booking vé tham quan', categoryId: 'ticket' }
      },
      {
        path: 'bookings/tour',
        name: 'admin-bookings-tour',
        component: AdminBookingManagementView,
        meta: { requiresAdmin: true, title: 'Quản lý booking tour', categoryId: 'tour' }
      },
      {
        path: 'bookings/flight',
        name: 'admin-bookings-flight',
        component: AdminFlightBookingManagementView,
        meta: { requiresAdmin: true, title: 'Quản lý đặt vé bay đi' }
      },
      {
        path: 'categories',
        name: 'admin-categories',
        component: AdminCategoryManagementView,
        meta: { requiresAdmin: true, title: 'Quản lý danh mục' }
      },
      {
        path: 'customers',
        name: 'admin-customers',
        component: AdminCustomerManagementView,
        meta: { requiresAdmin: true, title: 'Quản lý khách hàng' }
      },
      {
        path: 'comments',
        name: 'admin-comments',
        component: AdminCommentManagementView,
        meta: { requiresAdmin: true, title: 'Quản lý bình luận' }
      },
      {
        path: 'promotions',
        name: 'admin-promotions',
        component: AdminPromotionManagementView,
        meta: { requiresAdmin: true, title: 'Quản lý khuyến mãi' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 8
      }
    }

    return { top: 0, behavior: 'smooth' }
  }
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  authStore.bootstrapState()

  if (to.meta?.title) {
    document.title = to.meta.title
  }

  if (to.meta?.requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta?.requiresAdmin) {
    if (!authStore.isAdmin) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
  }

  next()
})

export default router