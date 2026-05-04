<script setup lang="ts">
import { ref, computed } from 'vue'
import AdminModal from '../components/AdminModal.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useImportedAs } from '../composables/useImportedAs'
import { formatPrice } from '@/modules/mypage/home/configs'

interface Partner {
  id: number; name: string; logo: string; code: string; integrated: boolean; deliveriesPerMonth: number; avgFee: number; rating: number; supportPhone: string; description: string
}

const toast = useToast()
const seeded = ref<Partner[]>([
  { id: 1, name: 'Giao Hàng Nhanh', logo: '🚚', code: 'GHN', integrated: true, deliveriesPerMonth: 1850, avgFee: 28000, rating: 4.5, supportPhone: '1900 6328', description: 'Đối tác giao hàng nội thành nhanh, hỗ trợ COD và đối soát tự động.' },
  { id: 2, name: 'Giao Hàng Tiết Kiệm', logo: '📦', code: 'GHTK', integrated: true, deliveriesPerMonth: 920, avgFee: 22000, rating: 4.3, supportPhone: '1900 6092', description: 'Giao hàng tiết kiệm toàn quốc, phí thấp.' },
  { id: 3, name: 'J&T Express', logo: '🚀', code: 'JT', integrated: true, deliveriesPerMonth: 540, avgFee: 32000, rating: 4.4, supportPhone: '1900 1088', description: 'Tốc độ nhanh, phủ rộng các tỉnh thành.' },
  { id: 4, name: 'Viettel Post', logo: '📬', code: 'VTP', integrated: false, deliveriesPerMonth: 0, avgFee: 25000, rating: 4.0, supportPhone: '1900 8095', description: 'Mạng lưới quân đội rộng khắp, ổn định.' },
  { id: 5, name: 'Best Express', logo: '⚡', code: 'BEST', integrated: false, deliveriesPerMonth: 0, avgFee: 24000, rating: 4.1, supportPhone: '1900 0088', description: 'Đối tác mới, ưu đãi cho lần đầu.' },
  { id: 6, name: 'Ninja Van', logo: '🥷', code: 'NJV', integrated: true, deliveriesPerMonth: 280, avgFee: 30000, rating: 4.2, supportPhone: '1900 0838', description: 'Chuyển phát đa quốc gia trong khu vực.' },
])

const imported = useImportedAs<Partner>('shipping-partners', {
  name: ['ten', 'name'],
  code: ['ma', 'code'],
  logo: ['logo', 'icon'],
  integrated: ['da_tich_hop', 'integrated'],
  deliveriesPerMonth: ['don_thang', 'deliveries_per_month'],
  avgFee: ['phi_tb', 'avg_fee'],
  rating: ['danh_gia', 'rating'],
  supportPhone: ['hotline', 'support_phone'],
  description: ['mo_ta', 'description'],
}, (raw, m) => ({
  id: Number(raw.id),
  name: String(m.name ?? ''),
  code: String(m.code ?? ''),
  logo: String(m.logo ?? '📦'),
  integrated: Boolean(m.integrated === 1 || m.integrated === '1' || m.integrated === true),
  deliveriesPerMonth: Number(m.deliveriesPerMonth ?? 0),
  avgFee: Number(m.avgFee ?? 0),
  rating: Number(m.rating ?? 0),
  supportPhone: String(m.supportPhone ?? ''),
  description: String(m.description ?? ''),
}))
const partners = computed<Partner[]>(() => imported.hasData.value ? imported.items.value : seeded.value)

const configOpen = ref(false)
const target = ref<Partner | null>(null)
const cfg = ref({ apiKey: '', shopId: '', token: '' })

