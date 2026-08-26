import LegalPage from '@/components/legal/LegalPage';

export const metadata = { title: 'Política de Privacidad — Hekko' };

// Texto base: revísalo/ajústalo (o hazlo revisar por un abogado) según tu negocio.
export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de Privacidad" updated="2026-08-25">
      <p>
        Esta política explica qué datos trata Hekko en su plataforma de seguimiento de proyectos,
        con qué fin y cómo puedes ejercer tus derechos.
      </p>

      <h2>1. Datos que tratamos</h2>
      <p>
        <strong>Del equipo de Hekko:</strong> nombre, correo electrónico, teléfono/WhatsApp y
        contraseña (almacenada cifrada). <strong>De los clientes:</strong> nombre, WhatsApp,
        nombre del proyecto, servicio contratado, y los archivos (imágenes, video, notas de voz,
        documentos) que se adjunten a cada orden.
      </p>

      <h2>2. Para qué los usamos</h2>
      <p>
        Para prestar el servicio contratado: gestionar las órdenes, mostrar el avance del proyecto
        al cliente mediante un enlace, y permitir el envío de mensajes por WhatsApp desde el
        dispositivo del equipo.
      </p>

      <h2>3. Con quién se comparten</h2>
      <p>
        No vendemos tus datos. Se procesan en los proveedores de infraestructura (Vercel y
        Supabase) necesarios para operar la Plataforma. Los mensajes de WhatsApp se envían desde
        el propio dispositivo del equipo, usando su app de WhatsApp.
      </p>

      <h2>4. Enlace de seguimiento del cliente</h2>
      <p>
        El seguimiento se comparte mediante un enlace con un identificador aleatorio. Quien tenga
        el enlace puede ver el estado y los archivos de esa orden. Compártelo solo con el cliente
        correspondiente.
      </p>

      <h2>5. Conservación y eliminación</h2>
      <p>
        Los datos de una orden se conservan mientras el proyecto esté activo y durante el tiempo
        necesario para cumplir obligaciones legales o contractuales. Al eliminar una orden se
        borran de forma permanente sus etapas y archivos adjuntos.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Usamos cookies estrictamente necesarias para mantener la sesión iniciada. No usamos
        cookies de publicidad ni de seguimiento de terceros.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Aplicamos medidas razonables para proteger la información (control de acceso por rol,
        cifrado de contraseñas, conexiones seguras). Ningún sistema es 100% infalible.
      </p>

      <h2>8. Tus derechos y contacto</h2>
      <p>
        Puedes solicitar acceso, corrección o eliminación de tus datos escribiendo a
        medios.hekkoestudio@gmail.com.
      </p>
    </LegalPage>
  );
}
