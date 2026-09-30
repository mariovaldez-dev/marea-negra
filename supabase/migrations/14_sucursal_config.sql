-- ===================================================
-- MAREA NEGRA - MIGRACIÓN 14: DATOS DE SUCURSAL Y CONTACTO
-- ===================================================

-- 1. Agregar columna `sucursal` a `configuracion_negocio` si aún no existe
alter table configuracion_negocio 
add column if not exists sucursal jsonb default '{
  "nombre_sucursal": "Marea Negra",
  "slogan": "Aguachiles & Cocteles · Sinaloa Mar & Tierra",
  "telefono_whatsapp": "6676820396",
  "telefono_fijo": "6676820396",
  "direccion": "Av. del Mar #1200, Fracc. Tellerías",
  "colonia": "Tellerías",
  "ciudad": "Culiacán, Sinaloa, México",
  "google_maps_url": "https://maps.google.com/?q=Marea+Negra+Aguachiles+Mazatlan",
  "radio_cobertura_km": 10,
  "costo_envio_base": 40,
  "wifi_red": "MareaNegra_Invitados",
  "wifi_password": "AguachileNegro2026",
  "rfc": "MNE240101XYZ"
}'::jsonb;

-- 2. Asegurar que el registro ID=1 exista con la información completa
insert into configuracion_negocio (id, abierto, modo_automatico, mensaje_cerrado, horarios_dias, sucursal)
values (
  1, 
  true, 
  false, 
  'Por el momento nuestra cocina se encuentra cerrada y no estamos recibiendo nuevos pedidos en línea.', 
  '[{"id": "lunes", "nombre": "Lunes", "abierto": true, "apertura": "11:00", "cierre": "20:00"}, {"id": "martes", "nombre": "Martes", "abierto": true, "apertura": "11:00", "cierre": "20:00"}, {"id": "miercoles", "nombre": "Miércoles", "abierto": true, "apertura": "11:00", "cierre": "20:00"}, {"id": "jueves", "nombre": "Jueves", "abierto": true, "apertura": "11:00", "cierre": "20:00"}, {"id": "viernes", "nombre": "Viernes", "abierto": true, "apertura": "11:00", "cierre": "21:00"}, {"id": "sabado", "nombre": "Sábado", "abierto": true, "apertura": "11:00", "cierre": "21:00"}, {"id": "domingo", "nombre": "Domingo", "abierto": true, "apertura": "11:00", "cierre": "20:00"}]'::jsonb,
  '{
    "nombre_sucursal": "Marea Negra",
    "slogan": "Aguachiles & Cocteles · Sinaloa Mar & Tierra",
    "telefono_whatsapp": "6676820396",
    "telefono_fijo": "6676820396",
    "direccion": "Av. del Mar #1200, Fracc. Tellerías",
    "colonia": "Tellerías",
    "ciudad": "Culiacán, Sinaloa, México",
    "google_maps_url": "https://maps.google.com/?q=Marea+Negra+Aguachiles+Mazatlan",
    "radio_cobertura_km": 10,
    "costo_envio_base": 40,
    "wifi_red": "MareaNegra_Invitados",
    "wifi_password": "AguachileNegro2026",
    "rfc": "MNE240101XYZ"
  }'::jsonb
)
on conflict (id) do update set
  sucursal = excluded.sucursal;

-- 3. Confirmar permisos RLS
grant select on configuracion_negocio to anon, authenticated;
grant all on configuracion_negocio to authenticated;
