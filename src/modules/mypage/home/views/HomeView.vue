<script setup lang="ts">
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="badge" style="margin-bottom: 1rem;">🚀 Grand Opening</div>
        <h1>Chào mừng đến YukiMart</h1>
        <p>Cửa hàng trực tuyến hàng đầu với hàng ngàn sản phẩm chất lượng, giá tốt nhất thị trường.</p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <RouterLink to="/products" class="btn btn-primary">
            🛍️ Mua sắm ngay
          </RouterLink>
          <RouterLink to="/about" class="btn btn-secondary">
            Tìm hiểu thêm →
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="section">
      <div class="container">
        <h2 class="section-title" style="text-align: center;">Tại sao chọn YukiMart?</h2>
        <div class="grid grid-3">
          <div class="card" style="text-align: center;">
            <div class="card-body">
              <div style="font-size: 3rem; margin-bottom: 1rem;">🚚</div>
              <h3 class="card-title">Giao hàng nhanh</h3>
              <p style="color: var(--color-text-muted);">Miễn phí vận chuyển cho đơn từ 500K. Giao trong 2-3 ngày.</p>
            </div>
          </div>
          <div class="card" style="text-align: center;">
            <div class="card-body">
              <div style="font-size: 3rem; margin-bottom: 1rem;">💎</div>
              <h3 class="card-title">Chất lượng cao</h3>
              <p style="color: var(--color-text-muted);">100% sản phẩm chính hãng, cam kết chất lượng.</p>
            </div>
          </div>
          <div class="card" style="text-align: center;">
            <div class="card-body">
              <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
              <h3 class="card-title">Bảo mật tuyệt đối</h3>
              <p style="color: var(--color-text-muted);">Thanh toán an toàn, bảo vệ thông tin cá nhân.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
