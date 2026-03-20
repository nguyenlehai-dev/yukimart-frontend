<script setup lang="ts">
import { ref } from 'vue'

const invoices = ref([
  { id: 'HD-2026-0012', date: '18/09/2025', total: '1,721,000đ', status: 'Đã xuất', company: 'YukiMart Viet Nam' },
  { id: 'HD-2025-0894', date: '29/06/2025', total: '2,640,000đ', status: 'Đã xuất', company: 'YukiMart Viet Nam' },
  { id: 'HD-2024-0011', date: '04/07/2024', total: '3,240,000đ', status: 'Đã xuất', company: 'YukiMart Viet Nam' }
])
</script>

<template>
  <div class="ym-acc-panel">
    <div class="ym-acc-panel__header">
      <h2 class="ym-acc-panel__title">Hóa đơn điện tử</h2>
      <p class="ym-acc-panel__desc">Tra cứu và tải xuống bản thể hiện hóa đơn VAT điện tử</p>
    </div>

    <!-- Search / Filter (Mock Demo) -->
    <div class="d-flex gap-3 mt-4 mb-4">
      <div class="ym-input-wrap flex-grow-1" style="max-width: 300px;">
        <i class="ri-search-line ym-input-icon"></i>
        <input type="text" class="ym-input" placeholder="Nhập mã hóa đơn..." />
      </div>
      <button class="ym-btn ym-btn--primary ym-btn--sm">Tra cứu</button>
    </div>

    <div class="ym-acc-panel__body">
      <div class="table-responsive">
        <table class="ym-table">
          <thead>
            <tr>
              <th>Mã Hóa Đơn</th>
              <th>Ngày xuất</th>
              <th>Đơn vị xuất</th>
              <th class="text-end">Tổng tiền hóa đơn</th>
              <th class="text-center">Trạng thái</th>
              <th class="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in invoices" :key="inv.id">
              <td class="fw-bold text-primary">{{ inv.id }}</td>
              <td>{{ inv.date }}</td>
              <td>{{ inv.company }}</td>
              <td class="text-end fw-bold">{{ inv.total }}</td>
              <td class="text-center">
                <span class="ym-soft-badge ym-soft-badge--success">{{ inv.status }}</span>
              </td>
              <td class="text-center">
                <button class="ym-btn ym-btn--light ym-btn--sm" title="Tải PDF">
                  <i class="ri-file-download-line"></i> Tải PDF
                </button>
              </td>
            </tr>
            <tr v-if="invoices.length === 0">
              <td colspan="6" class="text-center py-5 text-muted">Chưa có hóa đơn nào được xuất.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
