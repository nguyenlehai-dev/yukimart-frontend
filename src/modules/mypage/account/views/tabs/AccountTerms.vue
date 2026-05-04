<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const sections = [
  { id: 'gioi-thieu', title: '1. Giới thiệu chung', icon: 'ri-information-line' },
  { id: 'quyen-trach-nhiem', title: '2. Quyền và trách nhiệm', icon: 'ri-shield-user-line' },
  { id: 'hoa-don', title: '3. Hoá đơn và thanh toán', icon: 'ri-bill-line' },
  { id: 'tranh-chap', title: '4. Xử lý tranh chấp', icon: 'ri-scales-3-line' },
]

const activeSection = ref(sections[0].id)
let observer: IntersectionObserver | null = null

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

function printDoc() {
  window.print()
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      }
    },
    { rootMargin: '-20% 0px -60% 0px' },
  )
  sections.forEach(s => {
    const el = document.getElementById(s.id)
    if (el) observer?.observe(el)
  })
})

onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div class="ym-acc-panel">
    <div class="ym-acc-panel__header">
      <div class="ym-acc-terms-header">
        <div>
          <h2 class="ym-acc-panel__title">Điều khoản sử dụng</h2>
          <p class="ym-acc-panel__desc">Chính sách cung cấp dịch vụ và thông tin pháp lý của nền tảng YukiMart</p>
        </div>
        <button type="button" class="ym-btn ym-btn--outline ym-btn--sm ym-acc-terms-print" @click="printDoc">
          <i class="ri-printer-line" aria-hidden="true"></i> In tài liệu
        </button>
      </div>
    </div>

    <div class="ym-acc-panel__body ym-acc-terms-layout">
      <!-- TOC -->
      <nav class="ym-acc-terms-toc" aria-label="Mục lục">
        <h3 class="ym-acc-terms-toc__title">Mục lục</h3>
        <ul class="ym-acc-terms-toc__list">
          <li v-for="s in sections" :key="s.id">
            <button
              type="button"
              class="ym-acc-terms-toc__link"
              :class="{ 'ym-acc-terms-toc__link--active': activeSection === s.id }"
              :aria-current="activeSection === s.id ? 'true' : undefined"
              @click="scrollToSection(s.id)"
            >
              <i :class="s.icon" aria-hidden="true"></i>
              <span>{{ s.title }}</span>
            </button>
          </li>
        </ul>
      </nav>

      <!-- Content -->
      <article class="ym-acc-document">
        <section :id="sections[0].id">
          <h3>{{ sections[0].title }}</h3>
          <p>Chào mừng bạn đến với nền tảng thương mại điện tử YukiMart. Khi bạn đăng ký tài khoản và sử dụng các dịch vụ liên quan đến Cửa hàng (Gian hàng) hoặc mua sắm, bạn mặc nhiên đồng ý với các Quy định và Điều khoản Dịch vụ mà chúng tôi liệt kê dưới đây.</p>
        </section>

        <section :id="sections[1].id">
          <h3>{{ sections[1].title }}</h3>
          <p>Đối với thành viên cấp Sỉ hoặc quản lý Gian hàng, bạn cam kết cung cấp thông tin trung thực về mặt hàng. Không kinh doanh hàng giả, hàng nhái, hoặc các loại sản phẩm nằm trong danh mục cấm theo Luật pháp nền tảng quy định. Việc duy trì Gói Dịch Vụ phải được chi trả đúng hạn theo &ldquo;Lịch sử mua hàng&rdquo;.</p>
        </section>

        <section :id="sections[2].id">
          <h3>{{ sections[2].title }}</h3>
          <p>Chúng tôi cung cấp &ldquo;Hoá đơn điện tử&rdquo; hợp lệ cho mọi giao dịch mua dịch vụ phần mềm hoặc hàng hoá từ YukiMart trực tiếp. Các hoá đơn có thể được tải xuống trong kỳ kế toán ở mục tương ứng.</p>
        </section>

        <section :id="sections[3].id">
          <h3>{{ sections[3].title }}</h3>
          <p>Các giao dịch đã kích hoạt mã dịch vụ phần mềm không hỗ trợ hoàn huỷ trừ khi do lỗi kỹ thuật phát sinh từ phía hệ thống YukiMart. Trong vòng 24h, nếu có sự cố kết nối khiến dịch vụ không nhận diện thành công, vui lòng mở Ticket Hỗ trợ.</p>
        </section>

        <footer class="ym-acc-document__footer">
          <p>
            <em>Phiên bản cập nhật lần cuối: <strong>20/03/2026</strong>. Mọi thắc mắc xin liên hệ Hotline: <a href="tel:0933738798">093 373 87 98</a>.</em>
          </p>
        </footer>
      </article>
    </div>
  </div>
</template>

<style scoped>
.ym-acc-terms-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.ym-acc-terms-print {
  flex-shrink: 0;
}

.ym-acc-terms-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 32px;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .ym-acc-terms-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

/* TOC sidebar */
.ym-acc-terms-toc {
  position: sticky;
  top: 16px;
  align-self: start;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
}
@media (max-width: 768px) {
  .ym-acc-terms-toc {
    position: static;
  }
}

.ym-acc-terms-toc__title {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 12px;
}

.ym-acc-terms-toc__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ym-acc-terms-toc__link {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  text-align: left;
  cursor: pointer;
  transition: background 150ms ease-out, color 150ms ease-out;
}
.ym-acc-terms-toc__link i {
  font-size: 16px;
  color: #94a3b8;
  flex-shrink: 0;
}
.ym-acc-terms-toc__link:hover {
  background: #fff;
  color: var(--color-primary, #326e51);
}
.ym-acc-terms-toc__link:hover i {
  color: var(--color-primary, #326e51);
}
.ym-acc-terms-toc__link:focus { outline: none; }
.ym-acc-terms-toc__link:focus-visible {
  outline: 2px solid var(--color-primary, #326e51);
  outline-offset: 2px;
}
.ym-acc-terms-toc__link--active {
  background: var(--color-primary, #326e51);
  color: #fff;
}
.ym-acc-terms-toc__link--active i {
  color: #fff;
}

/* Document */
.ym-acc-document {
  color: #374151;
  line-height: 1.7;
  max-width: 720px;
}
.ym-acc-document section {
  scroll-margin-top: 16px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f1f5f9;
}
.ym-acc-document section:last-of-type {
  border-bottom: none;
}
.ym-acc-document h3 {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-top: 0;
  margin-bottom: 12px;
}
.ym-acc-document p {
  margin-bottom: 12px;
}
.ym-acc-document__footer {
  margin-top: 24px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 13px;
  color: #64748b;
}
.ym-acc-document__footer a {
  color: var(--color-primary, #326e51);
  font-weight: 600;
}

/* Print stylesheet */
@media print {
  .ym-acc-terms-toc,
  .ym-acc-terms-print,
  :global(.ym-acc-sidebar),
  :global(.ym-acc-header-bg) {
    display: none !important;
  }
  .ym-acc-terms-layout {
    grid-template-columns: 1fr;
  }
}
</style>
