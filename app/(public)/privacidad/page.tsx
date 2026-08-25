'use client'

import React from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowLeft, MessageCircle } from 'lucide-react'
import { useWhatsAppSupport } from '@/lib/hooks/useWhatsAppSupport'

export default function PrivacidadPage() {
  const { solicitarBajaPrivacidad } = useWhatsAppSupport()

  return (
    <div className="min-h-screen bg-[#F4F0E8] dark:bg-[#080808] text-negro dark:text-blanco transition-colors py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Botón de Regreso */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-arena hover:text-coral transition-colors bg-white dark:bg-carbon px-4 py-2 rounded-full border border-arena/30 dark:border-arena/10 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Menú Principal</span>
          </Link>
        </div>

        {/* Encabezado */}
        <div className="flex flex-col gap-3 border-b border-arena/30 dark:border-arena/10 pb-6">
          <div className="flex items-center gap-2 text-xs font-sans font-bold tracking-widest text-turquesa uppercase">
            <ShieldCheck className="w-4 h-4 text-turquesa" />
            <span>PROTECCIÓN DE DATOS PERSONALES</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-negro dark:text-blanco tracking-wide">
            AVISO DE PRIVACIDAD INTEGRAL
          </h1>
          <p className="font-serif italic text-sm text-negro/70 dark:text-arena/70">
            Marea Negra - Aguachiles · Sinaloa, México · Última actualización: Agosto 2026
          </p>
        </div>

        {/* Contenido del Aviso */}
        <div className="bg-white dark:bg-[#0C0A08] bg-dots-pattern border border-arena/30 dark:border-oro/20 rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col gap-8 leading-relaxed font-sans text-sm text-negro/80 dark:text-arena/90">
          {/* 1. Responsable */}
          <section className="flex flex-col gap-2">
            <h2 className="font-display text-2xl text-negro dark:text-blanco flex items-center gap-2">
              <span className="text-coral">1.</span> Responsable del Tratamiento de Datos
            </h2>
            <p>
              <strong>Marea Negra - Aguachiles</strong> (en adelante "Marea Negra"), con domicilio de operación en Sinaloa, México, es el responsable del uso, almacenamiento y protección de sus datos personales, en estricto apego a la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> y su Reglamento.
            </p>
          </section>

          {/* 2. Datos que Recabamos */}
          <section className="flex flex-col gap-2">
            <h2 className="font-display text-2xl text-negro dark:text-blanco flex items-center gap-2">
              <span className="text-coral">2.</span> Datos Personales que Recabamos
            </h2>
            <p>
              Para brindarle nuestros servicios gastronómicos y beneficios de fidelidad, podemos recabar los siguientes datos de contacto e identificación:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li><strong>Nombre y apellido</strong> (para identificar sus pedidos, reservas de mesas y titularidad de la tarjeta VIP).</li>
              <li><strong>Número de teléfono móvil (WhatsApp)</strong> (para envío de confirmaciones de comanda, estatus de entrega y promociones exclusivas).</li>
              <li><strong>Fecha de nacimiento / cumpleaños</strong> (opcional, exclusivamente para otorgarle cortesías y regalos en su mes de festejo).</li>
              <li><strong>Historial de pedidos y sellos acumulados</strong> (para la entrega de premios y platillos gratuitos del Club de Lealtad).</li>
            </ul>
            <p className="text-xs text-negro/60 dark:text-arena/60 italic mt-1">
              * Marea Negra <strong>NO</strong> solicita ni almacena datos personales sensibles, números de tarjetas de crédito o débito ni contraseñas bancarias.
            </p>
          </section>

          {/* 3. Finalidad del Tratamiento */}
          <section className="flex flex-col gap-2">
            <h2 className="font-display text-2xl text-negro dark:text-blanco flex items-center gap-2">
              <span className="text-coral">3.</span> Finalidades del Uso de sus Datos
            </h2>
            <p>Sus datos personales son utilizados para las siguientes finalidades primarias y necesarias:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
              <div className="p-3 bg-arena/10 dark:bg-carbon rounded-xl border border-arena/20">
                <span className="font-bold text-coral text-xs uppercase block mb-1">Finalidades Operativas</span>
                <span className="text-xs">Recepción, preparación en cocina y entrega de pedidos en restaurante o a domicilio, así como atención de dudas por WhatsApp.</span>
              </div>
              <div className="p-3 bg-arena/10 dark:bg-carbon rounded-xl border border-arena/20">
                <span className="font-bold text-oro text-xs uppercase block mb-1">Club de Lealtad VIP</span>
                <span className="text-xs">Registro y validación de sellos por consumo, canje de platillos gratis y promociones de cortesía de cumpleaños.</span>
              </div>
            </div>
          </section>

          {/* 4. No Transferencia a Terceros */}
          <section className="flex flex-col gap-2">
            <h2 className="font-display text-2xl text-negro dark:text-blanco flex items-center gap-2">
              <span className="text-coral">4.</span> Compromiso de Confidencialidad y No Transferencia
            </h2>
            <p>
              En Marea Negra valoramos y respetamos su confianza. <strong>Bajo ninguna circunstancia vendemos, alquilamos ni transferimos sus datos personales a terceros</strong>, agencias de publicidad o empresas externas para fines mercadológicos no relacionados con nuestro restaurante.
            </p>
          </section>

          {/* 5. Derechos ARCO */}
          <section className="flex flex-col gap-2">
            <h2 className="font-display text-2xl text-negro dark:text-blanco flex items-center gap-2">
              <span className="text-coral">5.</span> Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
            </h2>
            <p>
              Usted tiene el derecho en todo momento de acceder a sus datos personales, solicitar su corrección si están desactualizados, oponerse al envío de mensajes o solicitar la eliminación total de su registro del Club de Lealtad.
            </p>
            <div className="p-4 bg-turquesa/10 border border-turquesa/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
              <div>
                <span className="font-bold text-turquesa text-xs uppercase block">¿Deseas darte de baja o actualizar tus datos?</span>
                <span className="text-xs">Toca el botón para enviar un mensaje directo a la administración de Marea Negra solicitando tu baja o actualización.</span>
              </div>
              <button
                type="button"
                onClick={solicitarBajaPrivacidad}
                className="bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs py-3 px-5 rounded-xl transition-all shrink-0 text-center flex items-center justify-center gap-2 shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Solicitar Baja por WhatsApp</span>
              </button>
            </div>
          </section>

          {/* 6. Seguridad y Encriptación */}
          <section className="flex flex-col gap-2">
            <h2 className="font-display text-2xl text-negro dark:text-blanco flex items-center gap-2">
              <span className="text-coral">6.</span> Medidas de Seguridad de la Información
            </h2>
            <p>
              Marea Negra implementa estrictas medidas de seguridad técnicas, físicas y administrativas, incluyendo cifrado en tránsito HTTPS (SSL/TLS), políticas de seguridad a nivel de base de datos (Row Level Security en PostgreSQL) y restricción de acceso con credenciales seguras para evitar el acceso no autorizado o mal uso de la información.
            </p>
          </section>
        </div>

        {/* Pie */}
        <div className="text-center text-xs font-sans text-negro/50 dark:text-arena/50 pb-8">
          © {new Date().getFullYear()} Marea Negra - Aguachiles. Todos los derechos reservados. Sinaloa, México.
        </div>
      </div>
    </div>
  )
}
