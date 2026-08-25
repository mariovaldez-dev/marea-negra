'use server'

export async function probarEnvioMetaWhatsApp(telefonoDestino: string) {
  const cleanPhone = telefonoDestino.replace(/\D/g, '')
  const targetPhone = cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`

  const apiToken = process.env.WHATSAPP_API_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID

  if (!apiToken || !phoneId) {
    return {
      success: false,
      error: 'Faltan las variables WHATSAPP_API_TOKEN o WHATSAPP_PHONE_ID en tu archivo .env',
      details: { hasToken: !!apiToken, hasPhoneId: !!phoneId },
    }
  }

  try {
    // 1. Intentar enviar primero con la plantilla oficial 'hello_world' de Meta
    // Meta exige enviar una plantilla (Template) cuando es la primera vez que se contacta al usuario
    const templateResponse = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: targetPhone,
        type: 'template',
        template: {
          name: 'hello_world',
          language: {
            code: 'en_US',
          },
        },
      }),
    })

    const templateData = await templateResponse.json()

    if (templateResponse.ok) {
      return {
        success: true,
        data: templateData,
        message: '¡Mensaje oficial de prueba de Meta entregado exitosamente a tu WhatsApp!',
      }
    }

    // 2. Si la plantilla falla, intentar como texto directo
    const textResponse = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: targetPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: '🌊 ¡Prueba de Marea Negra - Aguachiles! 🦐 Conexión oficial de WhatsApp establecida con éxito.',
        },
      }),
    })

    const textData = await textResponse.json()

    if (textResponse.ok) {
      return {
        success: true,
        data: textData,
        message: '¡Mensaje de texto enviado exitosamente a tu WhatsApp!',
      }
    } else {
      let friendlyError = 'Meta rechazó el mensaje.'
      if (textData.error?.code === 131030) {
        friendlyError =
          'Tu número de celular aún no está verificado en la lista de prueba de Meta. En Meta for Developers > WhatsApp > Configuración de la API, selecciona tu número en el campo "Para (To)".'
      } else if (textData.error?.code === 190) {
        friendlyError = 'El Token de acceso de Meta expiró o es inválido.'
      }

      return {
        success: false,
        error: friendlyError,
        rawError: textData.error || templateData.error,
      }
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error de red al conectar con los servidores de Meta.',
    }
  }
}
