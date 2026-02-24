'use client'
// src/components/TopBar.tsx
import { useSession, signOut } from 'next-auth/react'
import { Sun, Moon, Monitor, LogOut, RefreshCw, Bell } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { useState } from 'react'

export default function TopBar() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [refreshing, setRefreshing] = useState(false)

  const themeIcons: Record<string, typeof Sun> = { light: Sun, dark: Moon, system: Monitor }
  const ThemeIcon = themeIcons[theme]

  const cycleTheme = () => {
    const themes: Array<typeof theme> = ['light', 'dark', 'system']
    const idx = themes.indexOf(theme)
    setTheme(themes[(idx + 1) % themes.length])
  }

  const refreshPrices = async () => {
    setRefreshing(true)
    try {
      await fetch('/api/market-data', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } })
      window.location.reload()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      {/* Left: breadcrumb placeholder */}
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={refreshPrices}
          disabled={refreshing}
          className="btn-ghost p-2 text-slate-500"
          title="Refresh market prices"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>

        <button onClick={cycleTheme} className="btn-ghost p-2 text-slate-500" title={`Theme: ${theme}`}>
          <ThemeIcon className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">
            {session?.user?.name}
          </span>
        </div>

        <button onClick={() => signOut({ callbackUrl: '/login' })} className="btn-ghost p-2 text-slate-500" title="Sign out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
