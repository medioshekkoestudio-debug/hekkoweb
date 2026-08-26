import LegalPage from '@/components/legal/LegalPage';

export const metadata = { title: 'Términos y Condiciones — Hekko' };

// Texto base: revísalo/ajústalo (o hazlo revisar por un abogado) según tu negocio.
export default function TerminosPage() {
  return (
    <LegalPage title="Términos y Condiciones" updated="2026-08-25">
      <p>
        Al usar la plataforma de seguimiento de Hekko (la &quot;Plataforma&quot;) aceptas estos
        Términos. Si no estás de acuerdo, no uses el servicio.
      </p>

      <h2>1. El servicio</h2>
      <p>
        Hekko es un estudio de estrategas de marketing que ofrece servicios de diseño gráfico,
        marketing y desarrollo web. Esta Plataforma es la herramienta con la que gestionamos las
        órdenes de nuestros clientes y compartimos el avance de cada proyecto. El servicio se
        ofrece &quot;tal cual&quot;, pudiendo cambiar o mejorar sus funciones con el tiempo.
      </p>

      <h2>2. Cuentas de acceso</h2>
      <p>
        Las cuentas del equipo (administración y estrategas) las crea y administra Hekko. Cada
        persona es responsable de la seguridad de su contraseña y de la actividad realizada con
        su cuenta. Los clientes no necesitan cuenta: acceden al seguimiento de su proyecto
        mediante un enlace privado.
      </p>

      <h2>3. Enlace de seguimiento</h2>
      <p>
        Cada orden genera un enlace único que permite ver el avance del proyecto sin iniciar
        sesión. Quien tenga el enlace puede ver esa información, así que compártelo únicamente
        con el cliente correspondiente.
      </p>

      <h2>4. Uso correcto</h2>
      <p>
        Te comprometes a no usar la Plataforma para fines ilícitos, a no subir contenido que
        infrinja derechos de terceros y a no intentar vulnerar su seguridad.
      </p>

      <h2>5. Datos de los clientes</h2>
      <p>
        Al cargar datos de un cliente (nombre, WhatsApp, materiales del proyecto, archivos, etc.)
        el equipo declara contar con su consentimiento. Hekko trata esos datos únicamente para
        prestar el servicio contratado.
      </p>

      <h2>6. Entregables y propiedad</h2>
      <p>
        Los archivos que se comparten en el seguimiento son avances del trabajo contratado. Las
        condiciones de entrega, uso y cesión de derechos sobre los entregables finales se rigen
        por el acuerdo comercial firmado con cada cliente.
      </p>

      <h2>7. Disponibilidad y responsabilidad</h2>
      <p>
        Hacemos esfuerzos razonables para mantener el servicio disponible, pero no garantizamos
        que sea ininterrumpido o libre de errores. En la medida permitida por la ley, no somos
        responsables por pérdidas indirectas derivadas del uso del servicio.
      </p>

      <h2>8. Contacto</h2>
      <p>Para dudas sobre estos Términos, escríbenos a medios.hekkoestudio@gmail.com.</p>
    </LegalPage>
  );
}
