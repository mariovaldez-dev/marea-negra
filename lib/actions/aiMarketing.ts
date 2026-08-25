'use server'

import fs from 'fs'
import path from 'path'

export interface GenerarCopyOptions {
  objetivo: 'antojo_fin_de_semana' | 'cumpleanos' | 'reactivacion' | 'premio_disponible' | 'promo_cerveza' | 'resena_google' | 'personalizado'
  tono?: 'sinaloense_autentico' | 'urgente_promo' | 'vip_elegante'
  instruccionPersonalizada?: string
  platilloDestacado?: string
  descuento?: string
}

export interface CopyGenerado {
  id: string
  titulo: string
  mensaje: string
  origen: 'gemini_ai' | 'motor_local'
}

// Plantillas Locales Gastronómicas (100% offline, zero cloud)
const PLANTILLAS_LOCALES: Record<string, CopyGenerado[]> = {
  antojo_fin_de_semana: [
    {
      id: 'local_1',
      titulo: '🔥 Antojo Sinaloense de Fin de Semana',
      mensaje: '¡Qué onda, {nombre}! 🦐 Se siente el calorcito y en *Marea Negra* ya tenemos los camarones frescos y la salsa negra bien fría 🌶️🍻\n\nVen por tu aguachile favorito o pídelo a domicilio aquí: {enlace_menu}\n\n¡Te apartamos mesa o te lo mandamos volando! 🛵',
      origen: 'motor_local',
    },
    {
      id: 'local_2',
      titulo: '🦐 Plan de Mariscos con Amigos',
      mensaje: '¡Hola {nombre}! 🌊 El fin de semana sabe mejor con unos buenos mariscos de *Marea Negra*. Recuerda que con cada pedido sumas sellos en tu tarjeta VIP (llevas {sellos} sellos) 💳⭐\n\nOrdena aquí: {enlace_menu}',
      origen: 'motor_local',
    },
  ],
  cumpleanos: [
    {
      id: 'local_cumple_1',
      titulo: '🎂 Festejo VIP de Cumpleaños',
      mensaje: '🎉 ¡FELIZ CUMPLEAÑOS, {nombre}! 🎂 En *Marea Negra* queremos festejarte como te mereces 🦐✨\n\nEn tu próxima visita o pedido tienes una *Tostada de Callo o Bebida de la Casa de Cortesía* mostrando tu tarjeta VIP 🎁\n\nConsulta tu regalo aquí: {enlace_tarjeta}',
      origen: 'motor_local',
    },
  ],
  reactivacion: [
    {
      id: 'local_reactiva_1',
      titulo: '😴 Te extrañamos en Marea Negra',
      mensaje: '¡Qué tal, {nombre}! 🦐 Hace días no te vemos por *Marea Negra* y se te extraña en la mesa.\n\nPara que te animes a volver, te dejamos este *10% de descuento* en tu siguiente orden de aguachiles usando tu código de socio VIP 🌶️\n\nPide directo aquí: {enlace_menu}',
      origen: 'motor_local',
    },
  ],
  premio_disponible: [
    {
      id: 'local_premio_1',
      titulo: '🎁 Tu Platillo Gratis está Listo',
      mensaje: '¡Felicidades, {nombre}! 🏆 Ya acumulaste tus sellos y tienes un *{premio} COMPLETAMENTE GRATIS* esperándote en *Marea Negra* 🦐✨\n\nVen a disfrutarlo hoy o muestra tu QR al mesero: {enlace_tarjeta}',
      origen: 'motor_local',
    },
  ],
  promo_cerveza: [
    {
      id: 'local_promo_1',
      titulo: '🍻 Promo Sed de la Buena',
      mensaje: '¡{nombre}, hoy se antoja botanear con ganas! 🌶️🍻 En la compra de tu Aguachile Negro te llevas tu cerveza bien helada a precio especial en *Marea Negra* 🦐\n\n¿Te apartamos mesa o te lo enviamos? {enlace_menu}',
      origen: 'motor_local',
    },
  ],
  resena_google: [
    {
      id: 'local_review_1',
      titulo: '⭐ Reseña en Google Maps (+5 Estrellas)',
      mensaje: '¡Hola {nombre}! 🦐 Muchas gracias por visitarnos en *Marea Negra*. ¿Qué tal estuvo tu experiencia y el sabor de tus mariscos hoy?\n\nSi nos dejas una reseña de 5 estrellas en Google Maps, ¡te regalamos un sello extra en tu tarjeta VIP para tu próximo platillo gratis! 🎁⭐\n\nCalifica aquí: {enlace_google_maps}',
      origen: 'motor_local',
    },
  ],
  personalizado: [
    {
      id: 'local_custom_1',
      titulo: '✨ Mensaje Especial Marea Negra',
      mensaje: '¡Hola {nombre}! 🦐 Te saludamos desde *Marea Negra*. Tenemos mariscos frescos del día listos para ti. Revisa el menú y acumula tus sellos VIP: {enlace_menu}',
      origen: 'motor_local',
    },
  ],
}

