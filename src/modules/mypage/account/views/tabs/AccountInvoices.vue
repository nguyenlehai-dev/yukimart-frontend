<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Invoice {
  id: string
  date: string
  amount: number
  status: 'issued' | 'pending' | 'cancelled'
  company: string
}

const invoices = ref<Invoice[]>([
  { id: 'HD-2026-0012', date: '18/09/2025', amount: 1721000, status: 'issued', company: 'YukiMart Viet Nam' },
  { id: 'HD-2025-0894', date: '29/06/2025', amount: 2640000, status: 'issued', company: 'YukiMart Viet Nam' },
  { id: 'HD-2024-0011', date: '04/07/2024', amount: 3240000, status: 'issued', company: 'YukiMart Viet Nam' },
])

const statusMap: Record<Invoice['status'], { label: string; class: string; icon: string }> = {
  issued: { label: 'Đã xuất', class: 'is-success', icon: 'ri-checkbox-circle-line' },
  pending: { label: 'Đang xử lý', class: 'is-warning', icon: 'ri-time-line' },
  cancelled: { label: 'Đã huỷ', class: 'is-danger', icon: 'ri-close-circle-line' },
}

const searchTerm = ref('')
const statusFilter = ref<'all' | Invoice['status']>('all')

function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

function parseDate(s: string): number {
  const [d, m, y] = s.split('/').map(Number)
  return new Date(y, m - 1, d).getTime()
}

const filteredInvoices = computed(() => {
  const q = searchTerm.value.trim().toLowerCase()
  return invoices.value.filter(i => {
    if (statusFilter.value !== 'all' && i.status !== statusFilter.value) return false
    if (!q) return true
    return i.id.toLowerCase().includes(q) || i.company.toLowerCase().includes(q)
  })
})

const stats = computed(() => {
  const issued = invoices.value.filter(i => i.status === 'issued')
  return {
    count: invoices.value.length,
    total: issued.reduce((s, i) => s + i.amount, 0),
    latest: [...invoices.value].sort((a, b) => parseDate(b.date) - parseDate(a.date))[0],
  }
})

const filterTabs = computed(() => [
  { key: 'all' as const, label: 'Tất cả', count: invoices.value.length },
  { key: 'issued' as const, label: 'Đã xuất', count: invoices.value.filter(i => i.status === 'issued').length },
  { key: 'pending' as const, label: 'Đang xử lý', count: invoices.value.filter(i => i.status === 'pending').length },
  { key: 'cancelled' as const, label: 'Đã huỷ', count: invoices.value.filter(i => i.status === 'cancelled').length },
])

watch([searchTerm, statusFilter], () => { /* live filter */ })

function downloadInvoice(inv: Invoice) {
  console.log('download invoice', inv.id)
}
function downloadAll() {
  console.log('download all', filteredInvoices.value.map(i => i.id))
}
</script>

