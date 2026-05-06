<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { accountApi } from '../../../../../services/api'

type PurchaseCategory = 'upgrade' | 'renewal' | 'new' | 'support'
interface PurchaseItem {
  id: number
  name: string
  category: PurchaseCategory
  date: string // dd/mm/yyyy
  amount: number // VND
}

const mockData = ref<PurchaseItem[]>([])
const loading = ref(true)
const loadError = ref('')

const VALID_CATEGORIES: PurchaseCategory[] = ['upgrade', 'renewal', 'new', 'support']

function isoToDdMmYyyy(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return String(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function mapPurchase(raw: any): PurchaseItem {
  const cat = VALID_CATEGORIES.includes(raw.category) ? (raw.category as PurchaseCategory) : 'new'
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    category: cat,
    date: raw.date ? String(raw.date) : isoToDdMmYyyy(raw.createdAt),
    amount: Number(raw.amount ?? 0),
  }
}

onMounted(async () => {
  try {
    const res = await accountApi.purchaseHistory()
    const items = res.data?.data?.items ?? []
    mockData.value = items.map(mapPurchase)
  } catch (err: any) {
    loadError.value = err?.response?.data?.message || 'Không tải được lịch sử mua hàng'
  } finally {
    loading.value = false
  }
})

const categoryMeta: Record<PurchaseItem['category'], { label: string; icon: string; class: string }> = {
  upgrade: { label: 'Nâng cấp', icon: 'ri-arrow-up-circle-line', class: 'cat-upgrade' },
  renewal: { label: 'Tái ký', icon: 'ri-refresh-line', class: 'cat-renewal' },
  new: { label: 'Mua mới', icon: 'ri-shopping-bag-3-line', class: 'cat-new' },
  support: { label: 'Hỗ trợ', icon: 'ri-customer-service-2-line', class: 'cat-support' },
}

// ── Filters ──
const itemsPerPage = 5
const currentPage = ref(1)
const searchTerm = ref('')
const sortKey = ref<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc')

// ── Helpers ──
function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

function parseDate(s: string): number {
  const [d, m, y] = s.split('/').map(Number)
  return new Date(y, m - 1, d).getTime()
}

function relativeTime(s: string): string {
  const ms = Date.now() - parseDate(s)
  const days = Math.floor(ms / 86400000)
  if (days < 30) return `${days} ngày trước`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} tháng trước`
  const years = Math.floor(months / 12)
  return `${years} năm trước`
}

// ── Stats summary ──
const stats = computed(() => {
  const total = mockData.value.reduce((sum, p) => sum + p.amount, 0)
  const latest = [...mockData.value].sort((a, b) => parseDate(b.date) - parseDate(a.date))[0]
  return {
    count: mockData.value.length,
    total,
    latest,
    avgPerYear: total / Math.max(1, new Set(mockData.value.map(p => p.date.split('/')[2])).size),
  }
})

// ── Filter + Sort ──
const filtered = computed(() => {
  const q = searchTerm.value.trim().toLowerCase()
  let list = q ? mockData.value.filter(d => d.name.toLowerCase().includes(q)) : [...mockData.value]
  switch (sortKey.value) {
    case 'date_desc':
      list.sort((a, b) => parseDate(b.date) - parseDate(a.date))
      break
    case 'date_asc':
      list.sort((a, b) => parseDate(a.date) - parseDate(b.date))
      break
    case 'amount_desc':
      list.sort((a, b) => b.amount - a.amount)
      break
    case 'amount_asc':
      list.sort((a, b) => a.amount - b.amount)
      break
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / itemsPerPage)))
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filtered.value.slice(start, start + itemsPerPage)
})

// Range info: "1-5 / 7"
const rangeInfo = computed(() => {
  if (filtered.value.length === 0) return ''
  const start = (currentPage.value - 1) * itemsPerPage + 1
  const end = Math.min(currentPage.value * itemsPerPage, filtered.value.length)
  return `${start}–${end} / ${filtered.value.length}`
})

watch([searchTerm, sortKey], () => { currentPage.value = 1 })

function prevPage() { if (currentPage.value > 1) currentPage.value-- }
function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++ }
function goToPage(page: number) { currentPage.value = page }
</script>

<template>
  <div class="ym-acc-panel ym-history">
    <!-- Header -->
    <div class="ym-acc-panel__header ym-history__header">
      <div>
        <h2 class="ym-acc-panel__title">Lịch sử mua hàng</h2>
        <p class="ym-acc-panel__desc">Kiểm tra thông tin gia hạn và nâng cấp các gói dịch vụ</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="ym-acc-empty" role="status" aria-busy="true">
      <div class="ym-acc-empty__icon" aria-hidden="true"><i class="ri-loader-4-line"></i></div>
      <h3 class="ym-acc-empty__title">Đang tải lịch sử mua hàng...</h3>
    </div>
    <!-- Error -->
    <div v-else-if="loadError" class="ym-acc-empty" role="alert">
      <div class="ym-acc-empty__icon" aria-hidden="true"><i class="ri-error-warning-line"></i></div>
      <h3 class="ym-acc-empty__title">Không tải được dữ liệu</h3>
      <p class="ym-acc-empty__desc">{{ loadError }}</p>
    </div>

    <template v-else>
    <!-- Stats Summary -->
    <div class="ym-history__stats" role="group" aria-label="Tổng quan mua hàng">
      <div class="ym-history-stat">
        <div class="ym-history-stat__icon ym-history-stat__icon--primary" aria-hidden="true">
          <i class="ri-shopping-bag-3-line"></i>
        </div>
        <div class="ym-history-stat__content">
          <span class="ym-history-stat__label">Tổng giao dịch</span>
          <strong class="ym-history-stat__value">{{ stats.count }}</strong>
        </div>
      </div>
      <div class="ym-history-stat">
        <div class="ym-history-stat__icon ym-history-stat__icon--money" aria-hidden="true">
          <i class="ri-money-dollar-circle-line"></i>
        </div>
        <div class="ym-history-stat__content">
          <span class="ym-history-stat__label">Tổng đã chi</span>
          <strong class="ym-history-stat__value">{{ formatVnd(stats.total) }}</strong>
        </div>
      </div>
      <div class="ym-history-stat">
        <div class="ym-history-stat__icon ym-history-stat__icon--time" aria-hidden="true">
          <i class="ri-calendar-check-line"></i>
        </div>
        <div class="ym-history-stat__content">
          <span class="ym-history-stat__label">Mua gần nhất</span>
          <strong class="ym-history-stat__value">{{ stats.latest?.date || '—' }}</strong>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="ym-history__toolbar">
      <form class="ym-history__search" @submit.prevent>
        <div class="ym-history__search-wrap">
          <label for="ym-acc-history-search" class="visually-hidden">Tìm kiếm dịch vụ</label>
          <i class="ri-search-line ym-history__search-icon" aria-hidden="true"></i>
          <input
            id="ym-acc-history-search"
            v-model="searchTerm"
            type="search"
            class="ym-history__search-input"
            placeholder="Tìm theo tên dịch vụ..."
            autocomplete="off"
          />
          <button
            v-if="searchTerm"
            type="button"
            class="ym-history__search-clear"
            aria-label="Xoá tìm kiếm"
            @click="searchTerm = ''"
          >
            <i class="ri-close-line" aria-hidden="true"></i>
          </button>
        </div>
      </form>

      <div class="ym-history__sort">
        <label for="ym-history-sort" class="visually-hidden">Sắp xếp</label>
        <i class="ri-sort-desc" aria-hidden="true"></i>
        <select id="ym-history-sort" v-model="sortKey" class="ym-history__sort-select">
          <option value="date_desc">Mới nhất</option>
          <option value="date_asc">Cũ nhất</option>
          <option value="amount_desc">Giá cao nhất</option>
          <option value="amount_asc">Giá thấp nhất</option>
        </select>
      </div>
    </div>

    <p v-if="searchTerm" class="ym-history__result-count" aria-live="polite">
      Tìm thấy <strong>{{ filtered.length }}</strong> kết quả cho &ldquo;{{ searchTerm }}&rdquo;
    </p>

    <div class="ym-acc-panel__body">
      <!-- Empty state -->
      <div v-if="filtered.length === 0" class="ym-acc-empty" role="status">
        <div class="ym-acc-empty__icon" aria-hidden="true">
          <i :class="searchTerm ? 'ri-search-line' : 'ri-history-line'"></i>
        </div>
        <h3 class="ym-acc-empty__title">
          {{ searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có lịch sử mua hàng' }}
        </h3>
        <p class="ym-acc-empty__desc">
          {{ searchTerm
            ? `Không có dịch vụ nào khớp với "${searchTerm}". Thử từ khoá khác xem sao.`
            : 'Lịch sử các giao dịch mua dịch vụ sẽ hiển thị tại đây.' }}
        </p>
        <button v-if="searchTerm" type="button" class="ym-btn ym-btn--outline ym-btn--sm" @click="searchTerm = ''">
          <i class="ri-close-line" aria-hidden="true"></i> Xoá bộ lọc
        </button>
      </div>

      <!-- Desktop: Table -->
      <div v-else class="ym-history__table-wrap">
        <table class="ym-history-table" aria-label="Lịch sử mua hàng">
          <thead>
            <tr>
              <th scope="col">Dịch vụ</th>
              <th scope="col" class="ym-history-table__col-date">Ngày mua</th>
              <th scope="col" class="text-end">Số tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedData" :key="item.id" class="ym-history-row">
              <th scope="row" class="ym-history-row__service">
                <span class="ym-history-row__icon" :class="categoryMeta[item.category].class" aria-hidden="true">
                  <i :class="categoryMeta[item.category].icon"></i>
                </span>
                <span class="ym-history-row__service-info">
                  <span class="ym-history-row__name">{{ item.name }}</span>
                  <span class="ym-history-row__category">{{ categoryMeta[item.category].label }}</span>
                </span>
              </th>
              <td class="ym-history-row__date">
                <span class="ym-history-row__date-main">{{ item.date }}</span>
                <span class="ym-history-row__date-rel">{{ relativeTime(item.date) }}</span>
              </td>
              <td class="ym-history-row__amount">{{ formatVnd(item.amount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination + range info -->
      <div v-if="filtered.length > 0" class="ym-history__pagination">
        <p class="ym-history__pagination-info" aria-live="polite">
          Hiển thị <strong>{{ rangeInfo }}</strong>
        </p>
        <nav v-if="totalPages > 1" class="ym-pagination" aria-label="Phân trang lịch sử">
          <button type="button" class="ym-page-btn" aria-label="Trang trước" :disabled="currentPage === 1" @click="prevPage">
            <i class="ri-arrow-left-s-line" aria-hidden="true"></i>
          </button>
          <button
            v-for="page in totalPages"
            :key="page"
            type="button"
            class="ym-page-btn"
            :class="{ 'ym-page-btn--active': currentPage === page }"
            :aria-label="`Trang ${page}`"
            :aria-current="currentPage === page ? 'page' : undefined"
            @click="goToPage(page)">
            {{ page }}
          </button>
          <button type="button" class="ym-page-btn" aria-label="Trang sau" :disabled="currentPage === totalPages" @click="nextPage">
            <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
          </button>
        </nav>
      </div>
    </div>
    </template>
  </div>
</template>

<style scoped>
/* ── Stats summary ── */
.ym-history__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 20px 0 24px;
}

.ym-history-stat {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #fff;
  border: 1px solid #eef0f2;
  border-radius: 12px;
  transition: box-shadow 200ms ease-out, transform 200ms ease-out;
}
.ym-history-stat:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.ym-history-stat__icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.ym-history-stat__icon--primary {
  background: var(--color-primary-light, #e8f0ec);
  color: var(--color-primary, #326e51);
}
.ym-history-stat__icon--money {
  background: #fef3c7;
  color: #d97706;
}
.ym-history-stat__icon--time {
  background: #e0f2fe;
  color: #0284c7;
}

.ym-history-stat__content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.ym-history-stat__label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ym-history-stat__value {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-top: 2px;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Toolbar ── */
.ym-history__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.ym-history__search {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}
.ym-history__search-wrap {
  position: relative;
}
.ym-history__search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 18px;
  pointer-events: none;
}
.ym-history__search-input {
  width: 100%;
  padding: 10px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  background: #fff;
  color: #111827;
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
}
.ym-history__search-input::placeholder { color: #94a3b8; }
.ym-history__search-input:hover:not(:focus) { border-color: #cbd5e1; }
.ym-history__search-input:focus {
  outline: none;
  border-color: var(--color-primary, #326e51);
  box-shadow: 0 0 0 3px rgba(50, 110, 81, 0.12);
}
.ym-history__search-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  cursor: pointer;
  transition: background 150ms;
}
.ym-history__search-clear:hover {
  background: #f1f5f9;
  color: #475569;
}

.ym-history__sort {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px 0 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #475569;
  height: 42px;
}
.ym-history__sort i {
  color: #94a3b8;
  font-size: 18px;
}
.ym-history__sort-select {
  border: none;
  background: none;
  font-size: 14px;
  font-family: inherit;
  font-weight: 500;
  color: #111827;
  cursor: pointer;
  padding: 0 4px 0 0;
  outline: none;
}

.ym-history__result-count {
  margin: 0 0 12px;
  padding: 8px 12px;
  background: var(--color-primary-light, #e8f0ec);
  color: var(--color-primary-dark, #285a42);
  border-radius: 8px;
  font-size: 13px;
}

/* ── Table ── */
.ym-history__table-wrap {
  background: #fff;
  border: 1px solid #eef0f2;
  border-radius: 12px;
  overflow: hidden;
}

.ym-history-table {
  width: 100%;
  border-collapse: collapse;
}

.ym-history-table thead {
  background: #f8fafc;
}
.ym-history-table th {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: left;
  border-bottom: 1px solid #eef0f2;
}
.ym-history-table th.text-end { text-align: right; }

.ym-history-row {
  transition: background 150ms ease-out;
}
.ym-history-row:hover {
  background: #f8fafc;
}
.ym-history-row td,
.ym-history-row th {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.ym-history-row:last-child td,
.ym-history-row:last-child th {
  border-bottom: none;
}

.ym-history-row__service {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  font-weight: normal;
  text-align: left;
}

.ym-history-row__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.ym-history-row__icon.cat-upgrade { background: #e0f2fe; color: #0284c7; }
.ym-history-row__icon.cat-renewal { background: var(--color-primary-light, #e8f0ec); color: var(--color-primary, #326e51); }
.ym-history-row__icon.cat-new { background: #fef3c7; color: #d97706; }
.ym-history-row__icon.cat-support { background: #ede9fe; color: #7c3aed; }

.ym-history-row__service-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.ym-history-row__name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}
.ym-history-row__category {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
  font-weight: 500;
}

.ym-history-row__date {
  white-space: nowrap;
}
.ym-history-row__date-main {
  display: block;
  font-size: 14px;
  color: #111827;
  font-weight: 500;
}
.ym-history-row__date-rel {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.ym-history-row__amount {
  text-align: right;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* ── Pagination block ── */
.ym-history__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eef0f2;
}
.ym-history__pagination-info {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

/* ── Responsive: mobile card list ── */
@media (max-width: 767px) {
  .ym-history__stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .ym-history-stat__value { font-size: 16px; }
  .ym-history__toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .ym-history__search { max-width: 100%; }
  .ym-history__sort { width: 100%; justify-content: flex-start; }

  /* Convert table to card list */
  .ym-history-table thead {
    display: none;
  }
  .ym-history-table,
  .ym-history-table tbody,
  .ym-history-row {
    display: block;
  }
  .ym-history-row {
    padding: 14px 16px;
    border-bottom: 1px solid #f1f5f9;
  }
  .ym-history-row:hover { background: transparent; }
  .ym-history-row td,
  .ym-history-row th {
    display: block;
    padding: 0;
    border-bottom: none;
  }
  .ym-history-row__service {
    margin-bottom: 8px;
  }
  .ym-history-row__date {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
  }
  .ym-history-row__date-main {
    font-size: 13px;
    color: #64748b;
    font-weight: normal;
  }
  .ym-history-row__amount {
    text-align: left;
    margin-top: 8px;
    font-size: 16px;
    color: var(--color-primary, #326e51);
  }
  .ym-history__pagination {
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ym-history-stat,
  .ym-history__search-input,
  .ym-history__search-clear,
  .ym-history-row { transition: none; }
}
</style>
