import React from 'react'
import { getCupones } from '@/lib/actions/cupones'
import { CuponesManager } from '@/components/cupones/CuponesManager'

export const dynamic = 'force-dynamic'

export default async function CuponesAdminPage() {
  const cupones = await getCupones()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <CuponesManager initialCupones={cupones} />
    </div>
  )
}