function openConfig(p: Partner) {
  target.value = p
  cfg.value = { apiKey: '', shopId: '', token: '' }
  configOpen.value = true
}
function saveConfig() {
  if (!target.value) return
  target.value.integrated = true
  toast.success('Đã kết nối', target.value.name)
  configOpen.value = false
}
function disconnect(p: Partner) {
  if (!confirm(`Ngắt kết nối ${p.name}?`)) return
  p.integrated = false
  toast.info('Đã ngắt kết nối', p.name)
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div><h1>Đối tác giao hàng</h1><p>Tích hợp các đơn vị vận chuyển hỗ trợ in vận đơn, theo dõi giao hàng</p></div>
      <div class="ym-page__actions">
        <ShopImportExport entity="shipping-partners" id-field="code" label="đối tác giao hàng" @imported="imported.refresh" />
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng đối tác</p><p class="ym-mini-stat__value">{{ partners.length }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đã tích hợp</p><p class="ym-mini-stat__value" style="color: #166534">{{ partners.filter(p => p.integrated).length }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đơn / tháng</p><p class="ym-mini-stat__value">{{ partners.reduce((s, p) => s + p.deliveriesPerMonth, 0).toLocaleString('vi-VN') }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Phí TB</p><p class="ym-mini-stat__value">{{ formatPrice(Math.round(partners.reduce((s, p) => s + p.avgFee, 0) / partners.length)) }}</p></article>
    </section>

    <div class="ym-partners">
      <article v-for="p in partners" :key="p.id" class="ym-partner">
        <div class="ym-partner__head">
          <span class="ym-partner__logo">{{ p.logo }}</span>
          <div>
            <h3>{{ p.name }}</h3>
            <p class="ym-partner__code">{{ p.code }} · ⭐ {{ p.rating }}</p>
          </div>
          <span :class="['ym-tag', p.integrated ? 'ym-tag--success' : 'ym-tag--neutral']">{{ p.integrated ? 'Đang kết nối' : 'Chưa kết nối' }}</span>
        </div>
        <p class="ym-partner__desc">{{ p.description }}</p>
        <dl class="ym-partner__stats">
          <div><dt>Đơn / tháng</dt><dd>{{ p.deliveriesPerMonth.toLocaleString('vi-VN') }}</dd></div>
          <div><dt>Phí trung bình</dt><dd>{{ formatPrice(p.avgFee) }}</dd></div>
          <div><dt>Hotline</dt><dd>{{ p.supportPhone }}</dd></div>
        </dl>
        <div class="ym-partner__actions">
          <button v-if="p.integrated" type="button" class="ym-btn" @click="openConfig(p)"><i class="ri-settings-3-line"></i> Cấu hình</button>
          <button v-if="p.integrated" type="button" class="ym-btn ym-btn--danger" @click="disconnect(p)"><i class="ri-link-unlink"></i> Ngắt</button>
          <button v-else type="button" class="ym-btn ym-btn--primary" @click="openConfig(p)"><i class="ri-link"></i> Kết nối</button>
        </div>
      </article>
    </div>

    <AdminModal v-if="target" v-model:open="configOpen" :title="`Cấu hình ${target.name}`" size="md" confirm-text="Lưu" @confirm="saveConfig">
      <div class="ym-form-group"><label>API Key</label><input v-model="cfg.apiKey" type="text" placeholder="Vd: key_abc123..." /></div>
      <div class="ym-form-group"><label>Shop ID</label><input v-model="cfg.shopId" type="text" placeholder="Mã shop trên hệ thống đối tác" /></div>
      <div class="ym-form-group"><label>Access Token</label><input v-model="cfg.token" type="password" /></div>
      <p class="ym-form-help">Liên hệ {{ target.supportPhone }} để lấy thông tin tích hợp.</p>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-partners { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
.ym-partner { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
.ym-partner__head { display: flex; align-items: center; gap: 12px; }
.ym-partner__logo { width: 44px; height: 44px; border-radius: 10px; background: #f3f6f4; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; }
.ym-partner__head h3 { margin: 0; font-size: 15px; color: #111827; }
.ym-partner__code { margin: 2px 0 0; font-size: 12px; color: #6b7280; }
.ym-partner__head .ym-tag { margin-left: auto; }
.ym-partner__desc { margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5; }
.ym-partner__stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 4px 0 0; padding: 10px; background: #fafbfc; border-radius: 8px; }
.ym-partner__stats div { display: flex; flex-direction: column; gap: 2px; }
.ym-partner__stats dt { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; }
.ym-partner__stats dd { margin: 0; font-size: 13px; font-weight: 600; color: #111827; }
.ym-partner__actions { display: flex; gap: 6px; margin-top: auto; }
.ym-partner__actions .ym-btn { flex: 1; justify-content: center; }
</style>
