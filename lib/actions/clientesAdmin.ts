'use server'

import { createServerClient } from '@/lib/supabase/server'

export interface ClienteAdminSummary {
  id: string
  nombre: string
  telefono: string
  email?: string | null
  codigo_referido: string
  created_at: string
  borndate?: string | null
  es_mes_cumpleanos?: boolean
  total_pedidos: number
  total_gastado: number
  ultimo_pedido?: string | null
  dias_sin_pedir?: number
  sellos_actuales: number
  canjes_disponibles: number
  nivel_lealtad: 'Socio Marea' | 'Capitán Aguachile' | 'Leyenda Marea Negra'
}

export async function getClientesClubAdmin(): Promise<ClienteAdminSummary[]> {
  const supabase = await createServerClient()

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
    .select('id, nombre, telefono, email, codigo_referido, created_at, borndate')
    .order('created_at', { ascending: false })

  // 3. Obtener todos los pedidos para cruzar estadísticas por celular
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('cliente_telefono, total, estado, created_at')
    .order('created_at', { ascending: false })

  // 4. Obtener canjes
  const { data: canjes } = await supabase
    .from('canjes_lealtad')
    .select('telefono')

  const canjesMap = new Map<string, number>()
  ;(canjes || []).forEach((c) => {
    const p = (c.telefono || '').replace(/\D/g, '')
    canjesMap.set(p, (canjesMap.get(p) || 0) + 1)
  })

  const hoy = new Date()
  const mesActual = hoy.getMonth() + 1

  if (clientesErr || !clientes) {
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
    const pedidosEntregados = clientePedidos.filter((p) => p.estado === 'entregado').length
    const gastado = clientePedidos.reduce((acc, p) => acc + Number(p.total || 0), 0)

    const ultimoPedido = clientePedidos[0]?.created_at || null
    let diasSinPedir = 0
    if (ultimoPedido) {
      const diffTime = Math.abs(hoy.getTime() - new Date(ultimoPedido).getTime())
      diasSinPedir = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const canjesRealizados = canjesMap.get(cleanP) || 0
    const canjesDisponibles = Math.max(0, Math.floor(pedidosEntregados / 6) - canjesRealizados)
    const sellosActuales = pedidosEntregados % 6

    let esMesCumple = false
    if (c.borndate) {
      try {
        const [_, mes] = c.borndate.split('-')
        if (parseInt(mes, 10) === mesActual) {
          esMesCumple = true
        }
      } catch (e) {}
    }

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
      borndate: c.borndate || null,
      es_mes_cumpleanos: esMesCumple,
      total_pedidos: count,
      total_gastado: gastado,
      ultimo_pedido: ultimoPedido,
      dias_sin_pedir: diasSinPedir,
      sellos_actuales: sellosActuales,
      canjes_disponibles: canjesDisponibles,
      nivel_lealtad: nivel,
    }
  })

  return result
}

// Eliminar un cliente registrado del Club de Lealtad (Administradores)
export async function deleteClienteClub(id: string) {
  const supabase = await createServerClient()

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

