<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div>
        <p class="eyebrow">Admin Mock</p>
        <h2>Vtravel CMS</h2>
      </div>
      <nav>
        <router-link to="/admin">Dashboard</router-link>
        <details class="admin-nav-group" open>
          <summary>Dịch vụ</summary>
          <div class="admin-nav-submenu">
            <router-link :to="{ name: 'admin-services-hotel' }">Khách sạn</router-link>
            <router-link :to="{ name: 'admin-services-ticket' }">Vé tham quan</router-link>
            <router-link :to="{ name: 'admin-services-tour' }">Tour</router-link>
            <router-link :to="{ name: 'admin-services-flight' }">Chuyến bay</router-link>
          </div>
        </details>

        <details class="admin-nav-group" open>
          <summary>Đơn đặt chỗ</summary>
          <div class="admin-nav-submenu">
            <router-link :to="{ name: 'admin-bookings-hotel' }">Khách sạn</router-link>
            <router-link :to="{ name: 'admin-bookings-ticket' }">Vé tham quan</router-link>
            <router-link :to="{ name: 'admin-bookings-tour' }">Tour</router-link>
            <router-link :to="{ name: 'admin-bookings-flight' }">Đặt vé bay đi</router-link>
          </div>
        </details>
        <router-link to="/admin/categories">Danh mục</router-link>
        <router-link to="/admin/customers">Khách hàng</router-link>
        <router-link to="/admin/comments">Bình luận</router-link>
        <router-link to="/admin/promotions">Khuyến mãi</router-link>
      </nav>
    </aside>

    <section class="admin-content">
      <header class="admin-topbar">
        <div>
          <p class="eyebrow">Bảng điều khiển</p>
          <h1>Quản trị vận hành du lịch nội địa</h1>
        </div>
        <div class="admin-topbar-actions">
          <router-link class="ghost-button" to="/">Xem trang khách</router-link>
        </div>
      </header>
      <router-view />
    </section>
  </div>
</template>

<script setup>
</script>

<style scoped>
.admin-sidebar nav {
  display: grid;
  gap: 8px;
}

.admin-nav-group {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  overflow: hidden;
}

.admin-nav-group summary {
  list-style: none;
  cursor: pointer;
  padding: 10px 14px;
  font-weight: 700;
  color: #d8e7ff;
}

.admin-nav-group summary::-webkit-details-marker {
  display: none;
}

.admin-nav-submenu {
  display: grid;
  gap: 4px;
  padding: 0 8px 8px;
}

.admin-nav-submenu a {
  padding-left: 18px;
  font-size: 0.92rem;
}
</style>