function getGeminiApiKey(): string {
  let key = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    ''
  ).trim()

  // Lectura en caliente desde archivos locales si no está en memoria
  if (!key && typeof process !== 'undefined' && process.cwd) {
    try {
      const rootDir = process.cwd()
      const envFiles = ['.env.local', '.env']
      for (const file of envFiles) {
        const fullPath = path.join(rootDir, file)
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8')
          const match = content.match(
            /(?:GEMINI_API_KEY|GOOGLE_AI_API_KEY|GOOGLE_API_KEY|NEXT_PUBLIC_GEMINI_API_KEY|GEMINI_KEY)\s*=\s*["']?([^"'\r\n]+)["']?/
          )
          if (match && match[1]) {
            key = match[1].trim()
            if (key) {
              process.env.GEMINI_API_KEY = key
              break
            }
          }
        }
      }
    } catch (e) { }
  }

  return key
}

// Limpiar unicode escapado para garantizar que los emojis viajen como UTF-8 real
function cleanEmojiText(text: string): string {
  if (!text) return ''
  try {
    return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
  } catch (e) {
    return text
  }
}

export async function generarCopysMarketing(options: GenerarCopyOptions): Promise<CopyGenerado[]> {
  const geminiApiKey = getGeminiApiKey()

  if (!geminiApiKey) {
    return PLANTILLAS_LOCALES[options.objetivo] || PLANTILLAS_LOCALES.antojo_fin_de_semana
  }

  try {
    const promptObjetivos: Record<string, string> = {
      antojo_fin_de_semana: 'Invitar al cliente a comer mariscos y aguachiles el fin de semana, destacando frescura y sabor sinaloense.',
      cumpleanos: 'Felicitar al cliente por su cumpleaños y avisarle que tiene una cortesía especial (tostada o bebida) en su visita.',
      reactivacion: 'Reactivar a un cliente que tiene más de 15 días sin ordenar, con un tono cálido, antojador y ofreciendo un incentivo.',
      premio_disponible: 'Notificarle con entusiasmo que ya completó sus sellos y tiene su platillo gratis listo para canjear con su tarjeta VIP.',
      promo_cerveza: 'Promoción de mariscos y cerveza bien helada para disfrutar en restaurante o a domicilio.',
      resena_google: 'Agradecer la visita del cliente y pedirle amablemente una reseña de 5 estrellas en Google Maps a cambio de un beneficio exclusivo en su tarjeta VIP.',
      personalizado: options.instruccionPersonalizada || 'Mensaje de WhatsApp para clientes de marisquería.',
    }

    const systemPrompt = `Eres copywriter de "Marea Negra - Aguachiles" (Culiacán, Sinaloa, México).
Redacta 2 opciones cortas y vendedoras para WhatsApp.

REGLAS:
- NUNCA uses nombres reales.
- Usa etiquetas: {nombre}, {sellos}, {premio}, {enlace_menu}, {enlace_tarjeta}.
- Usa emojis reales de mariscos: 🦐, 🌶️, 🍻, 🍋, 🥑, ✨, 💳.
- Tono: ${options.tono === 'sinaloense_autentico' ? 'Cálido sinaloense, alegre y antojador' : options.tono === 'vip_elegante' ? 'VIP y exclusivo' : 'Urgente y directo'}.
- Objetivo: ${promptObjetivos[options.objetivo]}
${options.platilloDestacado ? `- Platillo: ${options.platilloDestacado}` : ''}
${options.descuento ? `- Promo: ${options.descuento}` : ''}

Responde SOLO este JSON:
{
  "copys": [
    { "titulo": "Título con emoji", "mensaje": "Mensaje WhatsApp" },
    { "titulo": "Título opción 2", "mensaje": "Mensaje WhatsApp" }
  ]
}`

    // Obtener el identificador exacto de modelo FLASH recomendado por Google
    let modeloId = 'gemini-3.6-flash'
    try {
      const listResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`
      )
      if (listResp.ok) {
        const listData = await listResp.json()
        const models: any[] = listData.models || []
        
        // Priorizar modelos Flash recomendados por Google
        const flashModels = models.filter(
          (m) =>
            m.supportedGenerationMethods?.includes('generateContent') &&
            m.name?.toLowerCase().includes('flash') &&
            !m.name?.toLowerCase().includes('pro')
        )

        const found =
          flashModels.find((m) => m.name?.includes('3.6-flash')) ||
          flashModels.find((m) => m.name?.includes('2.0-flash')) ||
          flashModels.find((m) => m.name?.includes('1.5-flash-8b')) ||
          flashModels.find((m) => m.name?.includes('1.5-flash')) ||
          flashModels[0] ||
          models.find((m) => m.supportedGenerationMethods?.includes('generateContent'))

        if (found && found.name) {
          modeloId = found.name.replace('models/', '')
        }
      }
    } catch (e) {}

    let rawText: string | null = null

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modeloId}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 350,
            },
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || null
      } else {
        const errBody = await response.text()
        console.error(`[Gemini AI Error - ${modeloId}]`, response.status, errBody)
      }
    } catch (fetchErr: any) {
      console.error('[Gemini AI Fetch Error]', fetchErr?.message || fetchErr)
    }

    if (!rawText) {
      return PLANTILLAS_LOCALES[options.objetivo] || PLANTILLAS_LOCALES.antojo_fin_de_semana
    }

    // Limpiar markdown si el modelo incluyó ```json ... ```
    let cleanJson = rawText.trim()
    const jsonMatch = cleanJson.match(/```(?:json)?([\s\S]*?)```/)
    if (jsonMatch) {
      cleanJson = jsonMatch[1].trim()
    }

    const parsed = JSON.parse(cleanJson)
    if (Array.isArray(parsed.copys) && parsed.copys.length > 0) {
      return parsed.copys.map((c: any, index: number) => ({
        id: `gemini_${index}_${Date.now()}`,
        titulo: cleanEmojiText(c.titulo || 'Opción IA 🦐'),
        mensaje: cleanEmojiText(c.mensaje || ''),
        origen: 'gemini_ai',
      }))
    }

    return PLANTILLAS_LOCALES[options.objetivo] || PLANTILLAS_LOCALES.antojo_fin_de_semana
  } catch (err: any) {
    return PLANTILLAS_LOCALES[options.objetivo] || PLANTILLAS_LOCALES.antojo_fin_de_semana
  }
}

// Comprobar si la API key de Gemini está cargada en el servidor
export async function checkGeminiStatus(): Promise<{
  connected: boolean
  mensaje: string
}> {
  const geminiApiKey = getGeminiApiKey()

  if (!geminiApiKey) {
    return {
      connected: false,
      mensaje: 'API Key no detectada. Asegúrate de guardarla en tu archivo .env.local o .env como GEMINI_API_KEY.',
    }
  }

  return {
    connected: true,
    mensaje: '✨ IA de Gemini conectada y lista.',
  }
}
