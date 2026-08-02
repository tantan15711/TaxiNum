import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function LegalPage() {
  return (
    <main className="legal-page">
      <section className="legal-document enter-up">
        <div className="legal-header">
          <div className="brand-mark">TN</div>
          <div>
            <p className="eyebrow">TaxiNum</p>
            <h1>Terminos y privacidad</h1>
          </div>
        </div>

        <Link className="legal-return" href="/">
          <ShieldCheck size={18} />
          Aceptar y volver al registro
        </Link>

        <article className="legal-section">
          <h2>Terminos y condiciones</h2>
          <p>
            TaxiNum es una herramienta digital que permite a taxistas mostrar un
            numero de cuenta, CLABE u otro dato de transferencia mediante un
            enlace publico y codigo QR.
          </p>
          <p>
            TaxiNum no es una institucion bancaria, no procesa pagos, no retiene
            dinero, no verifica transferencias y no garantiza que una
            transferencia haya sido realizada correctamente.
          </p>
          <p>
            El taxista es responsable de revisar, actualizar, ocultar o eliminar
            el numero de transferencia que decida publicar en su perfil. El uso
            de TaxiNum es bajo responsabilidad del usuario.
          </p>
          <p>
            TaxiNum no se hace responsable por errores en el numero proporcionado
            por el taxista, transferencias realizadas a cuentas incorrectas,
            fraudes, comprobantes falsos, fallas de conexion, mal uso del codigo
            QR, impresion incorrecta del QR o cualquier dano derivado del uso de
            la plataforma, salvo en los casos en que la ley aplicable establezca
            lo contrario.
          </p>
          <p>
            El taxista puede editar, ocultar o eliminar sus datos desde su cuenta
            en cualquier momento.
          </p>
        </article>

        <article className="legal-section">
          <h2>Aviso de privacidad</h2>
          <p>
            TaxiNum recopila unicamente los datos necesarios para operar la
            cuenta del taxista: nombre publico, foto de perfil, correo asociado
            a Google, numero de cuenta, CLABE u otro dato de transferencia,
            telefono opcional y preferencia de visibilidad del telefono.
          </p>
          <p>
            El numero de cuenta, CLABE o dato de transferencia sera visible
            publicamente cuando el taxista active o use su perfil publico
            mediante enlace o codigo QR. El telefono solo sera visible si el
            taxista decide mostrarlo.
          </p>
          <p>
            TaxiNum usa estos datos para crear el perfil publico del taxista,
            generar su codigo QR, permitir la edicion del perfil y facilitar que
            los clientes copien el dato de transferencia.
          </p>
          <p>
            El usuario puede modificar o eliminar sus datos desde su cuenta.
            Tambien puede solicitar la eliminacion de su cuenta y datos
            asociados.
          </p>
        </article>

        <p className="legal-footnote">
          Este texto es una base operativa para el MVP y debe revisarse con
          asesoria legal antes de publicar el servicio comercialmente.
        </p>
      </section>
    </main>
  );
}

