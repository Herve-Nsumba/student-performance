import { useCallback, useSyncExternalStore } from 'react'

const THEME_KEY = 'pi_theme'

function getSnapshot() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function subscribe(cb) {
  const observer = new MutationObserver(cb)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot)
  const isDark = theme === 'dark'

  const toggle = useCallback(() => {
    const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try { localStorage.setItem(THEME_KEY, next) } catch(e) {}
  }, [])

  return { theme, isDark, toggle }
}
