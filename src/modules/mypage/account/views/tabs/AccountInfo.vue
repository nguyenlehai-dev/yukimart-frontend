<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../../../../../stores/auth'

const authStore = useAuthStore()

// ── User Data ──
const userInitial = computed(() => {
  const name = authStore.userName
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

const userRoleText = computed(() => {
  switch(authStore.userRole) {
    case 'admin': return 'Quản trị viên'
    case 'wholesale': return 'Thành viên sỉ (Premium)'
    default: return 'Khách hàng thân thiết'
  }
})

// ── Sub Tab Logic ──
const activeSubTab = ref<'thong_tin' | 'lich_su'>('thong_tin')

// ── Avatar Upload Logic ──
const previewAvatar = ref<string | null>(authStore.user?.avatar || null)
const isAvatarChanged = ref(false)
const selectedFile = ref<File | null>(null)

function handleAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Basic validation
  if (!file.type.startsWith('image/')) {
    alert('Vui lòng chọn file hình ảnh hợp lệ.')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    alert('Kích thước ảnh tối đa là 2MB.')
    return
  }

  selectedFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    if (e.target?.result && typeof e.target.result === 'string') {
      previewAvatar.value = e.target.result
      isAvatarChanged.value = true
    }
  }
  reader.readAsDataURL(file)
}

async function saveAvatar() {
  if (selectedFile.value) {
    const success = await authStore.updateAvatar(selectedFile.value)
    if (success) {
      isAvatarChanged.value = false
      selectedFile.value = null
      
      passwordSuccess.value = 'Cập nhật ảnh đại diện thành công!'
      setTimeout(() => { passwordSuccess.value = '' }, 3000)
    } else {
      passwordError.value = authStore.error || 'Cập nhật thất bại'
      setTimeout(() => { passwordError.value = '' }, 3000)
    }
  }
}

// ── Profile Form Mock Data ──
const profileForm = ref({
  loaiTaiKhoan: 'Cá nhân',
  ngaySinh: '1989-02-05',
  nguoiDaiDien: authStore.userName || 'Lê Văn Lăng',
  cccd: '030089007160',
  dienThoai: '0865790970',
  ngayCap: '2019-01-28',
  email: authStore.user?.email || 'tran271298@gmail.com',
  gioiTinh: 'Nam',
  noiCap: 'Cục Cảnh sát quản lý hành chính về trật tự xã hội',
  diaChi: '524, Lý Thường Kiệt, Phường Tân Sơn Nhất, Thành phố Hồ Chí Minh',
  
  tenGianHang: 'yukimart',
  ngayHetHan: '2026-07-04',
  nganhHang: 'Tạp hóa & Siêu thị',
  goiDichVu: 'Gói cao cấp',
  chiNhanh: 1,
  nhanVien: 50,
  kho: 0,
  tinhTrang: 'Đang sử dụng'
})

// ── History Mock Data ──
const updateHistory = ref([
  { id: 1, date: '20/03/2026 14:30', author: 'Admin YukiMart', changes: 'Cập nhật Địa chỉ' },
  { id: 2, date: '15/02/2026 09:15', author: 'Lê Văn Lăng', changes: 'Cập nhật Điện thoại, Ngày cấp CCCD' },
])

// ── Form State ──
const isSavingAll = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isEditingPassword = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

// ── Dirty state tracking ──
const initialFormSnapshot = JSON.stringify(profileForm.value)
const isDirty = computed(() => JSON.stringify(profileForm.value) !== initialFormSnapshot)

// Selected file name for accessible feedback
const selectedFileName = computed(() => selectedFile.value?.name || '')

async function saveAll() {
  isSavingAll.value = true
  passwordError.value = ''
  passwordSuccess.value = ''

  try {
    // Validate password if user opened the change password panel
    if (isEditingPassword.value) {
      if (!oldPassword.value) {
        passwordError.value = 'Vui lòng nhập mật khẩu hiện tại'
        isSavingAll.value = false
        return
      }
      if (!newPassword.value || newPassword.value.length < 6) {
        passwordError.value = 'Mật khẩu mới phải có ít nhất 6 ký tự'
        isSavingAll.value = false
        return
      }
      if (newPassword.value !== confirmPassword.value) {
        passwordError.value = 'Mật khẩu xác nhận không khớp'
        isSavingAll.value = false
        return
      }
    }

    // Mock API Call for saving everything
    setTimeout(() => {
      passwordSuccess.value = 'Cập nhật thông tin thành công!'
      
      let changesText = 'Cập nhật thông tin hồ sơ chung'
      if (isEditingPassword.value) {
        changesText += ' và Mật khẩu'
        // Reset password fields
        oldPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
        isEditingPassword.value = false
      }

      // Add log to history
      updateHistory.value.unshift({
        id: Date.now(),
        date: new Date().toLocaleString('vi-VN'),
        author: authStore.user?.name || 'User',
        changes: changesText
      })

      isSavingAll.value = false
      setTimeout(() => { passwordSuccess.value = '' }, 3000)
    }, 1000)

  } catch (err) {
    passwordError.value = 'Cập nhật thất bại'
    isSavingAll.value = false
  }
}
</script>

