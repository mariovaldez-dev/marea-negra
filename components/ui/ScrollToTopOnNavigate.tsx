'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollToTopOnNavigate() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual'
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [pathname])

  return null
}
