<script setup lang="ts">
import { ref, reactive } from 'vue'
import AdminModal from '../components/AdminModal.vue'
import { useToast } from '../composables/useToast'

const toast = useToast()

const tabs = [
  { key: 'general', label: 'Chung', icon: 'ri-settings-3-line' },
  { key: 'payment', label: 'Thanh toán', icon: 'ri-bank-card-line' },
  { key: 'shipping', label: 'Vận chuyển', icon: 'ri-truck-line' },
  { key: 'email', label: 'Email', icon: 'ri-mail-line' },
  { key: 'security', label: 'Bảo mật', icon: 'ri-shield-keyhole-line' },
  { key: 'integrations', label: 'Tích hợp', icon: 'ri-plug-line' },
] as const
type TabKey = typeof tabs[number]['key']
const activeTab = ref<TabKey>('general')

const dirty = ref(false)
function markDirty() { dirty.value = true }

const general = reactive({
  siteName: 'YukiMart',
  email: 'support@yukimart.vn',
  phone: '093 372 8888',
  address: '123 Nguyễn Trãi, Quận 1, TP.HCM',
  currency: 'VND',
  timezone: 'Asia/Ho_Chi_Minh',
  language: 'vi',
  maintenance: false,
})
const generalDefault = JSON.parse(JSON.stringify(general))

const payments = ref([
  { key: 'cod', name: 'Thanh toán khi nhận hàng (COD)', enabled: true, fee: 0 },
  { key: 'bank', name: 'Chuyển khoản ngân hàng', enabled: true, fee: 0 },
  { key: 'momo', name: 'Ví MoMo', enabled: true, fee: 1.5 },
  { key: 'vnpay', name: 'VNPay', enabled: false, fee: 1.8 },
  { key: 'card', name: 'Thẻ tín dụng/ghi nợ', enabled: true, fee: 2.5 },
  { key: 'zalopay', name: 'ZaloPay', enabled: false, fee: 1.5 },
])

const shipping = ref([
  { id: 1, name: 'Giao hàng nhanh nội thành', area: 'TP.HCM, Hà Nội', fee: 25000, time: '1-2 giờ', enabled: true },
  { id: 2, name: 'Giao tiêu chuẩn', area: 'Toàn quốc', fee: 35000, time: '2-4 ngày', enabled: true },
  { id: 3, name: 'Giao tiết kiệm', area: 'Toàn quốc', fee: 18000, time: '4-7 ngày', enabled: true },
  { id: 4, name: 'Giao hàng quốc tế', area: 'Đông Nam Á', fee: 250000, time: '7-14 ngày', enabled: false },
])

const email = reactive({
  host: 'smtp.gmail.com', port: 587, username: 'noreply@yukimart.vn',
  password: '', encryption: 'TLS', fromName: 'YukiMart Store',
})

const security = reactive({
  twoFactor: true, lockSuspicious: true, recaptcha: true, accessLog: true,
  sessionMinutes: 60, maxAttempts: 5,
})

const integrations = ref([
  { name: 'Google Analytics', desc: 'Theo dõi traffic và hành vi người dùng', icon: '📊', connected: true, color: '#fbbc04' },
  { name: 'Meta Pixel', desc: 'Quảng cáo Facebook & Instagram', icon: '📘', connected: true, color: '#1877f2' },
  { name: 'Mailchimp', desc: 'Email marketing tự động', icon: '🐵', connected: false, color: '#ffe01b' },
  { name: 'Zalo OA', desc: 'Thông báo đơn hàng qua Zalo', icon: '💬', connected: true, color: '#0068ff' },
  { name: 'GHN Express', desc: 'Đối tác giao hàng', icon: '🚚', connected: true, color: '#ff6900' },
  { name: 'Hotjar', desc: 'Heatmap & session recording', icon: '🔥', connected: false, color: '#fd3a5c' },
])

