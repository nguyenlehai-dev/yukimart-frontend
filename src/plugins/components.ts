import type { App } from 'vue'
import AppButton from '../components/common/AppButton.vue'
import AppInput from '../components/common/AppInput.vue'
import AppModal from '../components/ui/AppModal.vue'

/**
 * Plugin to register common shared components globally
 * so you don't have to import them in every single file.
 */
export default {
  install(app: App) {
    app.component('AppButton', AppButton)
    app.component('AppInput', AppInput)
    app.component('AppModal', AppModal)
  }
}
