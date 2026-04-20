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
  const ThemeIcon = themeIcons[theme] ?? Monitor

  const toggleTheme = () => {
    if (theme === 'system') setTheme('light')
    else if (theme === 'light') setTheme('dark')
    else setTheme('system')
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
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      {/* Left: date/info */}
      <div className="flex items-center gap-4">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={refreshPrices}
          disabled={refreshing}
          className="btn-ghost w-10 h-10 p-0 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          title="Refresh market prices"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>

        <button 
          onClick={toggleTheme} 
          className="btn-ghost w-10 h-10 p-0 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" 
          title="Toggle color theme (Light/Dark/System)"
        >
          <ThemeIcon className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-slate-100 dark:bg-slate-800 mx-1" />

        <div className="flex items-center gap-3 pl-2">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">
              {session?.user?.name}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Free Plan</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
            {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
        </div>

        <button 
          onClick={() => signOut({ callbackUrl: '/login' })} 
          className="btn-ghost w-10 h-10 p-0 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" 
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