// Payment config modal
const paymentOpen = ref(false)
const paymentTarget = ref<typeof payments.value[number] | null>(null)
const paymentForm = ref({ apiKey: '', secret: '', endpoint: '' })
function openPayment(p: typeof payments.value[number]) {
  paymentTarget.value = p
  paymentForm.value = { apiKey: '', secret: '', endpoint: '' }
  paymentOpen.value = true
}
function savePaymentConfig() {
  if (!paymentTarget.value) return
  toast.success('Đã lưu cấu hình', paymentTarget.value.name)
  paymentOpen.value = false
}

// Shipping modal
const shippingOpen = ref(false)
const shippingForm = ref<{ id: number | null; name: string; area: string; fee: number; time: string; enabled: boolean }>({ id: null, name: '', area: '', fee: 0, time: '', enabled: true })
function openNewShipping() {
  shippingForm.value = { id: null, name: '', area: '', fee: 0, time: '', enabled: true }
  shippingOpen.value = true
}
function openEditShipping(s: typeof shipping.value[number]) {
  shippingForm.value = { ...s }
  shippingOpen.value = true
}
function saveShipping() {
  if (!shippingForm.value.name) {
    toast.error('Thiếu tên phương thức')
    return
  }
  if (shippingForm.value.id) {
    const idx = shipping.value.findIndex((s) => s.id === shippingForm.value.id)
    if (idx >= 0) shipping.value[idx] = { ...shipping.value[idx], ...shippingForm.value, id: shippingForm.value.id }
    toast.success('Đã cập nhật vận chuyển', shippingForm.value.name)
  } else {
    const id = Math.max(0, ...shipping.value.map((s) => s.id)) + 1
    shipping.value.push({ ...shippingForm.value, id })
    toast.success('Đã thêm vận chuyển', shippingForm.value.name)
  }
  shippingOpen.value = false
}
function deleteShipping(id: number) {
  shipping.value = shipping.value.filter((s) => s.id !== id)
  toast.success('Đã xoá')
}

// Integration toggle
function toggleIntegration(i: typeof integrations.value[number]) {
  i.connected = !i.connected
  toast.success(i.connected ? 'Đã kết nối' : 'Đã ngắt kết nối', i.name)
}

// Email test
function sendTestEmail() {
  if (!email.host || !email.username) {
    toast.error('Cấu hình chưa đầy đủ')
    return
  }
  toast.info('Đã gửi email thử nghiệm', `Đến ${email.username}`)
}

// Save / restore
function saveAll() {
  dirty.value = false
  toast.success('Đã lưu cài đặt', 'Tất cả thay đổi đã được áp dụng.')
}

