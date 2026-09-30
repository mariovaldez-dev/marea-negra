-- ==============================================================================
-- MAREA NEGRA - DATOS SEMILLA DE EMPLEADOS POR ROL (seed_empleados.sql)
-- Crea los usuarios reales en Supabase Auth y sus perfiles en public.profiles
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Garantizar columnas en profiles antes de insertar
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS puesto text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;

DO $$
DECLARE
  v_cajero_id uuid := '11111111-1111-1111-1111-111111111111';
  v_mesero_id uuid := '22222222-2222-2222-2222-222222222222';
  v_mesero2_id uuid := '33333333-3333-3333-3333-333333333333';
  v_cocina_id uuid := '44444444-4444-4444-4444-444444444444';
BEGIN

  -- --------------------------------------------------------------------------
  -- 1. ROL: CAJERO (cajero@mareanegra.mx / Cajero123!)
  -- --------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cajero@mareanegra.mx') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_cajero_id, '00000000-0000-0000-0000-000000000000',
      'cajero@mareanegra.mx', crypt('Cajero123!', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nombre":"Carlos Gómez","rol":"cajero"}'::jsonb,
      now(), now(), 'authenticated', 'authenticated'
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_cajero_id, v_cajero_id,
      json_build_object('sub', v_cajero_id::text, 'email', 'cajero@mareanegra.mx')::jsonb,
      'email', v_cajero_id::text, now(), now(), now()
    ) ON CONFLICT DO NOTHING;
  ELSE
    SELECT id INTO v_cajero_id FROM auth.users WHERE email = 'cajero@mareanegra.mx';
  END IF;

  INSERT INTO public.profiles (id, nombre, email, rol, puesto, pin, telefono, activo)
  VALUES (v_cajero_id, 'Carlos Gómez', 'cajero@mareanegra.mx', 'cajero', 'Cajero Principal', '1111', '6691112233', true)
  ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    email = EXCLUDED.email,
    rol = EXCLUDED.rol,
    puesto = EXCLUDED.puesto,
    pin = EXCLUDED.pin,
    telefono = EXCLUDED.telefono,
    activo = true;


  -- --------------------------------------------------------------------------
  -- 2. ROL: MESERO 1 (mesero@mareanegra.mx / Mesero123!)
  -- --------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mesero@mareanegra.mx') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_mesero_id, '00000000-0000-0000-0000-000000000000',
      'mesero@mareanegra.mx', crypt('Mesero123!', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nombre":"Juan Rodríguez","rol":"mesero"}'::jsonb,
      now(), now(), 'authenticated', 'authenticated'
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_mesero_id, v_mesero_id,
      json_build_object('sub', v_mesero_id::text, 'email', 'mesero@mareanegra.mx')::jsonb,
      'email', v_mesero_id::text, now(), now(), now()
    ) ON CONFLICT DO NOTHING;
  ELSE
    SELECT id INTO v_mesero_id FROM auth.users WHERE email = 'mesero@mareanegra.mx';
  END IF;

  INSERT INTO public.profiles (id, nombre, email, rol, puesto, pin, telefono, activo)
  VALUES (v_mesero_id, 'Juan Rodríguez', 'mesero@mareanegra.mx', 'mesero', 'Mesero Salón', '2222', '6692223344', true)
  ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    email = EXCLUDED.email,
    rol = EXCLUDED.rol,
    puesto = EXCLUDED.puesto,
    pin = EXCLUDED.pin,
    telefono = EXCLUDED.telefono,
    activo = true;


  -- --------------------------------------------------------------------------
  -- 3. ROL: MESERO 2 (mesero2@mareanegra.mx / Mesero123!)
  -- --------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mesero2@mareanegra.mx') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_mesero2_id, '00000000-0000-0000-0000-000000000000',
      'mesero2@mareanegra.mx', crypt('Mesero123!', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nombre":"Ana Pérez","rol":"mesero"}'::jsonb,
      now(), now(), 'authenticated', 'authenticated'
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_mesero2_id, v_mesero2_id,
      json_build_object('sub', v_mesero2_id::text, 'email', 'mesero2@mareanegra.mx')::jsonb,
      'email', v_mesero2_id::text, now(), now(), now()
    ) ON CONFLICT DO NOTHING;
  ELSE
    SELECT id INTO v_mesero2_id FROM auth.users WHERE email = 'mesero2@mareanegra.mx';
  END IF;

  INSERT INTO public.profiles (id, nombre, email, rol, puesto, pin, telefono, activo)
  VALUES (v_mesero2_id, 'Ana Pérez', 'mesero2@mareanegra.mx', 'mesero', 'Mesera Terraza', '3333', '6693334455', true)
  ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    email = EXCLUDED.email,
    rol = EXCLUDED.rol,
    puesto = EXCLUDED.puesto,
    pin = EXCLUDED.pin,
    telefono = EXCLUDED.telefono,
    activo = true;


  -- --------------------------------------------------------------------------
  -- 4. ROL: COCINA (cocina@mareanegra.mx / Cocina123!)
  -- --------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cocina@mareanegra.mx') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_cocina_id, '00000000-0000-0000-0000-000000000000',
      'cocina@mareanegra.mx', crypt('Cocina123!', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nombre":"Chef Roberto","rol":"cocina"}'::jsonb,
      now(), now(), 'authenticated', 'authenticated'
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_cocina_id, v_cocina_id,
      json_build_object('sub', v_cocina_id::text, 'email', 'cocina@mareanegra.mx')::jsonb,
      'email', v_cocina_id::text, now(), now(), now()
    ) ON CONFLICT DO NOTHING;
  ELSE
    SELECT id INTO v_cocina_id FROM auth.users WHERE email = 'cocina@mareanegra.mx';
  END IF;

  INSERT INTO public.profiles (id, nombre, email, rol, puesto, pin, telefono, activo)
  VALUES (v_cocina_id, 'Chef Roberto', 'cocina@mareanegra.mx', 'cocina', 'Jefe de Cocina', '4444', '6694445566', true)
  ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    email = EXCLUDED.email,
    rol = EXCLUDED.rol,
    puesto = EXCLUDED.puesto,
    pin = EXCLUDED.pin,
    telefono = EXCLUDED.telefono,
    activo = true;

END $$;
