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
    <div class="ym-acc-subtabs">
      <button 
        class="ym-acc-subtab" 
        :class="{ 'ym-acc-subtab--active': activeSubTab === 'thong_tin' }"
        @click="activeSubTab = 'thong_tin'"
      >
        Thông tin chung
      </button>
      <button 
        class="ym-acc-subtab" 
        :class="{ 'ym-acc-subtab--active': activeSubTab === 'lich_su' }"
        @click="activeSubTab = 'lich_su'"
      >
        Lịch sử cập nhật
      </button>
    </div>

    <!-- Thông Báo Chung -->
    <div class="mt-2">
      <div v-if="passwordSuccess" class="ym-alert ym-alert--success mb-3">
        <i class="ri-checkbox-circle-fill"></i> {{ passwordSuccess }}
      </div>
      <div v-if="passwordError" class="ym-alert ym-alert--danger mb-3">
        <i class="ri-error-warning-fill"></i> {{ passwordError }}
      </div>
    </div>

    <!-- TAB 1: THÔNG TIN CHUNG -->
    <div v-if="activeSubTab === 'thong_tin'" class="ym-acc-subpane">

      <!-- Avatar Upload Section -->
      <div class="ym-acc-avatar-upload mb-3">
        <div class="ym-acc-avatar-preview">
          <img v-if="previewAvatar" :src="previewAvatar" alt="Avatar" />
          <span v-else>{{ userInitial }}</span>
          <label for="avatar-input" class="ym-acc-avatar-edit-btn">
            <i class="ri-camera-fill"></i>
          </label>
          <input type="file" id="avatar-input" accept="image/jpeg, image/png, image/jpg" hidden @change="handleAvatarChange" />
        </div>
        <div class="ym-acc-avatar-text">
          <h4>Ảnh đại diện</h4>
          <p>Hỗ trợ định dạng JPG, JPEG, PNG. Dung lượng tối đa 2MB.</p>
          <div class="d-flex gap-2">
            <label for="avatar-input" class="ym-btn ym-btn--outline ym-btn--sm">Tải ảnh lên</label>
            <button v-if="isAvatarChanged" type="button" class="ym-btn ym-btn--primary ym-btn--sm" @click="saveAvatar">Lưu thay đổi</button>
          </div>
        </div>
      </div>

      <form @submit.prevent="saveAll" class="ym-acc-profile-form">
        <!-- Thông tin hồ sơ -->
        <div class="ym-acc-form-section">
          <h4 class="ym-acc-form-title">Thông tin hồ sơ</h4>
          <div class="ym-acc-grid ym-acc-grid--3">
            <div class="ym-form-group">
              <label class="ym-form-label">Loại tài khoản</label>
              <select v-model="profileForm.loaiTaiKhoan" class="ym-input">
                <option>Cá nhân</option>
                <option>Doanh nghiệp</option>
              </select>
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label">Ngày sinh</label>
              <input type="date" v-model="profileForm.ngaySinh" class="ym-input" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label">Người đại diện</label>
              <input type="text" v-model="profileForm.nguoiDaiDien" class="ym-input" />
            </div>
            
            <div class="ym-form-group">
              <label class="ym-form-label">CCCD/Hộ chiếu</label>
              <input type="text" v-model="profileForm.cccd" class="ym-input" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label">Điện thoại</label>
              <input type="text" v-model="profileForm.dienThoai" class="ym-input" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label">Email</label>
              <input type="email" v-model="profileForm.email" class="ym-input" disabled />
            </div>

            <div class="ym-form-group">
              <label class="ym-form-label">Ngày cấp</label>
              <input type="date" v-model="profileForm.ngayCap" class="ym-input" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label">Giới tính</label>
              <select v-model="profileForm.gioiTinh" class="ym-input">
                <option>Nam</option>
                <option>Nữ</option>
                <option>Khác</option>
              </select>
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label">Nơi cấp</label>
              <input type="text" v-model="profileForm.noiCap" class="ym-input" />
            </div>
          </div>
            
          <div class="ym-form-group mt-2">
            <label class="ym-form-label">Địa chỉ</label>
            <input type="text" v-model="profileForm.diaChi" class="ym-input" />
          </div>
        </div>

        <hr class="ym-acc-divider my-3" />

        <!-- Thông tin gian hàng -->
        <div class="ym-acc-form-section">
          <h4 class="ym-acc-form-title">Thông tin gian hàng</h4>
          <div class="ym-acc-grid ym-acc-grid--4">
            <div class="ym-form-group">
              <label class="ym-form-label">Tên gian hàng</label>
              <input type="text" v-model="profileForm.tenGianHang" class="ym-input" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label">Ngày hết hạn</label>
              <input type="date" v-model="profileForm.ngayHetHan" class="ym-input" disabled />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label">Ngành hàng</label>
              <input type="text" v-model="profileForm.nganhHang" class="ym-input" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label">Gói dịch vụ</label>
              <input type="text" v-model="profileForm.goiDichVu" class="ym-input" disabled />
            </div>

            <div class="ym-form-group">
              <label class="ym-form-label">Số chi nhánh</label>
              <input type="number" v-model="profileForm.chiNhanh" class="ym-input" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label">Số nhân viên</label>
              <input type="number" v-model="profileForm.nhanVien" class="ym-input" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label">Số lượng kho</label>
              <input type="number" v-model="profileForm.kho" class="ym-input" />
            </div>
            <div class="ym-form-group">
              <label class="ym-form-label">Tình trạng</label>
              <input type="text" v-model="profileForm.tinhTrang" class="ym-input" disabled />
            </div>
          </div>
        </div>

        <!-- Security Card (Password) -->
        <div class="ym-acc-security-card mt-3 mb-4">
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
                <label class="ym-form-label">Mật khẩu hiện tại</label>
                <div class="ym-input-wrap">
                  <i class="ri-lock-2-line ym-input-icon"></i>
                  <input type="password" class="ym-input" v-model="oldPassword" placeholder="Nhập mật khẩu cũ của bạn" :required="isEditingPassword" />
                </div>
              </div>
              
              <div class="row gx-4">
                <div class="col-md-6 mb-4">
                  <label class="ym-form-label">Mật khẩu mới</label>
                  <div class="ym-input-wrap">
                    <i class="ri-lock-password-line ym-input-icon"></i>
                    <input type="password" class="ym-input" v-model="newPassword" placeholder="Tối thiểu 6 ký tự" :required="isEditingPassword" />
                  </div>
                </div>
                <div class="col-md-6 mb-4">
                  <label class="ym-form-label">Xác nhận mật khẩu</label>
                  <div class="ym-input-wrap">
                    <i class="ri-key-2-line ym-input-icon"></i>
                    <input type="password" class="ym-input" v-model="confirmPassword" placeholder="Nhập lại mật khẩu mới" :required="isEditingPassword" />
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end">
                <button type="button" class="ym-btn ym-btn--light ym-btn--sm" @click="isEditingPassword = false">Hủy đổi mật khẩu</button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Global Form Actions -->
        <div class="ym-acc-form-actions d-flex justify-content-end gap-3 pb-3">
          <button type="button" class="ym-btn ym-btn--outline">Bảo lưu gian hàng</button>
          <button type="submit" class="ym-btn ym-btn--primary" :disabled="isSavingAll">
            <i v-if="isSavingAll" class="ri-loader-4-line ri-spin"></i>
            <span v-else>Cập nhật</span>
          </button>
        </div>
      </form>
    </div>

    <!-- TAB 2: LỊCH SỬ CẬP NHẬT -->
    <div v-if="activeSubTab === 'lich_su'" class="ym-acc-subpane">
       <div class="ym-acc-history">
          <div v-for="item in updateHistory" :key="item.id" class="ym-acc-history__item">
             <div class="ym-acc-history__dot"></div>
             <div class="ym-acc-history__content">
                <div class="ym-acc-history__header">
                   <strong>{{ item.author }}</strong> đã thực hiện: <span class="ym-acc-history__highlight">{{ item.changes }}</span>
                </div>
                <div class="ym-acc-history__date">
                  <i class="ri-time-line"></i> {{ item.date }}
                </div>
             </div>
          </div>
       </div>
       <div v-if="updateHistory.length === 0" class="ym-empty text-center py-5">
          <i class="ri-history-line" style="font-size: 3rem; color: #ccc;"></i>
          <p class="mt-3 text-muted">Chưa có lịch sử cập nhật nào.</p>
       </div>
    </div>

  </div>
</template>
