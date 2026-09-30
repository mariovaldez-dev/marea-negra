import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ telefono: string }> }
) {
  const resolvedParams = await params
  const telefono = resolvedParams.telefono?.replace(/\D/g, '')

  if (!telefono || telefono.length < 7) {
    return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Consultar datos del socio
  const { data: socio } = await supabase
    .from('clientes_club')
    .select('*')
    .eq('telefono', telefono)
    .single()

  const nombre = socio?.nombre || 'Socio VIP'
  const puntos = socio?.puntos || 0
  const numeroSocio = `MN-${telefono.slice(-4)}-VIP`

  // Estructura oficial del objeto Google Wallet LoyaltyObject
  const googleWalletObject = {
    id: `loyalty_${telefono}`,
    classId: `marea_negra.loyalty_card`,
    state: 'ACTIVE',
    accountId: numeroSocio,
    accountName: nombre,
    loyaltyPoints: {
      label: 'Puntos Marea Negra',
      points: {
        int: puntos,
      },
    },
    barcode: {
      type: 'QR_CODE',
      value: `MAREA_SOCIO:${telefono}:${nombre}`,
      alternateText: numeroSocio,
    },
    hexBackgroundColor: '#080808',
  }

  return NextResponse.json(googleWalletObject, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}
