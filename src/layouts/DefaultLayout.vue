<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
</script>

<template>
  <div class="default-layout">
    <!-- Header -->
    <header class="header">
      <div class="container header-inner">
        <RouterLink to="/" class="logo">
          <span class="logo-icon">🛒</span>
          <span class="logo-text">YukiMart</span>
        </RouterLink>
        <nav class="nav">
          <RouterLink to="/" class="nav-link">{{ $t('menu.home') }}</RouterLink>
          <RouterLink to="/products" class="nav-link">{{ $t('menu.products') }}</RouterLink>
          <RouterLink to="/about" class="nav-link">{{ $t('menu.about') }}</RouterLink>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main">
      <RouterView />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <p>&copy; 2026 YukiMart. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>
