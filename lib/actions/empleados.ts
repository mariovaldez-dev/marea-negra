'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { Profile, UserRole } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export async function getEmpleados(): Promise<Profile[]> {
  const supabase = createServerClient()
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('activo', { ascending: false })
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error al obtener empleados:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('Error al obtener empleados:', err)
    return []
  }
}

export async function crearEmpleado(formData: {
  nombre: string
  email: string
  password?: string
  rol: UserRole
  puesto?: string
  pin?: string
  telefono?: string
}) {
  const cleanEmail = formData.email.trim().toLowerCase()
  const cleanNombre = formData.nombre.trim()
  const cleanPassword = formData.password?.trim() || 'MareaNegra2024!'

  // 1. Intentar crear usuario en Supabase Auth con Admin Client (si está disponible el Service Role)
  let authUserId: string | null = null

  try {
    const adminSupabase = createAdminClient()
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: {
        nombre: cleanNombre,
        rol: formData.rol,
      },
    })

    if (authError) {
      // Si el usuario ya existe en auth, obtenemos su ID
      if (authError.message?.toLowerCase().includes('already registered')) {
        const { data: userList } = await adminSupabase.auth.admin.listUsers()
        const existing = userList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail)
        if (existing) {
          authUserId = existing.id
        }
      } else {
        console.warn('Aviso al crear usuario en Supabase Auth:', authError.message)
      }
    } else if (authData?.user) {
      authUserId = authData.user.id
    }
  } catch (err) {
    console.warn('Admin client auth no disponible o error:', err)
  }

  // Si no se pudo obtener ID de Auth (o dev mode sin service key), generar UUID
  const finalId = authUserId || crypto.randomUUID()
  const supabase = createServerClient()

  // 2. Guardar en tabla profiles
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: finalId,
      nombre: cleanNombre,
      email: cleanEmail,
      rol: formData.rol,
      puesto: formData.puesto?.trim() || null,
      pin: formData.pin?.trim() || null,
      telefono: formData.telefono?.trim() || null,
      activo: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Error al registrar perfil de empleado: ${error.message}`)
  }

  revalidatePath('/admin/empleados')
  revalidatePath('/admin/caja')
  revalidatePath('/admin/mesas')
  return { success: true, data }
}

export async function actualizarEmpleado(
  id: string,
  formData: {
    nombre: string
    email?: string
    rol: UserRole
    puesto?: string
    pin?: string
    telefono?: string
    activo?: boolean
  }
) {
  const supabase = createServerClient()
  const cleanNombre = formData.nombre.trim()

  // Actualizar en tabla profiles
  const { data, error } = await supabase
    .from('profiles')
    .update({
      nombre: cleanNombre,
      email: formData.email ? formData.email.trim().toLowerCase() : undefined,
      rol: formData.rol,
      puesto: formData.puesto?.trim() || null,
      pin: formData.pin?.trim() || null,
      telefono: formData.telefono?.trim() || null,
      activo: formData.activo !== undefined ? formData.activo : true,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Error al actualizar empleado: ${error.message}`)
  }

  // Intentar sincronizar user_metadata en Supabase Auth
  try {
    const adminSupabase = createAdminClient()
    await adminSupabase.auth.admin.updateUserById(id, {
      user_metadata: {
        nombre: cleanNombre,
        rol: formData.rol,
      },
    })
  } catch {}

  revalidatePath('/admin/empleados')
  revalidatePath('/admin/caja')
  revalidatePath('/admin/mesas')
  return { success: true, data }
}

export async function cambiarPasswordEmpleado(id: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.')
  }

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase.auth.admin.updateUserById(id, {
    password: newPassword.trim(),
  })

  if (error) {
    throw new Error(`Error al cambiar contraseña: ${error.message}`)
  }

  return { success: true, data }
}

export async function toggleEstadoEmpleado(id: string, activo: boolean) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .update({ activo })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Error al cambiar estado del empleado: ${error.message}`)
  }

  revalidatePath('/admin/empleados')
  return { success: true, data }
}

export async function eliminarEmpleado(id: string) {
  const supabase = createServerClient()

  // Eliminar en profiles
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Error al eliminar empleado: ${error.message}`)
  }

  // Intentar eliminar de auth
  try {
    const adminSupabase = createAdminClient()
    await adminSupabase.auth.admin.deleteUser(id)
  } catch {}

  revalidatePath('/admin/empleados')
  return { success: true }
}

export async function verificarPinEmpleado(pin: string): Promise<Profile | null> {
  if (!pin || pin.length < 3) return null
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('pin', pin.trim())
      .eq('activo', true)
      .limit(1)
      .maybeSingle()

    if (error || !data) return null
    return data
  } catch (err) {
    console.error('Error al verificar PIN de empleado:', err)
    return null
  }
}