function restoreAll() {
  Object.assign(general, generalDefault)
  dirty.value = false
  toast.info('Đã khôi phục', 'Cài đặt được đặt về mặc định.')
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Cài đặt</h1>
        <p>Cấu hình chung của hệ thống và các tích hợp bên thứ ba</p>
      </div>
      <div class="ym-page__actions">
        <span v-if="dirty" class="ym-dirty-flag"><i class="ri-error-warning-line"></i> Có thay đổi chưa lưu</span>
        <button type="button" class="ym-btn" @click="restoreAll">Khôi phục</button>
        <button type="button" class="ym-btn ym-btn--primary" @click="saveAll"><i class="ri-save-line"></i> Lưu thay đổi</button>
      </div>
    </header>

    <div class="ym-settings-layout">
      <nav class="ym-settings-tabs">
        <button v-for="tab in tabs" :key="tab.key" type="button" :class="['ym-settings-tabs__item', { 'is-active': activeTab === tab.key }]" @click="activeTab = tab.key">
          <i :class="tab.icon"></i><span>{{ tab.label }}</span>
        </button>
      </nav>

      <div class="ym-settings-panel">
        <!-- General -->
        <section v-if="activeTab === 'general'" class="ym-card">
          <div class="ym-card__header"><h2>Thông tin chung</h2></div>
          <div class="ym-card__body">
            <div class="ym-form-row">
              <div class="ym-form-group"><label>Tên cửa hàng</label><input v-model="general.siteName" type="text" @input="markDirty" /></div>
              <div class="ym-form-group"><label>Email liên hệ</label><input v-model="general.email" type="email" @input="markDirty" /></div>
            </div>
            <div class="ym-form-row">
              <div class="ym-form-group"><label>Hotline</label><input v-model="general.phone" type="tel" @input="markDirty" /></div>
              <div class="ym-form-group">
                <label>Tiền tệ</label>
                <select v-model="general.currency" @change="markDirty">
                  <option value="VND">VND - Việt Nam Đồng</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </div>
            </div>
            <div class="ym-form-group"><label>Địa chỉ</label><input v-model="general.address" type="text" @input="markDirty" /></div>
            <div class="ym-form-row">
              <div class="ym-form-group">
                <label>Múi giờ</label>
                <select v-model="general.timezone" @change="markDirty">
                  <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                  <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                </select>
              </div>
              <div class="ym-form-group">
                <label>Ngôn ngữ mặc định</label>
                <select v-model="general.language" @change="markDirty">
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div class="ym-toggle-row">
              <div>
                <strong>Chế độ bảo trì</strong>
                <p>Tạm thời chặn truy cập website từ phía khách hàng.</p>
              </div>
              <label class="ym-switch"><input v-model="general.maintenance" type="checkbox" @change="markDirty" /><span class="ym-switch__slider"></span></label>
            </div>
          </div>
        </section>

        <!-- Payment -->
        <section v-if="activeTab === 'payment'" class="ym-card">
          <div class="ym-card__header"><h2>Phương thức thanh toán</h2></div>
          <ul class="ym-list">
            <li v-for="p in payments" :key="p.key" class="ym-list__item">
              <div class="ym-list__main">
                <strong>{{ p.name }}</strong>
                <small>Phí giao dịch: {{ p.fee === 0 ? 'Miễn phí' : `${p.fee}%` }}</small>
              </div>
              <span :class="['ym-tag', p.enabled ? 'ym-tag--success' : 'ym-tag--neutral']">{{ p.enabled ? 'Đang bật' : 'Đã tắt' }}</span>
              <button type="button" class="ym-btn ym-btn--sm" @click="openPayment(p)">Cấu hình</button>
              <label class="ym-switch"><input v-model="p.enabled" type="checkbox" @change="markDirty" /><span class="ym-switch__slider"></span></label>
            </li>
          </ul>
        </section>

        <!-- Shipping -->
        <section v-if="activeTab === 'shipping'" class="ym-card">
          <div class="ym-card__header">
            <h2>Phương thức vận chuyển</h2>
            <button type="button" class="ym-btn ym-btn--sm ym-btn--primary" @click="openNewShipping"><i class="ri-add-line"></i> Thêm</button>
          </div>
          <div class="ym-table-wrap">
            <table class="ym-table">
              <thead>
                <tr>
                  <th>Tên</th><th>Khu vực</th><th class="is-right">Phí</th><th>Thời gian</th><th>Bật/Tắt</th><th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in shipping" :key="s.id">
                  <td><strong>{{ s.name }}</strong></td>
                  <td>{{ s.area }}</td>
                  <td class="is-right">{{ new Intl.NumberFormat('vi-VN').format(s.fee) }} ₫</td>
                  <td class="is-muted">{{ s.time }}</td>
                  <td><label class="ym-switch"><input v-model="s.enabled" type="checkbox" @change="markDirty" /><span class="ym-switch__slider"></span></label></td>
                  <td class="is-right">
                    <button type="button" class="ym-icon-btn" @click="openEditShipping(s)"><i class="ri-edit-line"></i></button>
                    <button type="button" class="ym-icon-btn" @click="deleteShipping(s.id)"><i class="ri-delete-bin-line"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Email -->
        <section v-if="activeTab === 'email'" class="ym-card">
          <div class="ym-card__header"><h2>Cấu hình email (SMTP)</h2></div>
          <div class="ym-card__body">
            <div class="ym-form-row">
              <div class="ym-form-group"><label>SMTP Host</label><input v-model="email.host" type="text" @input="markDirty" /></div>
              <div class="ym-form-group"><label>SMTP Port</label><input v-model.number="email.port" type="number" @input="markDirty" /></div>
            </div>
            <div class="ym-form-row">
              <div class="ym-form-group"><label>Username</label><input v-model="email.username" type="text" @input="markDirty" /></div>
              <div class="ym-form-group"><label>Password</label><input v-model="email.password" type="password" placeholder="••••••••" @input="markDirty" /></div>
            </div>
            <div class="ym-form-row">
              <div class="ym-form-group">
                <label>Mã hoá</label>
                <select v-model="email.encryption" @change="markDirty"><option>TLS</option><option>SSL</option><option>None</option></select>
              </div>
              <div class="ym-form-group"><label>Tên hiển thị</label><input v-model="email.fromName" type="text" @input="markDirty" /></div>
            </div>
            <button type="button" class="ym-btn" @click="sendTestEmail"><i class="ri-mail-send-line"></i> Gửi email thử nghiệm</button>
          </div>
        </section>

        <!-- Security -->
        <section v-if="activeTab === 'security'" class="ym-card">
          <div class="ym-card__header"><h2>Bảo mật</h2></div>
          <div class="ym-card__body">
            <div class="ym-toggle-row">
              <div><strong>Xác thực hai yếu tố (2FA)</strong><p>Yêu cầu mã OTP khi đăng nhập tài khoản admin.</p></div>
              <label class="ym-switch"><input v-model="security.twoFactor" type="checkbox" @change="markDirty" /><span class="ym-switch__slider"></span></label>
            </div>
            <div class="ym-toggle-row">
              <div><strong>Khoá IP đáng ngờ</strong><p>Tự động khoá IP sau {{ security.maxAttempts }} lần đăng nhập sai.</p></div>
              <label class="ym-switch"><input v-model="security.lockSuspicious" type="checkbox" @change="markDirty" /><span class="ym-switch__slider"></span></label>
            </div>
            <div class="ym-toggle-row">
              <div><strong>reCAPTCHA</strong><p>Bật reCAPTCHA cho form đăng nhập và đăng ký.</p></div>
              <label class="ym-switch"><input v-model="security.recaptcha" type="checkbox" @change="markDirty" /><span class="ym-switch__slider"></span></label>
            </div>
            <div class="ym-toggle-row">
              <div><strong>Ghi log truy cập</strong><p>Lưu lịch sử đăng nhập và thao tác của admin.</p></div>
              <label class="ym-switch"><input v-model="security.accessLog" type="checkbox" @change="markDirty" /><span class="ym-switch__slider"></span></label>
            </div>
            <div class="ym-form-row" style="margin-top: 14px">
              <div class="ym-form-group"><label>Thời gian session (phút)</label><input v-model.number="security.sessionMinutes" type="number" @input="markDirty" /></div>
              <div class="ym-form-group"><label>Số lần sai tối đa</label><input v-model.number="security.maxAttempts" type="number" @input="markDirty" /></div>
            </div>
          </div>
        </section>

        <!-- Integrations -->
        <section v-if="activeTab === 'integrations'" class="ym-card">
          <div class="ym-card__header"><h2>Tích hợp bên thứ ba</h2></div>
          <div class="ym-integrations">
            <article v-for="it in integrations" :key="it.name" class="ym-integration">
              <div class="ym-integration__icon" :style="{ background: it.color + '22', color: it.color }">
                <span>{{ it.icon }}</span>
              </div>
              <div class="ym-integration__body">
                <strong>{{ it.name }}</strong>
                <p>{{ it.desc }}</p>
              </div>
              <button type="button" :class="['ym-btn', 'ym-btn--sm', it.connected ? '' : 'ym-btn--primary']" @click="toggleIntegration(it)">
                {{ it.connected ? 'Ngắt' : 'Kết nối' }}
              </button>
            </article>
          </div>
        </section>
      </div>
    </div>

    <!-- Payment config modal -->
    <AdminModal v-if="paymentTarget" v-model:open="paymentOpen" :title="`Cấu hình ${paymentTarget.name}`" size="md" confirm-text="Lưu" @confirm="savePaymentConfig">
      <div class="ym-form-group"><label>API Key / Merchant ID</label><input v-model="paymentForm.apiKey" type="text" /></div>
      <div class="ym-form-group"><label>Secret Key</label><input v-model="paymentForm.secret" type="password" /></div>
      <div class="ym-form-group"><label>Endpoint URL</label><input v-model="paymentForm.endpoint" type="url" placeholder="https://..." /></div>
      <div class="ym-form-group"><label>Phí giao dịch (%)</label><input v-model.number="paymentTarget.fee" type="number" step="0.1" /></div>
    </AdminModal>

    <!-- Shipping modal -->
    <AdminModal v-model:open="shippingOpen" :title="shippingForm.id ? 'Sửa phương thức vận chuyển' : 'Thêm phương thức vận chuyển'" size="md" confirm-text="Lưu" @confirm="saveShipping">
      <div class="ym-form-group"><label>Tên phương thức *</label><input v-model="shippingForm.name" type="text" /></div>
      <div class="ym-form-group"><label>Khu vực áp dụng</label><input v-model="shippingForm.area" type="text" placeholder="Vd: Toàn quốc, TP.HCM..." /></div>
      <div class="ym-form-row">
        <div class="ym-form-group"><label>Phí (₫)</label><input v-model.number="shippingForm.fee" type="number" min="0" /></div>
        <div class="ym-form-group"><label>Thời gian giao</label><input v-model="shippingForm.time" type="text" placeholder="Vd: 2-4 ngày" /></div>
      </div>
      <label class="ym-checkbox"><input v-model="shippingForm.enabled" type="checkbox" /> Đang kích hoạt</label>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-settings-layout { display: grid; grid-template-columns: 220px 1fr; gap: 16px; }
@media (max-width: 1024px) { .ym-settings-layout { grid-template-columns: 1fr; } }

.ym-settings-tabs { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 6px; display: flex; flex-direction: column; gap: 2px; align-self: flex-start; position: sticky; top: 76px; }
@media (max-width: 1024px) { .ym-settings-tabs { flex-direction: row; overflow-x: auto; position: static; } }
.ym-settings-tabs__item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: none; background: transparent; color: #4b5563; font-size: 14px; font-weight: 500; border-radius: 8px; cursor: pointer; white-space: nowrap; text-align: left; }
.ym-settings-tabs__item:hover { background: #f3f4f6; color: #1f2937; }
.ym-settings-tabs__item.is-active { background: #e8f0ec; color: #326e51; }
.ym-settings-tabs__item i { font-size: 16px; }

.ym-toggle-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 14px 0; border-top: 1px solid #f1f3f5; }
.ym-toggle-row:first-of-type { border-top: none; padding-top: 4px; }
.ym-toggle-row strong { display: block; color: #111827; font-size: 14px; }
.ym-toggle-row p { margin: 2px 0 0; font-size: 13px; color: #6b7280; }

.ym-list { list-style: none; margin: 0; padding: 0; }
.ym-list__item { display: flex; align-items: center; gap: 14px; padding: 14px 20px; border-bottom: 1px solid #f1f3f5; }
.ym-list__item:last-child { border-bottom: none; }
.ym-list__main { flex: 1; }
.ym-list__main strong { display: block; color: #111827; }
.ym-list__main small { color: #6b7280; font-size: 12px; }

.ym-integrations { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; padding: 16px 20px 20px; }
.ym-integration { display: flex; gap: 12px; align-items: center; padding: 14px; background: #fafbfc; border: 1px solid #e5e7eb; border-radius: 10px; }
.ym-integration__icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.ym-integration__body { flex: 1; min-width: 0; }
.ym-integration__body strong { display: block; color: #111827; font-size: 14px; }
.ym-integration__body p { margin: 2px 0 0; font-size: 12px; color: #6b7280; }

.ym-checkbox { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #374151; cursor: pointer; }

.ym-dirty-flag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  color: #92400e;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}
</style>
