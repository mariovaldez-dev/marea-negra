-- ==============================================================================
-- LIMPIEZA DE USUARIOS INCOMPLETOS EN AUTH
-- Esto repara el estado interno de Supabase Auth (GoTrue)
-- ==============================================================================

-- 1. Eliminar identidades corruptas
DELETE FROM auth.identities 
WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
) OR identity_data->>'email' IN (
  'cajero@mareanegra.mx',
  'mesero@mareanegra.mx',
  'mesero2@mareanegra.mx',
  'cocina@mareanegra.mx'
);

-- 2. Eliminar usuarios huérfanos de auth.users
DELETE FROM auth.users 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
) OR email IN (
  'cajero@mareanegra.mx',
  'mesero@mareanegra.mx',
  'mesero2@mareanegra.mx',
  'cocina@mareanegra.mx'
);

-- 3. Limpiar perfiles temporales
DELETE FROM public.profiles 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
) OR email IN (
  'cajero@mareanegra.mx',
  'mesero@mareanegra.mx',
  'mesero2@mareanegra.mx',
  'cocina@mareanegra.mx'
);
