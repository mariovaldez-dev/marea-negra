-- 10_recetas_y_escandallos.sql
-- Tabla de recetas/escandallos para descuento automático de stock por comanda

create table if not exists platillo_ingredientes (
  id serial primary key,
  platillo_id int references platillos(id) on delete cascade,
  insumo_id int references insumos(id) on delete cascade,
  cantidad_por_porcion numeric(10,3) not null,
  created_at timestamptz default now(),
  unique(platillo_id, insumo_id)
);

-- RLS
alter table platillo_ingredientes enable row level security;

create policy "Lectura publica recetas" on platillo_ingredientes
  for select using (true);

create policy "Admin gestiona recetas" on platillo_ingredientes
  for all using (auth.role() = 'authenticated');

-- Función almacenada / helper para descontar inventario
create or replace function descontar_stock_pedido(p_pedido_id int)
returns void as $$
declare
  item record;
  ing record;
begin
  for item in 
    select platillo_id, cantidad, nombre_platillo 
    from pedido_items 
    where pedido_id = p_pedido_id
  loop
    if item.platillo_id is not null then
      for ing in 
        select insumo_id, cantidad_por_porcion 
        from platillo_ingredientes 
        where platillo_id = item.platillo_id
      loop
        -- Descontar stock del insumo
        update insumos
        set stock_actual = greatest(0, stock_actual - (ing.cantidad_por_porcion * item.cantidad))
        where id = ing.insumo_id;

        -- Registrar movimiento de salida
        insert into movimientos_inventario (insumo_id, tipo, cantidad, motivo)
        values (
          ing.insumo_id,
          'salida',
          (ing.cantidad_por_porcion * item.cantidad),
          'Consumo automático receta comanda #' || p_pedido_id || ' (' || coalesce(item.nombre_platillo, 'Platillo') || ' x' || item.cantidad || ')'
        );
      end loop;
    end if;
  end loop;
end;
$$ language plpgsql;
