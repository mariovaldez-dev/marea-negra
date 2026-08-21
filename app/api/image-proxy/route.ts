import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url')

  if (!urlParam) {
    return new NextResponse('URL faltante', { status: 400 })
  }

  try {
    const targetUrl = decodeURIComponent(urlParam)

    // Validar que sea una URL HTTP/HTTPS válida
    const parsed = new URL(targetUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return new NextResponse('Protocolo no permitido', { status: 400 })
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MareaNegraApp/1.0)',
      },
    })

    if (!response.ok) {
      return new NextResponse(`Error al obtener la imagen: ${response.statusText}`, {
        status: response.status,
      })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const arrayBuffer = await response.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (error: any) {
    console.error('Error en /api/image-proxy:', error)
    return new NextResponse(`Error interno: ${error?.message || 'Error desconocido'}`, {
      status: 500,
    })
  }
}
