import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const EMPLEADOS_SEED = [
  {
    email: 'cajero@mareanegra.mx',
    password: 'Cajero123!',
    nombre: 'Carlos Gómez',
    rol: 'cajero',
    puesto: 'Cajero Principal',
    pin: '1111',
    telefono: '6691112233',
  },
  {
    email: 'mesero@mareanegra.mx',
    password: 'Mesero123!',
    nombre: 'Juan Rodríguez',
    rol: 'mesero',
    puesto: 'Mesero Salón',
    pin: '2222',
    telefono: '6692223344',
  },
  {
    email: 'mesero2@mareanegra.mx',
    password: 'Mesero123!',
    nombre: 'Ana Pérez',
    rol: 'mesero',
    puesto: 'Mesera Terraza',
    pin: '3333',
    telefono: '6693334455',
  },
  {
    email: 'cocina@mareanegra.mx',
    password: 'Cocina123!',
    nombre: 'Chef Roberto',
    rol: 'cocina',
    puesto: 'Jefe de Cocina',
    pin: '4444',
    telefono: '6694445566',
  },
]

export async function POST(req: NextRequest) {
  try {
    const adminSupabase = createAdminClient()
    const resultados = []

    for (const emp of EMPLEADOS_SEED) {
      // 1. Crear o actualizar usuario en Supabase Auth
      const { data: created, error: createError } = await adminSupabase.auth.admin.createUser({
        email: emp.email,
        password: emp.password,
        email_confirm: true,
        user_metadata: {
          nombre: emp.nombre,
          rol: emp.rol,
        },
      })

      let userId = created?.user?.id

      if (createError) {
        // Si ya existe, buscar su ID
        const { data: userList } = await adminSupabase.auth.admin.listUsers()
        const existing = userList?.users?.find((u) => u.email?.toLowerCase() === emp.email.toLowerCase())
        if (existing) {
          userId = existing.id
          // Actualizar contraseña para asegurar que coincida con el seed
          await adminSupabase.auth.admin.updateUserById(userId, {
            password: emp.password,
            user_metadata: { nombre: emp.nombre, rol: emp.rol },
          })
        }
      }

      if (userId) {
        // 2. Guardar perfil en public.profiles
        await adminSupabase.from('profiles').upsert({
          id: userId,
          nombre: emp.nombre,
          email: emp.email,
          rol: emp.rol,
          puesto: emp.puesto,
          pin: emp.pin,
          telefono: emp.telefono,
          activo: true,
        })
        resultados.push({ email: emp.email, status: 'ok', userId })
      } else {
        resultados.push({ email: emp.email, status: 'error', error: createError?.message })
      }
    }

    return NextResponse.json({ success: true, resultados })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
