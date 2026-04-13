import type { ReactNode } from 'react'
import { BottomNav } from '@/components/layout/bottom-nav'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className='flex min-h-dvh flex-col bg-background'>
      <main className='flex-1 pb-[calc(60px+env(safe-area-inset-bottom))]'>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