<template>
  <div class="ym-acc-info-tab">
    
    <!-- Header Subtabs -->
    <div class="ym-acc-subtabs" role="tablist" aria-label="Thông tin tài khoản">
      <button
        type="button"
        role="tab"
        id="acc-subtab-info"
        aria-controls="acc-subpanel-info"
        :aria-selected="activeSubTab === 'thong_tin'"
        :tabindex="activeSubTab === 'thong_tin' ? 0 : -1"
        class="ym-acc-subtab"
        :class="{ 'ym-acc-subtab--active': activeSubTab === 'thong_tin' }"
        @click="activeSubTab = 'thong_tin'"
      >
        Thông tin chung
      </button>
      <button
        type="button"
        role="tab"
        id="acc-subtab-history"
        aria-controls="acc-subpanel-history"
        :aria-selected="activeSubTab === 'lich_su'"
        :tabindex="activeSubTab === 'lich_su' ? 0 : -1"
        class="ym-acc-subtab"
        :class="{ 'ym-acc-subtab--active': activeSubTab === 'lich_su' }"
        @click="activeSubTab = 'lich_su'"
      >
        Lịch sử cập nhật
      </button>
    </div>

    <!-- Thông Báo Chung -->
    <div class="mt-2" aria-live="polite" aria-atomic="true">
      <div v-if="passwordSuccess" class="ym-alert ym-alert--success mb-3" role="status">
        <i class="ri-checkbox-circle-fill" aria-hidden="true"></i> {{ passwordSuccess }}
      </div>
      <div v-if="passwordError" class="ym-alert ym-alert--danger mb-3" role="alert">
        <i class="ri-error-warning-fill" aria-hidden="true"></i> {{ passwordError }}
      </div>
    </div>

    <!-- TAB 1: THÔNG TIN CHUNG -->
    <div
      v-if="activeSubTab === 'thong_tin'"
      id="acc-subpanel-info"
      role="tabpanel"
      aria-labelledby="acc-subtab-info"
      class="ym-acc-subpane"
    >

      <!-- Avatar Upload Section -->
      <div class="ym-acc-avatar-upload mb-3">
        <div class="ym-acc-avatar-preview">
          <img v-if="previewAvatar" :src="previewAvatar" alt="" />
          <span v-else aria-hidden="true">{{ userInitial }}</span>
          <label for="avatar-input" class="ym-acc-avatar-edit-btn" aria-label="Chọn ảnh đại diện">
            <i class="ri-camera-fill" aria-hidden="true"></i>
          </label>
          <input type="file" id="avatar-input" accept="image/jpeg, image/png, image/jpg" hidden @change="handleAvatarChange" />
        </div>
        <div class="ym-acc-avatar-text">
          <h4>Ảnh đại diện</h4>
          <p>Hỗ trợ định dạng JPG, JPEG, PNG. Dung lượng tối đa 2MB.</p>
          <p v-if="selectedFileName" class="ym-acc-avatar-text__filename" aria-live="polite">
            <i class="ri-file-line" aria-hidden="true"></i> {{ selectedFileName }}
          </p>
          <div class="d-flex gap-2 ym-acc-avatar-actions">
            <label for="avatar-input" class="ym-btn ym-btn--outline ym-btn--sm">
              <i class="ri-upload-line" aria-hidden="true"></i> Tải ảnh lên
            </label>
            <button v-if="isAvatarChanged" type="button" class="ym-btn ym-btn--primary ym-btn--sm" @click="saveAvatar">
              <i class="ri-check-line" aria-hidden="true"></i> Lưu thay đổi
            </button>
          </div>
        </div>
      </div>

      <form @submit.prevent="saveAll" class="ym-acc-profile-form" novalidate>
        <!-- Thông tin hồ sơ -->
        <section class="ym-acc-form-section ym-acc-form-card" aria-labelledby="ym-acc-section-profile">
          <header class="ym-acc-form-card__head">
            <i class="ri-user-line" aria-hidden="true"></i>
            <div>
              <h2 id="ym-acc-section-profile" class="ym-acc-form-title">Thông tin hồ sơ</h2>
              <p class="ym-acc-form-subtitle">Thông tin cá nhân của chủ tài khoản</p>
            </div>
          </header>
          <div class="ym-acc-grid ym-acc-grid--3">
            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-loai-tk">Loại tài khoản</label>
              <select id="acc-loai-tk" v-model="profileForm.loaiTaiKhoan" class="ym-input">
                <option>Cá nhân</option>
                <option>Doanh nghiệp</option>
              </select>
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-ngay-sinh">Ngày sinh</label>
              <input id="acc-ngay-sinh" type="date" v-model="profileForm.ngaySinh" class="ym-input" autocomplete="bday" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-nguoi-dd">Người đại diện <span class="ym-form-required" aria-hidden="true">*</span></label>
              <input id="acc-nguoi-dd" type="text" v-model="profileForm.nguoiDaiDien" class="ym-input" autocomplete="name" required />
            </div>

            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-cccd">CCCD/Hộ chiếu</label>
              <input id="acc-cccd" type="text" v-model="profileForm.cccd" class="ym-input" inputmode="numeric" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-dt">Điện thoại <span class="ym-form-required" aria-hidden="true">*</span></label>
              <input id="acc-dt" type="tel" v-model="profileForm.dienThoai" class="ym-input" autocomplete="tel" inputmode="tel" required />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-email">Email</label>
              <input id="acc-email" type="email" v-model="profileForm.email" class="ym-input" autocomplete="email" inputmode="email" disabled aria-describedby="acc-email-hint" />
              <small id="acc-email-hint" class="ym-form-hint">Email không thể thay đổi sau khi đăng ký</small>
            </div>

            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-ngay-cap">Ngày cấp</label>
              <input id="acc-ngay-cap" type="date" v-model="profileForm.ngayCap" class="ym-input" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-gioi-tinh">Giới tính</label>
              <select id="acc-gioi-tinh" v-model="profileForm.gioiTinh" class="ym-input">
                <option>Nam</option>
                <option>Nữ</option>
                <option>Khác</option>
              </select>
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-noi-cap">Nơi cấp</label>
              <input id="acc-noi-cap" type="text" v-model="profileForm.noiCap" class="ym-input" />
            </div>
          </div>

          <div class="ym-form-group ym-form-group--full mt-2">
            <label class="ym-form-label" for="acc-dia-chi">Địa chỉ</label>
            <input id="acc-dia-chi" type="text" v-model="profileForm.diaChi" class="ym-input" autocomplete="street-address" />
          </div>
        </section>

        <!-- Thông tin gian hàng -->
        <section class="ym-acc-form-section ym-acc-form-card" aria-labelledby="ym-acc-section-shop">
          <header class="ym-acc-form-card__head">
            <i class="ri-store-2-line" aria-hidden="true"></i>
            <div>
              <h2 id="ym-acc-section-shop" class="ym-acc-form-title">Thông tin gian hàng</h2>
              <p class="ym-acc-form-subtitle">Cấu hình gói dịch vụ và quy mô kinh doanh</p>
            </div>
          </header>
          <div class="ym-acc-grid ym-acc-grid--4">
            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-ten-gh">Tên gian hàng</label>
              <input id="acc-ten-gh" type="text" v-model="profileForm.tenGianHang" class="ym-input" autocomplete="organization" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-ngay-het-han">Ngày hết hạn</label>
              <input id="acc-ngay-het-han" type="date" v-model="profileForm.ngayHetHan" class="ym-input" disabled />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-nganh-hang">Ngành hàng</label>
              <input id="acc-nganh-hang" type="text" v-model="profileForm.nganhHang" class="ym-input" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-goi-dv">Gói dịch vụ</label>
              <input id="acc-goi-dv" type="text" v-model="profileForm.goiDichVu" class="ym-input" disabled />
            </div>

            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-chi-nhanh">Số chi nhánh</label>
              <input id="acc-chi-nhanh" type="number" min="0" inputmode="numeric" v-model="profileForm.chiNhanh" class="ym-input" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-nhan-vien">Số nhân viên</label>
              <input id="acc-nhan-vien" type="number" min="0" inputmode="numeric" v-model="profileForm.nhanVien" class="ym-input" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-kho">Số lượng kho</label>
              <input id="acc-kho" type="number" min="0" inputmode="numeric" v-model="profileForm.kho" class="ym-input" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label" for="acc-tinh-trang">Tình trạng</label>
              <input id="acc-tinh-trang" type="text" v-model="profileForm.tinhTrang" class="ym-input" disabled />
            </div>
          </div>
        </section>

        <!-- Security Card (Password) -->
        <section class="ym-acc-security-card mt-3 mb-4" aria-labelledby="ym-acc-section-security">
          <h2 id="ym-acc-section-security" class="visually-hidden">Bảo mật tài khoản</h2>
          <div class="ym-acc-security-card__main">
            <div class="ym-acc-security-card__icon"><i class="ri-shield-keyhole-line"></i></div>
            <div class="ym-acc-security-card__text">
              <h4 class="ym-acc-security-card__title">Đổi mật khẩu</h4>
              <p class="ym-acc-security-card__desc">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản của bạn khỏi rủi ro.</p>
            </div>
            <div class="ym-acc-security-card__action" v-if="!isEditingPassword">
              <button type="button" class="ym-btn ym-btn--outline" @click="isEditingPassword = true">Tiến hành đổi</button>
            </div>
          </div>

          <Transition name="fade-slide">
            <div class="ym-acc-security-card__form" v-if="isEditingPassword">
              <hr class="ym-acc-divider my-3" />
              
              <div class="ym-form-group mb-4">
                <label class="ym-form-label" for="acc-old-pwd">Mật khẩu hiện tại</label>
                <div class="ym-input-wrap">
                  <i class="ri-lock-2-line ym-input-icon" aria-hidden="true"></i>
                  <input id="acc-old-pwd" type="password" autocomplete="current-password" class="ym-input" v-model="oldPassword" placeholder="Nhập mật khẩu cũ của bạn" :required="isEditingPassword" />
                </div>
              </div>

              <div class="row gx-4">
                <div class="col-md-6 mb-4">
                  <label class="ym-form-label" for="acc-new-pwd">Mật khẩu mới</label>
                  <div class="ym-input-wrap">
                    <i class="ri-lock-password-line ym-input-icon" aria-hidden="true"></i>
                    <input id="acc-new-pwd" type="password" autocomplete="new-password" minlength="6" class="ym-input" v-model="newPassword" placeholder="Tối thiểu 6 ký tự" :required="isEditingPassword" />
                  </div>
                </div>
                <div class="col-md-6 mb-4">
                  <label class="ym-form-label" for="acc-confirm-pwd">Xác nhận mật khẩu</label>
                  <div class="ym-input-wrap">
                    <i class="ri-key-2-line ym-input-icon" aria-hidden="true"></i>
                    <input id="acc-confirm-pwd" type="password" autocomplete="new-password" minlength="6" class="ym-input" v-model="confirmPassword" placeholder="Nhập lại mật khẩu mới" :required="isEditingPassword" />
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end">
                <button type="button" class="ym-btn ym-btn--light ym-btn--sm" @click="isEditingPassword = false">Huỷ đổi mật khẩu</button>
              </div>
            </div>
          </Transition>
        </section>

        <!-- Sticky Form Actions Bar -->
        <div
          class="ym-acc-form-actions"
          :class="{ 'ym-acc-form-actions--dirty': isDirty || isEditingPassword }"
          role="region"
          aria-label="Lưu thay đổi"
        >
          <span class="ym-acc-form-actions__hint" v-if="isDirty || isEditingPassword">
            <i class="ri-information-line" aria-hidden="true"></i> Bạn có thay đổi chưa lưu
          </span>
          <button type="submit" class="ym-btn ym-btn--primary" :disabled="isSavingAll || (!isDirty && !isEditingPassword)" :aria-busy="isSavingAll || undefined">
            <span v-if="isSavingAll" class="ym-btn__spinner" aria-hidden="true"></span>
            <i v-else class="ri-save-line" aria-hidden="true"></i>
            <span>{{ isSavingAll ? 'Đang lưu...' : 'Lưu thay đổi' }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- TAB 2: LỊCH SỬ CẬP NHẬT -->
    <div
      v-if="activeSubTab === 'lich_su'"
      id="acc-subpanel-history"
      role="tabpanel"
      aria-labelledby="acc-subtab-history"
      class="ym-acc-subpane"
    >
       <ol class="ym-acc-history">
          <li v-for="item in updateHistory" :key="item.id" class="ym-acc-history__item">
             <div class="ym-acc-history__dot" aria-hidden="true"></div>
             <div class="ym-acc-history__content">
                <div class="ym-acc-history__header">
                   <strong>{{ item.author }}</strong> đã thực hiện: <span class="ym-acc-history__highlight">{{ item.changes }}</span>
                </div>
                <div class="ym-acc-history__date">
                  <i class="ri-time-line" aria-hidden="true"></i> {{ item.date }}
                </div>
             </div>
          </li>
       </ol>
       <div v-if="updateHistory.length === 0" class="ym-empty text-center py-5" role="status">
          <i class="ri-history-line ym-empty__icon" aria-hidden="true"></i>
          <p class="mt-3 text-muted">Chưa có lịch sử cập nhật nào.</p>
       </div>
    </div>

  </div>
</template>

<style scoped>
.ym-empty__icon {
  font-size: 3rem;
  color: #ccc;
}
.ym-acc-history {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* ── Form section card ── */
.ym-acc-form-card {
  background: #fff;
  border: 1px solid #eef0f2;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
  transition: box-shadow 200ms ease-out;
}
.ym-acc-form-card:focus-within {
  box-shadow: 0 0 0 3px rgba(50, 110, 81, 0.08);
  border-color: rgba(50, 110, 81, 0.3);
}

.ym-acc-form-card__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}
.ym-acc-form-card__head > i {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-light, #e8f0ec);
  color: var(--color-primary, #326e51);
  border-radius: 8px;
  font-size: 18px;
}

:deep(.ym-acc-form-title) {
  font-size: 16px !important;
  border-bottom: none !important;
  padding-bottom: 0 !important;
  margin-bottom: 2px !important;
}

.ym-acc-form-subtitle {
  font-size: 13px;
  color: var(--color-text-muted, #666);
  margin: 0;
  line-height: 1.4;
}

/* ── Required indicator ── */
.ym-form-required {
  color: var(--color-secondary, #d0021b);
  margin-left: 2px;
  font-weight: 500;
}

/* ── Form hint ── */
.ym-form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-muted, #666);
  line-height: 1.4;
}

/* ── Avatar upload polish ── */
:deep(.ym-acc-avatar-edit-btn) {
  width: 36px !important;
  height: 36px !important;
  font-size: 16px !important;
}
:deep(.ym-acc-avatar-edit-btn:focus-visible) {
  outline: 2px solid var(--color-primary, #326e51);
  outline-offset: 2px;
}

.ym-acc-avatar-text__filename {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px;
  padding: 4px 10px;
  background: var(--color-primary-light, #e8f0ec);
  color: var(--color-primary, #326e51);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  word-break: break-all;
}

.ym-acc-avatar-actions {
  flex-wrap: wrap;
}

/* ── Sticky form actions bar ── */
.ym-acc-form-actions {
  position: sticky;
  bottom: 0;
  margin: 24px -24px -24px;
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #eef0f2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  z-index: 10;
  transition: box-shadow 200ms ease-out, background 200ms ease-out;
}

.ym-acc-form-actions--dirty {
  background: #fffbeb;
  border-top-color: #fde68a;
  box-shadow: 0 -4px 16px rgba(245, 158, 11, 0.08);
}

.ym-acc-form-actions__hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #92400e;
  font-weight: 500;
  margin-right: auto;
}

.ym-acc-form-actions__hint i {
  font-size: 16px;
}

/* ── Submit spinner ── */
.ym-btn__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ym-acc-spin 0.7s linear infinite;
  opacity: 0.7;
}

@keyframes ym-acc-spin {
  to { transform: rotate(360deg); }
}

/* ── Mobile responsive ── */
@media (max-width: 575px) {
  .ym-acc-form-card {
    padding: 16px;
  }
  .ym-acc-form-actions {
    flex-wrap: wrap;
    margin: 16px -16px -16px;
    padding: 12px 16px;
  }
  .ym-acc-form-actions__hint {
    flex: 1 0 100%;
    margin-right: 0;
    margin-bottom: 4px;
  }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .ym-acc-form-card,
  .ym-acc-form-actions {
    transition: none;
  }
  .ym-btn__spinner {
    animation-duration: 1.5s;
  }
}
</style>
