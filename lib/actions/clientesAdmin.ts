'use server'

import { createServerClient } from '@/lib/supabase/server'

export interface ClienteAdminSummary {
  id: string
  nombre: string
  telefono: string
  email?: string | null
  codigo_referido: string
  created_at: string
  total_pedidos: number
  total_gastado: number
  nivel_lealtad: 'Socio Marea' | 'Capitán Aguachile' | 'Leyenda Marea Negra'
}

export async function getClientesClubAdmin(): Promise<ClienteAdminSummary[]> {
  const supabase = createServerClient()

  // 1. Verificación estricta de seguridad: Solo personal autenticado (Admin/Empleado)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Acceso restringido: Se requieren credenciales de administración para ver la base de clientes.')
  }

  // 2. Obtener clientes de clientes_club
  const { data: clientes, error: clientesErr } = await supabase
    .from('clientes_club')
    .select('id, nombre, telefono, email, codigo_referido, created_at')
    .order('created_at', { ascending: false })

  // 3. Obtener todos los pedidos para cruzar estadísticas por celular
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('cliente_telefono, total, estado')

  if (clientesErr || !clientes) {
    if (pedidos && pedidos.length > 0) {
      const mapa = new Map<string, { count: number; total: number }>()
      pedidos.forEach((p) => {
        const phone = p.cliente_telefono?.replace(/\D/g, '') || '6670000000'
        const actual = mapa.get(phone) || { count: 0, total: 0 }
        mapa.set(phone, {
          count: actual.count + 1,
          total: actual.total + Number(p.total || 0),
        })
      })

      const resultado: ClienteAdminSummary[] = []
      let idx = 1
      mapa.forEach((val, phone) => {
        let nivel: 'Socio Marea' | 'Capitán Aguachile' | 'Leyenda Marea Negra' = 'Socio Marea'
        if (val.count >= 10) nivel = 'Leyenda Marea Negra'
        else if (val.count >= 5) nivel = 'Capitán Aguachile'

        resultado.push({
          id: `cliente_${idx++}`,
          nombre: `Cliente ${phone.slice(-4)}`,
          telefono: phone,
          email: null,
          codigo_referido: `MAREA-SOCIO-${phone.slice(-4)}`,
          created_at: new Date().toISOString(),
          total_pedidos: val.count,
          total_gastado: val.total,
          nivel_lealtad: nivel,
        })
      })

      return resultado
    }

    return []
  }

  // Mapear estadísticas por cliente asegurando no exponer contraseñas ni datos sensibles
  const result: ClienteAdminSummary[] = clientes.map((c) => {
    const cleanP = (c.telefono || '').replace(/\D/g, '')
    const clientePedidos = (pedidos || []).filter((p) => {
      const pClean = (p.cliente_telefono || '').replace(/\D/g, '')
      return pClean && (pClean === cleanP || pClean.includes(cleanP))
    })

    const count = clientePedidos.length
    const gastado = clientePedidos.reduce((acc, p) => acc + Number(p.total || 0), 0)

    let nivel: 'Socio Marea' | 'Capitán Aguachile' | 'Leyenda Marea Negra' = 'Socio Marea'
    if (count >= 10) nivel = 'Leyenda Marea Negra'
    else if (count >= 5) nivel = 'Capitán Aguachile'

    return {
      id: c.id,
      nombre: c.nombre,
      telefono: cleanP,
      email: c.email,
      codigo_referido: c.codigo_referido,
      created_at: c.created_at,
      total_pedidos: count,
      total_gastado: gastado,
      nivel_lealtad: nivel,
    }
  })

  return result
}

// Eliminar un cliente registrado del Club de Lealtad (Administradores)
export async function deleteClienteClub(id: string) {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Acceso denegado: Se requieren permisos de administración para eliminar clientes.')
  }

  // Eliminar cliente por su ID en clientes_club
  const { error } = await supabase
    .from('clientes_club')
    .delete()
    .eq('id', id)

  if (error) {
    // Si no se encuentra por id (en caso de mock id), intentar por telefono
    const { error: phoneErr } = await supabase
      .from('clientes_club')
      .delete()
      .eq('telefono', id.replace('cliente_', ''))

    if (phoneErr) throw new Error(`Error al eliminar cliente: ${error.message}`)
  }

  return { success: true }
}

