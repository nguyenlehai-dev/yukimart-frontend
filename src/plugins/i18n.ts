import { createI18n } from 'vue-i18n'
import globalVi from '../lang/vi'
import globalEn from '../lang/en'

// Define the shape of our message module
type MessageModule = { default: Record<string, any> }

/**
 * Dynamically load all translation files from modules
 */
const loadModuleLocales = () => {
  const messages: Record<string, any> = {
    vi: { ...globalVi },
    en: { ...globalEn },
  }

  // Eagerly load all lang/*.ts files across all nested modules
  const locales = import.meta.glob<MessageModule>('../modules/**/lang/*.ts', { eager: true })

  for (const path in locales) {
    // path example: '../modules/mypage/home/lang/vi.ts'
    const matched = path.match(/\/modules\/(?:.*\/)?([^\/]+)\/lang\/([a-z0-9-_]+)\.ts$/i)
    if (matched && matched.length > 2) {
      const moduleName = matched[1] // e.g., 'home', 'products'
      const locale = matched[2] // e.g., 'vi', 'en'
      
      const moduleMessages = locales[path].default

      // Merge into the global messages object, namespaced by moduleName
      if (messages[locale]) {
        if (!messages[locale][moduleName]) {
          messages[locale][moduleName] = {}
        }
        messages[locale][moduleName] = { 
          ...messages[locale][moduleName], 
          ...moduleMessages 
        }
      }
    }
  }

  return messages
}

/**
 * Setup Vue I18n for internationalization
 */
export function setupI18n() {
  const messages = loadModuleLocales()
  
  return createI18n({
    legacy: false, // Use Composition API mode
    locale: 'vi', // Default locale
    fallbackLocale: 'en',
    messages
  })
}
