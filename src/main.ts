import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import pinia from './stores'

// Plugins
import { setupI18n } from './plugins/i18n'
import globalComponents from './plugins/components'

import './assets/main.css'

const app = createApp(App)

// 1. Setup Store
app.use(pinia)

// 2. Setup Router
app.use(router)

// 3. Setup I18n (Localization)
app.use(setupI18n())

// 4. Register Global Components (Common UI)
app.use(globalComponents)

// Mount app
app.mount('#app')