<template>
  <div class="ym-acc-panel ym-invoices">
    <div class="ym-acc-panel__header">
      <h2 class="ym-acc-panel__title">Hoá đơn điện tử</h2>
      <p class="ym-acc-panel__desc">Tra cứu và tải xuống bản thể hiện hoá đơn VAT điện tử</p>
    </div>

    <!-- Stats -->
    <div class="ym-invoices__stats" role="group" aria-label="Tổng quan hoá đơn">
      <div class="ym-invoices-stat">
        <div class="ym-invoices-stat__icon ym-invoices-stat__icon--primary" aria-hidden="true">
          <i class="ri-receipt-line"></i>
        </div>
        <div class="ym-invoices-stat__content">
          <span class="ym-invoices-stat__label">Tổng hoá đơn</span>
          <strong class="ym-invoices-stat__value">{{ stats.count }}</strong>
        </div>
      </div>
      <div class="ym-invoices-stat">
        <div class="ym-invoices-stat__icon ym-invoices-stat__icon--money" aria-hidden="true">
          <i class="ri-money-dollar-circle-line"></i>
        </div>
        <div class="ym-invoices-stat__content">
          <span class="ym-invoices-stat__label">Đã xuất hoá đơn</span>
          <strong class="ym-invoices-stat__value">{{ formatVnd(stats.total) }}</strong>
        </div>
      </div>
      <div class="ym-invoices-stat">
        <div class="ym-invoices-stat__icon ym-invoices-stat__icon--time" aria-hidden="true">
          <i class="ri-calendar-check-line"></i>
        </div>
        <div class="ym-invoices-stat__content">
          <span class="ym-invoices-stat__label">Hoá đơn gần nhất</span>
          <strong class="ym-invoices-stat__value">{{ stats.latest?.date || '—' }}</strong>
        </div>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="ym-acc-tabs-wrap">
      <div class="ym-acc-tabs" role="group" aria-label="Lọc theo trạng thái">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          type="button"
          class="ym-acc-tab"
          :class="{ 'ym-acc-tab--active': statusFilter === tab.key }"
          :aria-pressed="statusFilter === tab.key"
          @click="statusFilter = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.count > 0" class="ym-acc-tab__count" aria-hidden="true">{{ tab.count }}</span>
          <span class="visually-hidden">({{ tab.count }})</span>
        </button>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="ym-invoices__toolbar">
      <form class="ym-invoices__search" @submit.prevent>
        <div class="ym-invoices__search-wrap">
          <label for="ym-invoice-search" class="visually-hidden">Tìm theo mã hoá đơn</label>
          <i class="ri-search-line ym-invoices__search-icon" aria-hidden="true"></i>
          <input
            id="ym-invoice-search"
            v-model="searchTerm"
            type="search"
            class="ym-invoices__search-input"
            placeholder="Tìm theo mã hoá đơn hoặc đơn vị..."
            autocomplete="off"
          />
          <button
            v-if="searchTerm"
            type="button"
            class="ym-invoices__search-clear"
            aria-label="Xoá tìm kiếm"
            @click="searchTerm = ''"
          >
            <i class="ri-close-line" aria-hidden="true"></i>
          </button>
        </div>
      </form>

      <button
        type="button"
        class="ym-btn ym-btn--outline ym-btn--sm"
        :disabled="filteredInvoices.length === 0"
        @click="downloadAll"
      >
        <i class="ri-download-cloud-line" aria-hidden="true"></i>
        Tải tất cả ({{ filteredInvoices.length }})
      </button>
    </div>

    <div class="ym-acc-panel__body">
      <!-- Empty state -->
      <div v-if="filteredInvoices.length === 0" class="ym-acc-empty" role="status">
        <div class="ym-acc-empty__icon" aria-hidden="true">
          <i :class="searchTerm || statusFilter !== 'all' ? 'ri-search-line' : 'ri-receipt-line'"></i>
        </div>
        <h3 class="ym-acc-empty__title">
          {{ searchTerm || statusFilter !== 'all' ? 'Không tìm thấy hoá đơn' : 'Chưa có hoá đơn nào' }}
        </h3>
        <p class="ym-acc-empty__desc">
          {{ searchTerm || statusFilter !== 'all'
            ? 'Hãy thử bộ lọc khác hoặc xoá từ khoá tìm kiếm.'
            : 'Hoá đơn của bạn sẽ hiển thị tại đây sau khi xuất.' }}
        </p>
        <button
          v-if="searchTerm || statusFilter !== 'all'"
          type="button"
          class="ym-btn ym-btn--outline ym-btn--sm"
          @click="searchTerm = ''; statusFilter = 'all'"
        >
          <i class="ri-close-line" aria-hidden="true"></i> Xoá bộ lọc
        </button>
      </div>

      <!-- Table -->
      <div v-else class="ym-invoices__table-wrap">
        <table class="ym-invoices-table" aria-label="Danh sách hoá đơn điện tử">
          <thead>
            <tr>
              <th scope="col">Mã hoá đơn</th>
              <th scope="col">Ngày xuất</th>
              <th scope="col">Đơn vị</th>
              <th scope="col" class="text-end">Tổng tiền</th>
              <th scope="col" class="text-center">Trạng thái</th>
              <th scope="col" class="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in filteredInvoices" :key="inv.id" class="ym-invoices-row">
              <th scope="row" class="ym-invoices-row__id">
                <span class="ym-invoices-row__icon" aria-hidden="true">
                  <i class="ri-file-text-line"></i>
                </span>
                <span class="ym-invoices-row__id-text">{{ inv.id }}</span>
              </th>
              <td class="ym-invoices-row__date">{{ inv.date }}</td>
              <td class="ym-invoices-row__company">{{ inv.company }}</td>
              <td class="ym-invoices-row__amount">{{ formatVnd(inv.amount) }}</td>
              <td class="text-center">
                <span class="ym-status-pill" :class="statusMap[inv.status].class">
                  <i :class="statusMap[inv.status].icon" aria-hidden="true"></i>
                  {{ statusMap[inv.status].label }}
                </span>
              </td>
              <td class="text-end">
                <button
                  type="button"
                  class="ym-btn-ghost"
                  :aria-label="`Tải PDF hoá đơn ${inv.id}`"
                  @click="downloadInvoice(inv)"
                >
                  <i class="ri-file-download-line" aria-hidden="true"></i>
                  <span>Tải PDF</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Stats ── */
