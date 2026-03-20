<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div>
        <p class="eyebrow">Admin Mock</p>
        <h2>Việt Voyage CMS</h2>
      </div>
      <nav>
        <router-link to="/admin">Dashboard</router-link>
        <a href="#">Danh mục</a>
        <a href="#">Dịch vụ</a>
        <a href="#">Đơn đặt chỗ</a>
        <a href="#">Khách hàng</a>
        <a href="#">Bình luận</a>
        <a href="#">Khuyến mãi</a>
      </nav>
    </aside>

    <section class="admin-content">
      <header class="admin-topbar">
        <div>
          <p class="eyebrow">Bảng điều khiển</p>
          <h1>Quản trị vận hành du lịch nội địa</h1>
        </div>
        <button class="ghost-button" type="button">Admin Việt Voyage</button>
      </header>
      <router-view />
    </section>
  </div>
</template>
