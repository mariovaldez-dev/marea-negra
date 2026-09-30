export type UserRole = 'admin' | 'cajero' | 'mesero' | 'cocina' | 'empleado'

export type EstadoPedido = 'nuevo' | 'preparando' | 'listo' | 'entregado' | 'cancelado'

export type MetodoPago = 'efectivo' | 'transferencia' | 'oxxo'

export type TipoEntrega = 'local' | 'didi' | 'mesa'

export type TipoMovimiento = 'entrada' | 'salida'

export type NivelPicor = 'suave' | 'medio' | 'bravo' | 'sin_chile'

export type FormaMesa = 'cuadrada' | 'redonda' | 'rectangular' | 'barra'

export type EstadoMesa = 'libre' | 'ocupada' | 'cuenta_pedida'

export type CategoriaGasto = 'insumos_urgentes' | 'proveedores' | 'servicios' | 'personal' | 'otros'

export interface Profile {
  id: string
  nombre: string | null
  email?: string | null
  rol: UserRole
  pin?: string | null
  telefono?: string | null
  activo?: boolean
  puesto?: string | null
  created_at?: string
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
  precio_anterior?: number | null
  es_promocion?: boolean | null
  etiqueta_promo?: string | null
  dias_promo?: string[] | null
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
  tipo_entrega?: TipoEntrega
  mesa_id?: number | null
  mesa_nombre?: string | null
  mesero_id?: string | null
  mesero_nombre?: string | null
  cobrado_por?: string | null
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


export interface Mesa {
  id: number
  nombre: string
  capacidad: number
  forma: FormaMesa
  pos_x: number
  pos_y: number
  estado: EstadoMesa
  pedido_activo_id?: number | null
  activo: boolean
  created_at?: string
  pedido_activo?: Pedido | null
}

export interface GastoCaja {
  id: number
  fecha: string
  concepto: string
  categoria: CategoriaGasto
  monto: number
  metodo_pago: 'efectivo' | 'transferencia'
  comprobante_url?: string | null
  registrado_por?: string | null
  created_at: string
  profile?: Profile
}

export interface DesgloseBilletes {
  b1000?: number
  b500?: number
  b200?: number
  b100?: number
  b50?: number
  b20?: number
  m20?: number
  m10?: number
  m5?: number
  m2?: number
  m1?: number
  m050?: number
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

export type EstadoCaja = 'abierta' | 'cerrada'

export interface CierreCaja {
  id: number
  fecha: string
  estado?: EstadoCaja
  hora_apertura?: string | null
  hora_cierre?: string | null
  abierto_por?: string | null
  fondo_inicial?: number | null
  monto_apertura_desglose?: DesgloseBilletes | null
  notas_apertura?: string | null
  total_efectivo: number
  total_transferencia: number
  total_oxxo: number
  total_gastos?: number | null
  desglose_billetes?: DesgloseBilletes | null
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
  sinIngredientes?: string[]
}

export interface PlatilloIngrediente {
  id: number
  platillo_id: number
  insumo_id: number
  cantidad_por_porcion: number
  created_at?: string
  platillo?: Platillo
  insumo?: Insumo
}

export interface DatosSucursal {
  nombre_sucursal: string
  slogan: string
  telefono_whatsapp: string
  telefono_fijo?: string
  direccion: string
  colonia?: string
  ciudad: string
  google_maps_url?: string
  radio_cobertura_km?: number
  costo_envio_base?: number
  wifi_red?: string
  wifi_password?: string
  rfc?: string
}

export const DEFAULT_SUCURSAL: DatosSucursal = {
  nombre_sucursal: 'Marea Negra',
  slogan: '¡Al Vrgazo!, como nos gusta.',
  telefono_whatsapp: '6676820396',
  telefono_fijo: '6676820396',
  direccion: 'Av. del Mar #1200, Fracc. Tellerías',
  colonia: 'Tellerías',
  ciudad: 'Culiacán, Sinaloa, México',
  google_maps_url: 'https://maps.google.com/?q=Marea+Negra+Aguachiles+Mazatlan',
  radio_cobertura_km: 10,
  costo_envio_base: 40,
  wifi_red: 'MareaNegra_Invitados',
  wifi_password: 'AguachileNegro2026',
  rfc: 'MNE240101XYZ',
}

