<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const password = ref('')

const handleLogin = () => {
  console.log('Login attempt:', email.value)
  // Logic đăng nhập ở đây
}
</script>

<template>
  <div class="auth-wrapper" style="max-width: 400px; margin: 4rem auto;">
    <div class="card">
      <div class="card-body">
        <h2 style="text-align: center; margin-bottom: 2rem;">{{ $t('auth.login') }}</h2>
        
        <form @submit.prevent="handleLogin">
          <AppInput 
            v-model="email" 
            :label="$t('auth.email')" 
            type="email" 
            placeholder="admin@example.com" 
          />
          
          <AppInput 
            v-model="password" 
            :label="$t('auth.password')" 
            type="password" 
            placeholder="••••••••" 
          />
          
          <AppButton type="submit" variant="primary" style="width: 100%; margin-top: 1rem;">
            {{ $t('auth.login') }}
          </AppButton>
        </form>

      </div>
    </div>
  </div>
</template>
