'use client'
// src/app/(dashboard)/settings/page.tsx
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { User, Bell, Palette, Database, Shield, Save } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [saved, setSaved] = useState(false)

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500">Manage application preferences</p>
      </div>

      {/* Account */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">Account</h2>
        </div>
        <div className="card-body space-y-4">
          <div>
            <label className="label">Display Name</label>
            <input className="input" defaultValue={session?.user?.name ?? ''} readOnly />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" defaultValue={session?.user?.email ?? ''} readOnly />
          </div>
          <p className="text-xs text-slate-400">
            To change credentials, edit the database directly or use the Prisma Studio: <code className="font-mono">npm run db:studio</code>
          </p>
        </div>
      </div>

      {/* Appearance */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Palette className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">Appearance</h2>
        </div>
        <div className="card-body">
          <label className="label">Theme</label>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                  theme === t
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'} {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data & Refresh */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">Data & Market Prices</h2>
        </div>
        <div className="card-body space-y-4">
          <div className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Market Data Source</p>
              <p className="text-xs text-slate-500 mt-0.5">Yahoo Finance (free, no API key required)</p>
            </div>
            <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>
          </div>
          <div className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">FX Rates</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {process.env.NEXT_PUBLIC_FX_PROVIDER ?? 'frankfurter.app'} (free, no key required)
              </p>
            </div>
            <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>
          </div>
          <div className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Insights</p>
              <p className="text-xs text-slate-500 mt-0.5">Set AI_PROVIDER env var to: mock | openai | anthropic</p>
            </div>
            <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Mock</span>
          </div>
        </div>
      </div>

      {/* PWA */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">PWA & Installation</h2>
        </div>
        <div className="card-body space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This application is installable as a Progressive Web App on iOS and Android.
          </p>
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-3">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">iOS Installation</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Safari → Share button → "Add to Home Screen"
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-3">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Android Installation</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Chrome → Three-dot menu → "Add to Home Screen" or "Install App"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
