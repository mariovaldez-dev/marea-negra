import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Cormorant_Garamond, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { CustomCursor } from '@/components/ui/CustomCursor'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
  preload: true,
})

const cormorantGaramond = Cormorant_Garamond({
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  preload: true,
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
  preload: true,
})

import { RestaurantJsonLd } from '@/components/seo/RestaurantJsonLd'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://marea-negra.com'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Marea Negra | Aguachiles · Sinaloa',
    template: '%s | Marea Negra',
  },
  description: 'Los mejores aguachiles negros y mariscos frescos de Sinaloa. Pide en línea, consulta la carta y acumula sellos en tu tarjeta VIP.',
  keywords: [
    'aguachile negro',
    'aguachiles sinaloa',
    'mariscos sinaloa',
    'ceviche de camaron',
    'coctel de mariscos',
    'tostadas de callo',
    'marisqueria culiacan',
    'mariscos a domicilio',
    'marea negra',
  ],
  authors: [{ name: 'Marea Negra' }],
  publisher: 'Marea Negra',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Marea Negra | Aguachiles · Sinaloa',
    description: 'Sinaloa Auténtico · Mariscos del Día · Pedidos en Línea y Tarjeta VIP en Sinaloa, México.',
    url: baseUrl,
    siteName: 'Marea Negra - Aguachiles',
    locale: 'es_MX',
    type: 'website',
    images: [
      {
        url: '/apple-icon.png',
        width: 512,
        height: 512,
        alt: 'Marea Negra - Aguachiles',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marea Negra | Aguachiles · Sinaloa',
    description: 'Los mejores aguachiles y mariscos de Sinaloa. Pide en línea y disfruta de mariscos frescos del día.',
    images: ['/apple-icon.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Marea Negra',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'geo.region': 'MX-SIN',
    'geo.placename': 'Sinaloa, México',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#080808' },
    { media: '(prefers-color-scheme: light)', color: '#F4F0E8' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${bebasNeue.variable} ${cormorantGaramond.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <RestaurantJsonLd />
        {/* SCRIPT BLOQUEANTE ANTI-DESTELLO (FOUC): EVALÚA EL TEMA ANTES DE RENDERIZAR */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('marea-theme');
                  if (saved === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[#F4F0E8] text-negro dark:bg-negro dark:text-blanco min-h-screen antialiased selection:bg-coral selection:text-blanco transition-colors duration-300">
        <CustomCursor />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
