import React from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { MenuManager } from '@/components/menu/MenuManager'
import { Platillo, Categoria } from '@/lib/types/database'

export const revalidate = 0

const FALLBACK_CATEGORIAS: Categoria[] = [
  { id: 1, nombre: 'Aguachiles', orden: 1 },
  { id: 2, nombre: 'Ceviches y Cocteles', orden: 2 },
  { id: 3, nombre: 'Complementos', orden: 3 },
]

const FALLBACK_PLATILLOS: Platillo[] = [
  {
    id: 1,
    categoria_id: 1,
    nombre: 'Aguachile Negro',
    descripcion: 'Camarón, chile chiltepín, pepino, cebolla morada',
    precio: 149,
    precio_anterior: 199,
    es_promocion: true,
    etiqueta_promo: 'ESPECIAL 2X1',
    dias_promo: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
    emoji: '🦐',
    disponible: true,
    imagen_url: null,
  },
  {
    id: 2,
    categoria_id: 1,
    nombre: 'Aguachile Rojo',
    descripcion: 'Camarón, chile de árbol, limón, cilantro',
    precio: 149,
    emoji: '🌶️',
    disponible: true,
    imagen_url: null,
  },
  {
    id: 3,
    categoria_id: 1,
    nombre: 'Aguachile Verde',
    descripcion: 'Camarón, chile serrano, pepino, aguacate',
    precio: 139,
    emoji: '🥒',
    disponible: true,
    imagen_url: null,
  },
  {
    id: 4,
    categoria_id: 2,
    nombre: 'Ceviche Camarón',
    descripcion: 'Camarón cocido, jitomate, pepino, cilantro',
    precio: 139,
    emoji: '🍋',
    disponible: true,
    imagen_url: null,
  },
  {
    id: 5,
    categoria_id: 2,
    nombre: 'Coctel Sinaloa',
    descripcion: 'Camarón, pulpo, callo, aguacate, valentina',
    precio: 179,
    precio_anterior: 220,
    es_promocion: true,
    etiqueta_promo: 'OFERTA ESPECIAL',
    dias_promo: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
    emoji: '🐙',
    disponible: true,
    imagen_url: null,
  },
  {
    id: 6,
    categoria_id: 3,
    nombre: 'Tostadas de Callo',
    descripcion: 'Callo marinado, mayonesa, aguacate, limón',
    precio: 59,
    emoji: '🥑',
    disponible: true,
    imagen_url: null,
  },
]

export default async function MenuAdminPage() {
  const supabase = createServerClient()

  let platillos: Platillo[] = FALLBACK_PLATILLOS
  let categorias: Categoria[] = FALLBACK_CATEGORIAS

  try {
    const [platRes, catRes] = await Promise.all([
      supabase.from('platillos').select('*').order('id', { ascending: true }),
      supabase.from('categorias').select('*').order('orden', { ascending: true }),
    ])

    if (platRes.data && platRes.data.length > 0) platillos = platRes.data
    if (catRes.data && catRes.data.length > 0) categorias = catRes.data
  } catch (err) {
    console.warn('Error al cargar catálogo de menú en admin:', err)
  }

  return <MenuManager initialPlatillos={platillos} categorias={categorias} />
}