.ym-invoices__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 20px 0 24px;
}
.ym-invoices-stat {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #fff;
  border: 1px solid #eef0f2;
  border-radius: 12px;
  transition: box-shadow 200ms ease-out, transform 200ms ease-out;
}
.ym-invoices-stat:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}
.ym-invoices-stat__icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.ym-invoices-stat__icon--primary { background: var(--color-primary-light, #e8f0ec); color: var(--color-primary, #326e51); }
.ym-invoices-stat__icon--money { background: #fef3c7; color: #d97706; }
.ym-invoices-stat__icon--time { background: #e0f2fe; color: #0284c7; }
.ym-invoices-stat__content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.ym-invoices-stat__label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ym-invoices-stat__value {
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
.ym-invoices__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.ym-invoices__search {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}
.ym-invoices__search-wrap {
  position: relative;
}
.ym-invoices__search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 18px;
  pointer-events: none;
}
.ym-invoices__search-input {
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
.ym-invoices__search-input::placeholder { color: #94a3b8; }
.ym-invoices__search-input:hover:not(:focus) { border-color: #cbd5e1; }
.ym-invoices__search-input:focus {
  outline: none;
  border-color: var(--color-primary, #326e51);
  box-shadow: 0 0 0 3px rgba(50, 110, 81, 0.12);
}
.ym-invoices__search-clear {
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
}
.ym-invoices__search-clear:hover {
  background: #f1f5f9;
  color: #475569;
}

/* ── Table ── */
.ym-invoices__table-wrap {
  background: #fff;
  border: 1px solid #eef0f2;
  border-radius: 12px;
  overflow: hidden;
  overflow-x: auto;
}
.ym-invoices-table {
  width: 100%;
  border-collapse: collapse;
}
.ym-invoices-table thead {
  background: #f8fafc;
}
.ym-invoices-table th {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: left;
  border-bottom: 1px solid #eef0f2;
  white-space: nowrap;
}
.ym-invoices-table th.text-end { text-align: right; }
.ym-invoices-table th.text-center { text-align: center; }

.ym-invoices-row {
  transition: background 150ms ease-out;
}
.ym-invoices-row:hover { background: #f8fafc; }
.ym-invoices-row td,
.ym-invoices-row th {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.ym-invoices-row:last-child td,
.ym-invoices-row:last-child th { border-bottom: none; }

.ym-invoices-row__id {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: normal;
  text-align: left;
}
.ym-invoices-row__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-primary-light, #e8f0ec);
  color: var(--color-primary, #326e51);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.ym-invoices-row__id-text {
  font-weight: 700;
  color: var(--color-primary, #326e51);
  font-variant-numeric: tabular-nums;
  font-size: 14px;
}
.ym-invoices-row__date {
  white-space: nowrap;
  font-size: 14px;
  color: #475569;
}
.ym-invoices-row__company {
  font-size: 14px;
  color: #111827;
}
.ym-invoices-row__amount {
  text-align: right;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* ── Status pill ── */
.ym-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.ym-status-pill i { font-size: 14px; }
.ym-status-pill.is-success { background: #dcfce7; color: #15803d; }
.ym-status-pill.is-warning { background: #fef9c3; color: #a16207; }
.ym-status-pill.is-danger { background: #fee2e2; color: #b91c1c; }

/* ── Action ghost button ── */
.ym-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: var(--color-primary, #326e51);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 150ms ease-out, border-color 150ms ease-out;
}
.ym-btn-ghost:hover {
  background: var(--color-primary-light, #e8f0ec);
  border-color: var(--color-primary, #326e51);
}
.ym-btn-ghost:focus { outline: none; }
.ym-btn-ghost:focus-visible {
  box-shadow: 0 0 0 3px rgba(50, 110, 81, 0.18);
}

/* ── Responsive ── */
@media (max-width: 991px) {
  .ym-invoices__stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .ym-invoices-stat__value { font-size: 16px; }
}
@media (max-width: 767px) {
  .ym-invoices__toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .ym-invoices__search { max-width: 100%; }

  /* Convert table to cards */
  .ym-invoices-table thead { display: none; }
  .ym-invoices-table,
  .ym-invoices-table tbody,
  .ym-invoices-row { display: block; }
  .ym-invoices-row {
    padding: 14px 16px;
    border-bottom: 1px solid #f1f5f9;
  }
  .ym-invoices-row:hover { background: transparent; }
  .ym-invoices-row td,
  .ym-invoices-row th {
    display: block;
    padding: 0;
    border-bottom: none;
  }
  .ym-invoices-row__id { margin-bottom: 8px; }
  .ym-invoices-row__date::before {
    content: 'Ngày: ';
    color: #64748b;
    font-weight: 500;
  }
  .ym-invoices-row__company {
    font-size: 13px;
    color: #64748b;
    margin-bottom: 4px;
  }
  .ym-invoices-row__amount {
    text-align: left;
    margin: 8px 0;
    font-size: 16px;
    color: var(--color-primary, #326e51);
  }
  .ym-invoices-row .text-center,
  .ym-invoices-row .text-end {
    text-align: left !important;
  }
  .ym-invoices-row :deep(.ym-btn-ghost) {
    margin-top: 8px;
    width: 100%;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ym-invoices-stat,
  .ym-invoices__search-input,
  .ym-invoices__search-clear,
  .ym-invoices-row,
  .ym-btn-ghost { transition: none; }
}
</style>
