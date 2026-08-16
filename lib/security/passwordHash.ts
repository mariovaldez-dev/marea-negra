import crypto from 'crypto'

/**
 * Genera un Hash criptográfico seguro con PBKDF2 + SHA512 + Salt de 16 bytes.
 * Estándar internacional de ciberseguridad bancaria.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verifica si una contraseña coincide con el hash encriptado con tiempo constante para prevenir Timing Attacks.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) {
    // Si la cuenta vieja tenía contraseña plana sin hash, comparar en texto plano de forma segura o migrar
    return false
  }

  try {
    const [salt, originalHash] = storedHash.split(':')
    const hashToTest = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')

    const bufOriginal = Buffer.from(originalHash, 'hex')
    const bufTest = Buffer.from(hashToTest, 'hex')

    if (bufOriginal.length !== bufTest.length) return false
    return crypto.timingSafeEqual(bufOriginal, bufTest)
  } catch (e) {
    return false
  }
}

/**
 * Valida la fortaleza de la contraseña en tiempo real:
 * - Mínimo 8 caracteres
 * - Al menos 1 letra mayúscula (A-Z)
 * - Al menos 1 letra minúscula (a-z)
 * - Al menos 1 número (0-9)
 */
export function validatePasswordStrength(password: string) {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  let score = 0
  if (hasMinLength) score++
  if (hasUppercase) score++
  if (hasLowercase) score++
  if (hasNumber) score++

  return {
    isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    score, // 0 a 4
  }
}
