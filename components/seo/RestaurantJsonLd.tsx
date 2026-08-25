import React from 'react'

export function RestaurantJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://marea-negra.com'
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '526670000000'

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Marea Negra - Aguachiles',
    image: [
      `${baseUrl}/icon.png`,
      `${baseUrl}/apple-icon.png`,
    ],
    '@id': `${baseUrl}/#restaurant`,
    url: baseUrl,
    telephone: `+${whatsappNumber}`,
    priceRange: '$$',
    servesCuisine: [
      'Mariscos',
      'Aguachiles',
      'Ceviches',
      'Cocina Sinaloense',
      'Comida Mexicana',
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Culiacán',
      addressRegion: 'Sinaloa',
      addressCountry: 'MX',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 24.8091,
      longitude: -107.394,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '12:00',
        closes: '19:00',
      },
    ],
    hasMenu: `${baseUrl}/carta`,
    acceptsReservations: 'True',
    potentialAction: {
      '@type': 'OrderAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/pedir`,
        inLanguage: 'es-MX',
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      result: {
        '@type': 'FoodEstablishmentOrder',
      },
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
