export type UserRole = 'admin' | 'empleado'

export type EstadoPedido = 'nuevo' | 'preparando' | 'listo' | 'entregado' | 'cancelado'

export type MetodoPago = 'efectivo' | 'transferencia' | 'oxxo'

export type TipoMovimiento = 'entrada' | 'salida'

export type NivelPicor = 'suave' | 'medio' | 'bravo' | 'sin_chile'

export interface Profile {
  id: string
  nombre: string | null
  rol: UserRole
  created_at: string
}

export interface Categoria {
  id: number
  nombre: string
  orden: number
}

export interface Platillo {
  id: number
  categoria_id: number | null
  nombre: string
  descripcion: string | null
  precio: number
  emoji: string | null
  disponible: boolean
  imagen_url: string | null
  created_at?: string
}

export interface PedidoItem {
  id?: number
  pedido_id?: number
  platillo_id: number | null
  nombre_platillo: string
  precio_unitario: number
  cantidad: number
  nivel_picor?: NivelPicor | null
  notas_item?: string | null
}

export interface Pedido {
  id: number
  cliente_nombre: string
  cliente_telefono: string | null
  estado: EstadoPedido
  metodo_pago: MetodoPago | null
  hora_recogida: string | null
  subtotal?: number | null
  descuento?: number | null
  cupon_codigo?: string | null
  total: number
  notas: string | null
  comprobante_url?: string | null
  created_at: string
  pedido_items?: PedidoItem[]
}

export interface Insumo {
  id: number
  nombre: string
  unidad: string
  stock_actual: number
  stock_minimo: number
  created_at?: string
}

export interface MovimientoInventario {
  id: number
  insumo_id: number
  tipo: TipoMovimiento
  cantidad: number
  motivo: string | null
  created_by: string | null
  created_at: string
  insumo?: Insumo
  profile?: Profile
}

export interface CierreCaja {
  id: number
  fecha: string
  total_efectivo: number
  total_transferencia: number
  total_oxxo: number
  total_sistema: number
  total_real: number
  diferencia: number
  notas: string | null
  cerrado_por: string | null
  created_at: string
  profile?: Profile
}

export interface CartItem {
  platillo: Platillo
  cantidad: number
}

export interface ConfiguredCartItem {
  cartItemId: string
  platillo: Platillo
  cantidad: number
  nivelPicor: NivelPicor
  notasItem: string
}
