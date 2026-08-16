import React from 'react'
import { getConfigHorariosNegocio } from '@/lib/actions/negocioEstado'
import { HorariosManager } from '@/components/admin/HorariosManager'

export const revalidate = 0

export default async function AdminHorariosPage() {
  const initialConfig = await getConfigHorariosNegocio()

  return <HorariosManager initialConfig={initialConfig} />
}
