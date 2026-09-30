import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Leer .env manualmente
const envPath = path.resolve(process.cwd(), '.env')
let supabaseUrl = ''
let supabaseServiceKey = ''

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = trimmed.replace('NEXT_PUBLIC_SUPABASE_URL=', '').trim()
    }
    if (trimmed.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = trimmed.replace('SUPABASE_SERVICE_ROLE_KEY=', '').trim()
    }
  })
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const EMPLEADOS = [
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

async function seed() {
  console.log('🚀 Iniciando creación limpia de usuarios Auth vía Supabase Admin API...')

  // 1. Obtener lista de usuarios actuales
  const { data: userListData, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('Error listando usuarios:', listError)
  }

  const existingUsers = userListData?.users || []

  for (const emp of EMPLEADOS) {
    console.log(`\n🔹 Procesando: ${emp.nombre} (${emp.email})...`)
    
    // Si existe previamente con datos rotos de SQL manual, lo eliminamos primero
    const existing = existingUsers.find((u) => u.email?.toLowerCase() === emp.email.toLowerCase())
    if (existing) {
      console.log(`  🗑️ Eliminando usuario previo ${existing.id} para regenerar Auth limpia...`)
      await supabase.auth.admin.deleteUser(existing.id)
    }

    // Crear usuario oficialmente con Supabase GoTrue Admin
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: emp.email,
      password: emp.password,
      email_confirm: true,
      user_metadata: {
        nombre: emp.nombre,
        rol: emp.rol,
      },
    })

    if (createError) {
      console.error(`  ❌ Error al crear usuario en Auth:`, createError.message)
      continue
    }

    const userId = created.user.id
    console.log(`  ✅ Usuario creado en Auth con ID: ${userId}`)

    // Upsert en public.profiles
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      nombre: emp.nombre,
      email: emp.email,
      rol: emp.rol,
      puesto: emp.puesto,
      pin: emp.pin,
      telefono: emp.telefono,
      activo: true,
    })

    if (profileError) {
      console.error(`  ❌ Error al crear perfil en public.profiles:`, profileError.message)
    } else {
      console.log(`  ✅ Perfil sincronizado en public.profiles`)
    }
  }

  console.log('\n🎉 ¡Todos los empleados fueron creados y autenticados exitosamente!')
}

seed().catch(console.error)
