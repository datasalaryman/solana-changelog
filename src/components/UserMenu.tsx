import { useEffect, useRef, useState } from 'react'
import { LogOut, Monitor, Moon, Sun, User } from 'lucide-react'
import { useSession, useSignOut } from '../hooks/useSession'
import { useNavigate } from '@tanstack/react-router'

type ThemeMode = 'light' | 'dark' | 'auto'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto'
  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored
  return 'auto'
}

function applyThemeMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)
  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }
  document.documentElement.style.colorScheme = resolved
}

const THEMES: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'auto', label: 'System', icon: Monitor },
]

export default function UserMenu() {
  const navigate = useNavigate()
  const signOut = useSignOut()
  const { data: session } = useSession()
  const [mode, setMode] = useState<ThemeMode>('auto')
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initialMode = getInitialMode()
    setMode(initialMode)
    applyThemeMode(initialMode)
  }, [])

  useEffect(() => {
    if (mode !== 'auto') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('auto')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleThemeChange(nextMode: ThemeMode) {
    setMode(nextMode)
    applyThemeMode(nextMode)
    window.localStorage.setItem('theme', nextMode)
  }

  async function handleSignOut() {
    setOpen(false)
    try {
      await signOut()
      navigate({ to: '/login' })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (!session) return null

  const displayName = session.user.name || session.user.email

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg bg-[var(--fill)] px-2.5 py-1.5 text-[var(--sea-ink)] transition hover:bg-[var(--link-bg-hover)]"
      >
        <User className="h-4 w-4 text-[var(--sea-ink-soft)]" />
        <span className="text-sm font-medium hidden sm:inline max-w-[140px] truncate">
          {displayName}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-1.5 shadow-lg backdrop-blur-sm z-50">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-[var(--sea-ink)] truncate">{session.user.name || 'User'}</p>
            {session.user.email && (
              <p className="text-xs text-[var(--sea-ink-soft)] truncate mt-0.5">{session.user.email}</p>
            )}
          </div>

          <div className="border-t border-[var(--line)] my-1" />

          <div className="py-1">
            <p className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-[var(--sea-ink-soft)] opacity-70">
              Theme
            </p>
            {THEMES.map(({ mode: m, label, icon: Icon }) => (
              <button
                key={m}
                onClick={() => handleThemeChange(m)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                  mode === m
                    ? 'bg-[var(--lagoon)]/10 text-[var(--lagoon-deep)] font-medium'
                    : 'text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="border-t border-[var(--line)] my-1" />

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}