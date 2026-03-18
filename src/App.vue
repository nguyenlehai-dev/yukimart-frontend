<script setup lang="ts">
// You can make this dynamic if you use route meta tags to switch layouts:
// const layout = computed(() => route.meta.layout || 'DefaultLayout')
// <component :is="layout" />

import DefaultLayout from './layouts/DefaultLayout.vue'
</script>

<template>
  <DefaultLayout />
</template>
