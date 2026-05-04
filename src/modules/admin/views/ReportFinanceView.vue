<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatPrice } from '@/modules/mypage/home/configs'
import ShopImportExport from '../components/ShopImportExport.vue'

const period = ref<'month' | 'quarter' | 'ytd'>('month')

const data = computed(() => {
  const mul = period.value === 'month' ? 1 : period.value === 'quarter' ? 3 : 5
  return {
    revenue: 245_000_000 * mul,
    cogs: 142_000_000 * mul,
    expense: 38_000_000 * mul,
    grossProfit: 103_000_000 * mul,
    netProfit: 65_000_000 * mul,
    margin: 26.5,
  }
})

const expenses = ref([
  { name: 'Lương nhân viên', value: 18_000_000, color: '#326e51' },
  { name: 'Mặt bằng', value: 8_500_000, color: '#2563eb' },
  { name: 'Marketing', value: 5_200_000, color: '#e91e63' },
  { name: 'Vận chuyển', value: 3_400_000, color: '#ff6600' },
  { name: 'Khác', value: 2_900_000, color: '#6b7280' },
])
const totalExpense = computed(() => expenses.value.reduce((s, e) => s + e.value, 0))

const cashFlow = computed(() => [
  { label: 'T1', income: 245_000_000, expense: 180_000_000 },
  { label: 'T2', income: 268_000_000, expense: 192_000_000 },
  { label: 'T3', income: 312_000_000, expense: 215_000_000 },
  { label: 'T4', income: 290_000_000, expense: 208_000_000 },
  { label: 'T5', income: 245_000_000, expense: 180_000_000 },
])
const maxCashFlow = computed(() => Math.max(...cashFlow.value.flatMap((c) => [c.income, c.expense])))
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div><h1>Báo cáo tài chính</h1><p>Doanh thu, chi phí, lợi nhuận và dòng tiền</p></div>
      <div class="ym-page__actions">
        <div class="ym-tabs" style="border: none">
          <button v-for="p in [{ k: 'month', l: 'Tháng' }, { k: 'quarter', l: 'Quý' }, { k: 'ytd', l: 'Năm nay' }]" :key="p.k" type="button" :class="['ym-tabs__item', { 'is-active': period === p.k }]" @click="period = p.k as typeof period">{{ p.l }}</button>
        </div>
        <ShopImportExport entity="reports-finance" label="báo cáo tài chính" />
      </div>
    </header>

    <section class="ym-finance-stats">
      <article class="ym-fstat">
        <span class="ym-fstat__icon" style="background: #e8f0ec; color: #326e51"><i class="ri-money-dollar-circle-line"></i></span>
        <div><p>Doanh thu</p><strong>{{ formatPrice(data.revenue) }}</strong></div>
      </article>
      <article class="ym-fstat">
        <span class="ym-fstat__icon" style="background: #fef3c7; color: #92400e"><i class="ri-shopping-cart-line"></i></span>
        <div><p>Giá vốn (COGS)</p><strong>{{ formatPrice(data.cogs) }}</strong></div>
      </article>
      <article class="ym-fstat">
        <span class="ym-fstat__icon" style="background: #fee2e2; color: #d0021b"><i class="ri-arrow-down-circle-line"></i></span>
        <div><p>Chi phí</p><strong>{{ formatPrice(data.expense) }}</strong></div>
      </article>
      <article class="ym-fstat">
        <span class="ym-fstat__icon" style="background: #dbeafe; color: #1e40af"><i class="ri-line-chart-line"></i></span>
        <div><p>Lợi nhuận gộp</p><strong>{{ formatPrice(data.grossProfit) }}</strong></div>
      </article>
      <article class="ym-fstat">
        <span class="ym-fstat__icon" style="background: #dcfce7; color: #166534"><i class="ri-funds-line"></i></span>
        <div><p>Lợi nhuận ròng</p><strong style="color: #166534">{{ formatPrice(data.netProfit) }}</strong></div>
      </article>
      <article class="ym-fstat">
        <span class="ym-fstat__icon" style="background: #ede9fe; color: #6d28d9"><i class="ri-percent-line"></i></span>
        <div><p>Biên LN ròng</p><strong>{{ data.margin }}%</strong></div>
      </article>
    </section>

    <div class="ym-grid">
      <section class="ym-card ym-card--span">
        <div class="ym-card__header"><h2>Dòng tiền theo tháng</h2></div>
        <div class="ym-card__body">
          <div class="ym-cashflow">
            <div v-for="(c, idx) in cashFlow" :key="idx" class="ym-cashflow__col">
              <div class="ym-cashflow__bars">
                <div class="ym-cashflow__bar ym-cashflow__bar--in" :style="{ height: `${(c.income / maxCashFlow) * 100}%` }"></div>
                <div class="ym-cashflow__bar ym-cashflow__bar--out" :style="{ height: `${(c.expense / maxCashFlow) * 100}%` }"></div>
              </div>
              <div class="ym-cashflow__label">{{ c.label }}</div>
              <div class="ym-cashflow__net" :style="{ color: c.income - c.expense >= 0 ? '#166534' : '#d0021b' }">
                {{ Math.round((c.income - c.expense) / 1_000_000) }}M
              </div>
            </div>
          </div>
          <div class="ym-cashflow__legend">
            <span><span class="ym-cashflow__dot" style="background: #166534"></span> Thu</span>
            <span><span class="ym-cashflow__dot" style="background: #d0021b"></span> Chi</span>
            <span class="is-muted">Số ở dưới: Thu - Chi (triệu ₫)</span>
          </div>
        </div>
      </section>

      <section class="ym-card">
        <div class="ym-card__header"><h2>Cơ cấu chi phí</h2></div>
        <div class="ym-card__body">
          <div v-for="e in expenses" :key="e.name" class="ym-expense-row">
            <span class="ym-expense-dot" :style="{ background: e.color }"></span>
            <span class="ym-expense-name">{{ e.name }}</span>
            <strong>{{ formatPrice(e.value) }}</strong>
            <span class="ym-expense-pct">{{ Math.round((e.value / totalExpense) * 100) }}%</span>
          </div>
          <div class="ym-expense-total">
            <strong>Tổng chi phí</strong>
            <strong style="color: #d0021b">{{ formatPrice(totalExpense) }}</strong>
          </div>
        </div>
      </section>

      <section class="ym-card">
        <div class="ym-card__header"><h2>Phân tích lợi nhuận</h2></div>
        <div class="ym-card__body">
          <div class="ym-pl-row">
            <span>Doanh thu</span>
            <strong style="color: #326e51">+{{ formatPrice(data.revenue) }}</strong>
          </div>
          <div class="ym-pl-row">
            <span>Trừ giá vốn</span>
            <strong style="color: #92400e">-{{ formatPrice(data.cogs) }}</strong>
          </div>
          <div class="ym-pl-row ym-pl-row--strong">
            <span>= Lợi nhuận gộp</span>
            <strong>{{ formatPrice(data.grossProfit) }}</strong>
          </div>
          <div class="ym-pl-row">
            <span>Trừ chi phí HĐ</span>
            <strong style="color: #d0021b">-{{ formatPrice(data.expense) }}</strong>
          </div>
          <div class="ym-pl-row ym-pl-row--final">
            <span>= Lợi nhuận ròng</span>
            <strong style="color: #166534">{{ formatPrice(data.netProfit) }}</strong>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-finance-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
