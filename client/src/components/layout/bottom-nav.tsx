import { Home, LogIn, MapIcon, User } from 'lucide-react'
import { useLocation } from 'wouter'
import { useAuth } from '@/context/auth'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: typeof Home
}

const AUTHENTICATED_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/map', label: 'Map', icon: MapIcon },
  { href: '/profile', label: 'Profile', icon: User },
]

const GUEST_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/login', label: 'Login', icon: LogIn },
  { href: '/register', label: 'Register', icon: User },
]

export function BottomNav() {
  const [pathname, navigate] = useLocation()
  const { isAuthenticated } = useAuth()

  const items = isAuthenticated ? AUTHENTICATED_ITEMS : GUEST_ITEMS

  return (
    <nav
      aria-label='Bottom navigation'
      className='fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 shadow-[0_-10px_30px_-18px_rgba(0,0,0,0.35)] backdrop-blur supports-backdrop-filter:bg-background/85'
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className='mx-auto flex h-15 max-w-screen-sm items-center justify-around px-2'>
        {items.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href)

          return (
            <button
              key={href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
                isActive && 'text-primary',
              )}
              onClick={() => navigate(href)}
              type='button'
            >
              <Icon className='size-5' />
              <span className='truncate'>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
