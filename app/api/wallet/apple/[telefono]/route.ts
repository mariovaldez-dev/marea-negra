import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { telefono: string } }
) {
  const telefono = params.telefono?.replace(/\D/g, '')

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

  // Estructura oficial del pass.json de Apple Wallet
  const applePassData = {
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID || 'pass.com.mareanegra.vip',
    serialNumber: `MN-${telefono}`,
    teamIdentifier: process.env.APPLE_TEAM_ID || 'MAREANEGRA1',
    organizationName: 'Marea Negra - Aguachiles',
    description: 'Tarjeta de Lealtad VIP Marea Negra',
    logoText: 'MAREA NEGRA',
    foregroundColor: 'rgb(247, 243, 238)',
    backgroundColor: 'rgb(8, 8, 8)',
    labelColor: 'rgb(201, 168, 76)',
    storeCard: {
      headerFields: [
        {
          key: 'tier',
          label: 'MEMBRESÍA',
          value: 'SOCIO VIP',
        },
      ],
      primaryFields: [
        {
          key: 'member',
          label: 'TITULAR',
          value: nombre.toUpperCase(),
        },
      ],
      secondaryFields: [
        {
          key: 'points',
          label: 'PUNTOS',
          value: puntos,
        },
        {
          key: 'memberId',
          label: 'N° SOCIO',
          value: numeroSocio,
        },
      ],
      backFields: [
        {
          key: 'terms',
          label: 'TÉRMINOS Y CONDICIONES',
          value:
            'Esta tarjeta es personal e intransferible. Presenta tu código QR en caja o al pedir en mesa para acumular sellos de lealtad.',
        },
        {
          key: 'website',
          label: 'SITIO OFICIAL',
          value: 'https://mareanegra.mx',
        },
      ],
    },
    barcodes: [
      {
        format: 'PKBarcodeFormatQR',
        message: `MAREA_SOCIO:${telefono}:${nombre}`,
        messageEncoding: 'iso-8859-1',
      },
    ],
  }

  // Devolver el manifiesto del Pass en formato JSON estructurado
  return NextResponse.json(applePassData, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}
