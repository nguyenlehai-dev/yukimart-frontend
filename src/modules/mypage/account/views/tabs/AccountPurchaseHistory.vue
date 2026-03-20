<script setup lang="ts">
import { ref, computed } from 'vue'

const mockData = ref([
  { id: 1, name: 'Nâng gói Phần mềm quản lý bán hàng KiotViet', date: '18/09/2025', price: '1,721,000đ' },
  { id: 2, name: 'Tái ký dịch vụ phần mềm quản lý bán hàng KiotViet', date: '29/06/2025', price: '2,640,000đ' },
  { id: 3, name: 'Phần mềm quản lý bán hàng KiotViet', date: '04/07/2024', price: '3,240,000đ' },
  { id: 4, name: 'Nâng gói dịch vụ phần mềm quản lý bán hàng KiotViet', date: '05/09/2023', price: '1,800,000đ' },
  { id: 5, name: 'Tái ký dịch vụ phần mềm quản lý bán hàng KiotViet', date: '12/08/2022', price: '2,640,000đ' },
  { id: 6, name: 'Phần mềm quản lý bán hàng KiotViet (Mở rộng)', date: '10/01/2022', price: '1,100,000đ' },
  { id: 7, name: 'Nâng gói dịch vụ chăm sóc khách hàng', date: '05/11/2021', price: '500,000đ' }
])

const itemsPerPage = 5
const currentPage = ref(1)

const totalPages = computed(() => {
  return Math.ceil(mockData.value.length / itemsPerPage)
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return mockData.value.slice(start, end)
})

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function goToPage(page: number) {
  currentPage.value = page
}
</script>

<template>
  <div class="ym-acc-panel">
    <div class="ym-acc-panel__header">
      <h2 class="ym-acc-panel__title">Lịch sử mua hàng</h2>
      <p class="ym-acc-panel__desc">Kiểm tra thông tin gia hạn và nâng cấp các gói dịch vụ</p>
    </div>

    <div class="ym-acc-panel__body mt-4">
      <div class="table-responsive">
        <table class="ym-table">
          <thead>
            <tr>
              <th>Tên dịch vụ</th>
              <th>Ngày mua</th>
              <th class="text-end">Tổng tiền thanh toán</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedData" :key="item.id">
              <td style="font-weight: 500; color: #374151;">{{ item.name }}</td>
              <td class="text-muted">{{ item.date }}</td>
              <td class="text-end fw-bold" style="color: #111827;">{{ item.price }}</td>
            </tr>
            <tr v-if="mockData.length === 0">
              <td colspan="3" class="text-center py-5 text-muted">Chưa có lịch sử mua hàng nào.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Block -->
      <div class="ym-pagination mt-4 d-flex justify-content-end" v-if="totalPages > 1">
        <button class="ym-page-btn" :disabled="currentPage === 1" @click="prevPage">
          <i class="ri-arrow-left-s-line"></i>
        </button>
        <button 
          v-for="page in totalPages" :key="page"
          class="ym-page-btn" 
          :class="{ 'ym-page-btn--active': currentPage === page }"
          @click="goToPage(page)">
          {{ page }}
        </button>
        <button class="ym-page-btn" :disabled="currentPage === totalPages" @click="nextPage">
          <i class="ri-arrow-right-s-line"></i>
        </button>
      </div>
    </div>
  </div>
</template>
