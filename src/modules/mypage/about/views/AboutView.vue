<template>
  <div class="ym-about">
    <header class="page-header">
      <div class="container">
        <h1>Giới thiệu YukiMart</h1>
      </div>
    </header>

    <section class="section ym-about__section">
      <div class="container ym-about__container">
        <article class="card ym-about__card">
          <div class="card-body ym-about__body">
            <h2>🏪 Về chúng tôi</h2>
            <p>
              YukiMart là nền tảng thương mại điện tử hiện đại, được xây dựng với mục tiêu
              mang đến trải nghiệm mua sắm trực tuyến tốt nhất cho người Việt.
            </p>

            <h3>🎯 Sứ mệnh</h3>
            <p>
              Kết nối người mua và người bán, cung cấp sản phẩm chất lượng với giá cả hợp lý.
            </p>

            <h3>💻 Công nghệ</h3>
            <ul class="ym-about__tech-list">
              <li>Frontend: Vue.js 3 + TypeScript + Vite</li>
              <li>Backend: Laravel 12 + PHP 8.3</li>
              <li>API Documentation: Swagger / OpenAPI 3.0</li>
              <li>State Management: Pinia</li>
              <li>HTTP Client: Axios</li>
            </ul>

            <h3>📧 Liên hệ</h3>
            <address class="ym-about__contact">
              Email: <a href="mailto:admin@yukimart.com">admin@yukimart.com</a><br />
              Website: <a href="https://yukimart.com" rel="noopener">yukimart.com</a>
            </address>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ym-about__section {
  padding: var(--space-8, 32px) 0;
}
.ym-about__container {
  max-width: 800px;
}
.ym-about__card {
  border-radius: var(--radius-lg);
  background: #fff;
  box-shadow: var(--shadow-sm);
}
.ym-about__body {
  padding: var(--space-8, 32px);
}
.ym-about__body h2 {
  margin: 0 0 var(--space-4, 16px);
  font-size: var(--text-xl);
  color: var(--color-text);
}
.ym-about__body h3 {
  margin: var(--space-6, 24px) 0 var(--space-3, 12px);
  font-size: var(--text-lg);
  color: var(--color-text);
}
.ym-about__body p {
  color: var(--color-text-muted);
  margin: 0 0 var(--space-4, 16px);
  line-height: var(--leading-relaxed);
}
.ym-about__tech-list {
  color: var(--color-text-muted);
  padding-left: var(--space-6, 24px);
  margin: 0 0 var(--space-4, 16px);
  line-height: var(--leading-relaxed);
}
.ym-about__contact {
  font-style: normal;
  color: var(--color-text-muted);
  line-height: var(--leading-relaxed);
}
.ym-about__contact a {
  color: var(--color-primary);
}
.ym-about__contact a:hover {
  text-decoration: underline;
}
</style>
