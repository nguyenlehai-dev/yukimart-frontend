import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import pinia from './stores'

// Plugins
import { setupI18n } from './plugins/i18n'
import globalComponents from './plugins/components'
import { createBootstrap } from 'bootstrap-vue-next'

// Styles
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import 'remixicon/fonts/remixicon.css'
import './assets/scss/main.scss'

const app = createApp(App)

// 1. Setup Store
app.use(pinia)

// 2. Setup Router
app.use(router)

// 3. Setup I18n (Localization)
app.use(setupI18n())

// 4. Bootstrap Vue Next
app.use(createBootstrap())

// 5. Register Global Components (Common UI)
app.use(globalComponents)

// Mount app
app.mount('#app')
