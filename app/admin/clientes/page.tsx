import React from 'react'
import { getClientesClubAdmin } from '@/lib/actions/clientesAdmin'
import { ClientesManager } from '@/components/admin/ClientesManager'

export const revalidate = 0 // Server component siempre fresco

export default async function AdminClientesPage() {
  const clientes = await getClientesClubAdmin()
  return <ClientesManager initialClientes={clientes} />
}
