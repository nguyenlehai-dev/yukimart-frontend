<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>YukiMart ERP</h2>
      </div>
      <nav class="sidebar-nav">
        <!-- Add your admin navigation links here -->
        <RouterLink to="/" class="nav-item">Dashboard</RouterLink>
        <RouterLink to="/products" class="nav-item">Products</RouterLink>
        <RouterLink to="/orders" class="nav-item">Orders</RouterLink>
        <RouterLink to="/users" class="nav-item">Users</RouterLink>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <div class="main-wrapper">
      <!-- Header -->
      <header class="top-header">
        <div class="header-left">
          <button class="menu-toggle">☰</button>
        </div>
        <div class="header-right">
          <div class="user-profile">
            <span>Admin User</span>
            <img src="/images/avatar-placeholder.png" alt="Avatar" class="avatar" />
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Add your admin layout CSS here */
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-bg);
}
.sidebar {
  width: 250px;
  background-color: var(--color-bg-card);
  border-right: 1px solid var(--color-border);
}
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.top-header {
  height: 60px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}
.page-content {
  padding: 1.5rem;
  flex: 1;
}
.nav-item {
  display: block;
  padding: 1rem 1.5rem;
  color: var(--color-text-muted);
}
.nav-item:hover, .nav-item.router-link-active {
  background-color: var(--color-bg-hover);
  color: var(--color-primary);
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-left: 0.5rem;
}
</style>
