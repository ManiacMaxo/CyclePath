import { ThemeProvider } from 'next-themes'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SWRConfig } from 'swr'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/auth'
import Router from '@/router'
import './index.css'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <AuthProvider>
        <SWRConfig
          value={{
            revalidateOnFocus: false,
            dedupingInterval: 2000,
            shouldRetryOnError: true,
            errorRetryCount: 2,
          }}
        >
          <ThemeProvider enableSystem enableColorScheme attribute='class'>
            <Router />
            <Toaster />
          </ThemeProvider>
        </SWRConfig>
      </AuthProvider>
    </StrictMode>,
  )
}