.ym-fstat { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 16px; }
.ym-fstat__icon { width: 44px; height: 44px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.ym-fstat p { margin: 0; font-size: 12px; color: #6b7280; }
.ym-fstat strong { font-size: 17px; color: #111827; }

.ym-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 1024px) { .ym-grid { grid-template-columns: 1fr; } }
.ym-card--span { grid-column: 1 / -1; }
.ym-card__header { padding: 14px 18px; border-bottom: 1px solid #f1f3f5; }
.ym-card__header h2 { margin: 0; font-size: 15px; font-weight: 600; }
.ym-card__body { padding: 16px; }

.ym-cashflow { display: flex; gap: 12px; align-items: flex-end; height: 220px; }
.ym-cashflow__col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end; }
.ym-cashflow__bars { display: flex; gap: 3px; align-items: flex-end; height: 100%; width: 100%; justify-content: center; }
.ym-cashflow__bar { width: 18px; min-height: 4px; border-radius: 4px 4px 0 0; transition: height 0.4s; }
.ym-cashflow__bar--in { background: linear-gradient(180deg, #44a273 0%, #166534 100%); }
.ym-cashflow__bar--out { background: linear-gradient(180deg, #f87171 0%, #d0021b 100%); }
.ym-cashflow__label { font-size: 12px; color: #6b7280; }
.ym-cashflow__net { font-size: 11px; font-weight: 600; }
.ym-cashflow__legend { display: flex; gap: 16px; align-items: center; padding: 10px 0 0; font-size: 12px; color: #4b5563; }
.ym-cashflow__legend .is-muted { margin-left: auto; color: #9ca3af; }
.ym-cashflow__dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }

.ym-expense-row { display: grid; grid-template-columns: 14px 1fr 120px 50px; gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px dashed #f1f3f5; font-size: 14px; }
.ym-expense-row:last-of-type { border-bottom: none; }
.ym-expense-dot { width: 10px; height: 10px; border-radius: 50%; }
.ym-expense-name { color: #1f2937; }
.ym-expense-row strong { text-align: right; color: #111827; }
.ym-expense-pct { text-align: right; color: #6b7280; font-size: 12px; }
.ym-expense-total { display: flex; justify-content: space-between; padding: 12px 0 0; border-top: 2px solid #e5e7eb; margin-top: 6px; }

.ym-pl-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
.ym-pl-row--strong { padding: 10px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; font-weight: 600; }
.ym-pl-row--final { padding: 12px 14px; background: #e8f0ec; border-radius: 8px; margin-top: 8px; font-weight: 700; font-size: 15px; }
</style>
