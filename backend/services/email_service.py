import os
import smtplib
import logging
import json
import urllib.request
import urllib.error
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import FRONTEND_URL, get_clean_env

logger = logging.getLogger("EmailService")

def send_via_resend_api(api_key: str, to_email: str, subject: str, html_content: str, text_content: str, from_sender: str = None) -> tuple[bool, str]:
    """
    Envía correos electrónicos a través de la API REST oficial de Resend (HTTPS puerto 443).
    A diferencia de SMTP tradicional (puertos 587/465), el puerto 443 nunca es bloqueado por Render Free Tier.
    """
    try:
        # Si el usuario configura un dominio verificado propio en RESEND_FROM_EMAIL
        custom_from = get_clean_env("RESEND_FROM_EMAIL", "").strip()
        if custom_from and "@" in custom_from and not ("jardinesdelcerro.com" in custom_from or "gmail.com" in custom_from):
            sender = custom_from
        else:
            # En modo de prueba sin dominio propio, Resend requiere usar obligatoriamente 'onboarding@resend.dev'
            sender = "Torre Residencial Jardines del Cerro IV <onboarding@resend.dev>"

        payload = {
            "from": sender,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
            "text": text_content
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=data,
            headers={
                "Authorization": f"Bearer {api_key.strip()}",
                "Content-Type": "application/json",
                "User-Agent": "JardinesDelCerro/2.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
            print(f"[EmailService] ✓ Correo enviado exitosamente vía Resend HTTP API (ID: {resp_data.get('id')}).")
            return True, None
    except urllib.error.HTTPError as he:
        err_body = he.read().decode("utf-8") if he.fp else str(he)
        if "domain is not verified" in err_body or "only send testing emails" in err_body:
            msg = (
                "Aviso de Resend: En modo de prueba gratuito (sin dominio personalizado propio), "
                "Resend permite enviar correos de prueba únicamente al correo con el que te registraste en Resend. "
                "Para enviar correos a cualquier inquilino externo, Resend requiere agregar un dominio propio en resend.com/domains."
            )
        else:
            msg = f"Resend API Error (HTTP {he.code}): {err_body}"
        print(f"[EmailService] ✕ {msg}")
        return False, msg
    except Exception as e:
        msg = f"Resend Error ({type(e).__name__}): {str(e)}"
        print(f"[EmailService] ✕ {msg}")
        return False, msg

def send_via_brevo_api(api_key: str, sender_email: str, to_email: str, subject: str, html_content: str, text_content: str) -> tuple[bool, str]:
    """
    Envía correos electrónicos a CUALQUIER destinatario externo a través de la API REST oficial de Brevo (HTTPS puerto 443).
    A diferencia de Resend, Brevo NO exige comprar un dominio propio; permite verificar directamente
    un correo personal (Single Sender, ej. tu cuenta de Gmail) y enviar hasta 300 correos diarios a cualquier persona.
    """
    try:
        payload = {
            "sender": {
                "name": "Torre Residencial Jardines del Cerro IV",
                "email": sender_email.strip()
            },
            "to": [{"email": to_email.strip()}],
            "subject": subject,
            "htmlContent": html_content,
            "textContent": text_content
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=data,
            headers={
                "api-key": api_key.strip(),
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "JardinesDelCerro/2.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
            msg_id = resp_data.get("messageId") or resp_data.get("id") or "OK"
            print(f"[EmailService] ✓ Correo entregado exitosamente vía Brevo API a {to_email} (ID: {msg_id}).")
            return True, None
    except urllib.error.HTTPError as he:
        err_body = he.read().decode("utf-8") if he.fp else str(he)
        msg = f"Brevo API Error (HTTP {he.code}): {err_body}"
        print(f"[EmailService] ✕ {msg}")
        return False, msg
    except Exception as e:
        msg = f"Brevo Error ({type(e).__name__}): {str(e)}"
        print(f"[EmailService] ✕ {msg}")
        return False, msg


def resolve_smtp_config():
    """
    Obtiene la configuración SMTP en tiempo real desde las variables de entorno de Render,
    garantizando tolerancia ante espacios accidentales, comillas o claves con variaciones.
    """
    host = get_clean_env("SMTP_HOST", "smtp.gmail.com")
    try:
        port = int(get_clean_env("SMTP_PORT", "587"))
    except Exception:
        port = 587
    user = (
        get_clean_env("SMTP_USER", "")
        or get_clean_env("SMTP_USERNAME", "")
        or get_clean_env("EMAIL_USER", "")
        or get_clean_env("MAIL_USER", "")
        or get_clean_env("GMAIL_USER", "")
    )
    raw_pass = (
        get_clean_env("SMTP_PASS", "")
        or get_clean_env("SMTP_PASSWORD", "")
        or get_clean_env("EMAIL_PASS", "")
        or get_clean_env("EMAIL_PASSWORD", "")
        or get_clean_env("MAIL_PASSWORD", "")
        or get_clean_env("GMAIL_PASS", "")
    )
    # Para Gmail o contraseñas de aplicación (16 caracteres 'xxxx xxxx xxxx xxxx'), eliminar todos los espacios y guiones
    password = raw_pass.replace(" ", "").replace("-", "").strip()
    from_email = (
        get_clean_env("SMTP_FROM", "")
        or get_clean_env("EMAIL_FROM", "")
        or user
        or "notificaciones@jardinesdelcerro.com"
    )
    return host, port, user, password, from_email

def send_registration_decision_email(
    applicant_name: str,
    recipient_email: str,
    unit: str,
    role_label: str,
    action: str,  # "approve" | "reject"
    req_id: str
) -> dict:
    """
    Envía una notificación oficial por correo electrónico al inquilino o copropietario
    tras la decisión de auditoría del administrador (Aprobación o Rechazo).
    Utiliza SMTP estándar (Gmail, Brevo, SendGrid, Mailgun) o emulación segura en logs.
    """
    is_approved = (action == "approve")
    
    if is_approved:
        subject = f"🎉 Solicitud Aprobada — Acceso Habilitado a Jardines del Cerro IV (Unidad {unit})"
        status_title = "¡Tu solicitud ha sido aprobada!"
        status_color = "#059669"
        badge_text = "SOLICITUD APROBADA & CUENTA ACTIVA"
        body_paragraph = f"""
        Nos complace informarte que la administración de la <strong>Torre Residencial Jardines del Cerro IV</strong> 
        ha concluido satisfactoriamente la auditoría de tu expediente y contrato notariado para la 
        <strong>Unidad Residencial {unit}</strong> en calidad de <strong>{role_label}</strong>.
        <br><br>
        Tus credenciales de acceso oficial han sido <strong>activadas en el sistema</strong>. A partir de este momento 
        puedes iniciar sesión en el Portal de Residentes con tu correo electrónico o documento de identidad para:
        <ul>
            <li>Gestionar el pago de cuotas condominales y comprobantes fiscales NCF.</li>
            <li>Reservar áreas sociales (Piscina Infinity, Salón Social, Cancha de Pádel).</li>
            <li>Consultar estados de cuenta transparentes y asambleas.</li>
            <li>Interactuar con el Asistente IA Condominal privado.</li>
        </ul>
        """
        cta_text = "Iniciar Sesión en el Portal"
        cta_url = f"{FRONTEND_URL}#resident"
    else:
        subject = f"⚠️ Notificación sobre tu Solicitud de Acceso — Jardines del Cerro IV (Expediente {req_id})"
        status_title = "Actualización sobre tu Solicitud de Acceso"
        status_color = "#DC2626"
        badge_text = "SOLICITUD NO APROBADA"
        body_paragraph = f"""
        Te informamos que tras la auditoría administrativa del expediente <strong>{req_id}</strong> referente a la 
        <strong>Unidad Residencial {unit}</strong>, la solicitud no ha podido ser aprobada en este momento.
        <br><br>
        <strong>Motivo de auditoría:</strong> El contrato notariado o los documentos adjuntos requieren verificación 
        adicional conforme a las normativas del Régimen de Condominio (Ley 5038) y las políticas de debida diligencia (Ley 155-17).
        <br><br>
        Para rectificar la documentación o recibir orientación personalizada, por favor comunícate con la 
        oficina de administración de la torre o radica una nueva solicitud con el contrato subsanado.
        """
        cta_text = "Contactar a la Administración"
        cta_url = f"{FRONTEND_URL}#contacto"

    # Plantilla HTML con diseño premium responsive
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #F5F5F4; color: #1C1917; }}
        .email-container {{ max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }}
        .header {{ background: #0E1614; padding: 32px 24px; text-align: center; color: #ffffff; }}
        .header h1 {{ font-size: 20px; font-weight: 800; margin: 0; letter-spacing: 0.5px; color: #C9A770; }}
        .header p {{ font-size: 12px; color: rgba(255,255,255,0.7); margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 1px; }}
        .body {{ padding: 32px 28px; }}
        .badge {{ display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; background: {status_color}15; color: {status_color}; margin-bottom: 16px; border: 1px solid {status_color}40; }}
        .title {{ font-size: 20px; font-weight: 800; color: #1C1917; margin: 0 0 16px 0; }}
        .details-box {{ background: #FAF5EE; border: 1px solid #E7E5E4; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; line-height: 1.6; }}
        .cta-btn {{ display: inline-block; background: {status_color}; color: #ffffff !important; padding: 12px 26px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13.5px; margin: 20px 0; text-align: center; }}
        .footer {{ background: #FAFAF9; padding: 20px; text-align: center; font-size: 11.5px; color: #78716C; border-top: 1px solid #E7E5E4; }}
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>TORRE RESIDENCIAL JARDINES DEL CERRO IV</h1>
          <p>Mao, Valverde, República Dominicana</p>
        </div>
        <div class="body">
          <span class="badge">{badge_text}</span>
          <h2 class="title">{status_title}</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #44403C;">
            Estimado(a) <strong>{applicant_name}</strong>,
          </p>
          <div style="font-size: 13.5px; line-height: 1.7; color: #44403C;">
            {body_paragraph}
          </div>
          <div class="details-box">
            <strong>Resumen del Expediente:</strong><br>
            • <strong>No. de Solicitud:</strong> {req_id}<br>
            • <strong>Unidad Residencial:</strong> Torre Jardines del Cerro IV - Unidad {unit}<br>
            • <strong>Calidad:</strong> {role_label}<br>
            • <strong>Correo Registrado:</strong> {recipient_email}
          </div>
          <div style="text-align: center;">
            <a href="{cta_url}" class="cta-btn">{cta_text}</a>
          </div>
        </div>
        <div class="footer">
          Torre Residencial Jardines del Cerro IV &copy; 2026. Todos los derechos reservados.<br>
          Administración Condominal Operada por Inversionisto S.R.L. · Tel: (809) 555-0199
        </div>
      </div>
    </body>
    </html>
    """

    # Texto plano alternativo
    plain_text = f"""
    TORRE RESIDENCIAL JARDINES DEL CERRO IV
    Mao, Valverde, República Dominicana

    Estimado(a) {applicant_name},

    {status_title}
    Expediente: {req_id}
    Unidad Residencial: {unit} ({role_label})

    {'Tu solicitud ha sido aprobada y tu cuenta se encuentra activa para iniciar sesión.' if is_approved else 'Tu solicitud requiere rectificación documental ante la administración.'}

    Accede al portal web: {cta_url}

    Administración Condominal Jardines del Cerro IV
    """

    # Intento de envío real vía SMTP si está configurado en el servidor
    sent_real = False
    error_msg = None

    smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from = resolve_smtp_config()
    smtp_keys_in_env = [k for k in os.environ.keys() if any(w in k.upper() for w in ["SMTP", "MAIL", "EMAIL", "GMAIL"])]
    all_custom_keys = [k for k in os.environ.keys() if not k.startswith(("_", "PYTHON", "PATH", "HOME", "LANG", "LC_", "PWD", "SHLVL", "HOSTNAME", "DEBIAN", "PORT", "LD_", "OLDPWD", "XDG_"))]

    # 1. Comprobar si existe API Key de Brevo (Permite enviar a CUALQUIER persona sin necesidad de comprar un dominio propio)
    brevo_api_key = get_clean_env("BREVO_API_KEY", "")
    brevo_sender = get_clean_env("BREVO_SENDER_EMAIL", "") or smtp_user or "dysordergames@gmail.com"

    # 2. Comprobar si existe API Key de Resend (HTTP REST sobre puerto 443)
    resend_api_key = get_clean_env("RESEND_API_KEY", "")

    if brevo_api_key:
        print(f"[EmailService] Enviando correo vía Brevo HTTP API (Remitente autorizado: {brevo_sender})...")
        brevo_ok, brevo_err = send_via_brevo_api(
            api_key=brevo_api_key,
            sender_email=brevo_sender,
            to_email=recipient_email,
            subject=subject,
            html_content=html_content,
            text_content=plain_text
        )
        if brevo_ok:
            sent_real = True
            logger.info(f"✓ Correo enviado exitosamente a {recipient_email} vía Brevo API.")
        else:
            error_msg = brevo_err

    elif resend_api_key:
        print("[EmailService] Enviando correo vía Resend HTTP API (Puerto 443)...")
        resend_ok, resend_err = send_via_resend_api(
            api_key=resend_api_key,
            to_email=recipient_email,
            subject=subject,
            html_content=html_content,
            text_content=plain_text
        )
        if resend_ok:
            sent_real = True
            logger.info(f"✓ Correo enviado exitosamente a {recipient_email} vía Resend API.")
        else:
            error_msg = resend_err

    # 2. Si no hay Resend API Key, intentar conexión directa vía SMTP tradicional
    elif smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            
            # Para Gmail y proveedores SMTP, el envelope sender debe coincidir con la cuenta autenticada
            sender_email = smtp_user if ("@gmail.com" in smtp_user.lower()) else (smtp_from or smtp_user)
            msg["From"] = f"Torre Residencial Jardines del Cerro IV <{sender_email}>"
            msg["To"] = recipient_email

            part1 = MIMEText(plain_text, "plain", "utf-8")
            part2 = MIMEText(html_content, "html", "utf-8")
            msg.attach(part1)
            msg.attach(part2)

            print(f"[EmailService] Intentando conectar a {smtp_host}:{smtp_port} con usuario {smtp_user}...")

            if smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12) as server:
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(sender_email, [recipient_email], msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(sender_email, [recipient_email], msg.as_string())
            
            sent_real = True
            print(f"[EmailService] ✓ Correo enviado exitosamente a {recipient_email} vía SMTP.")
            logger.info(f"✓ Correo enviado exitosamente a {recipient_email} vía SMTP.")
        except smtplib.SMTPAuthenticationError as auth_err:
            error_msg = f"Error de autenticación SMTP (Código {auth_err.smtp_code}): Las credenciales de Gmail/SMTP fueron rechazadas. Revisa que tu clave de aplicación sea una Contraseña de Aplicación de 16 letras de Google y no tu contraseña personal."
            print(f"[EmailService] ✕ {error_msg}")
            logger.warning(error_msg)
        except Exception as e:
            raw_err = f"{type(e).__name__}: {str(e)}"
            if "Network is unreachable" in raw_err or "101" in raw_err or "timed out" in raw_err.lower():
                error_msg = (
                    "Render Free Tier bloquea los puertos SMTP salientes (587 y 465) por política de firewall anti-spam.\n\n"
                    "💡 Solución recomendada (100% gratuita y toma 1 minuto):\n"
                    "1. Crea una cuenta gratuita en https://resend.com (sin tarjeta).\n"
                    "2. En Resend, copia tu API Key (ej. 're_123456...').\n"
                    "3. En tu servicio de Render, agrega la variable: RESEND_API_KEY con esa clave.\n\n"
                    "Resend envía los correos vía HTTPS (puerto 443), el cual Render NUNCA bloquea."
                )
            else:
                error_msg = raw_err
            print(f"[EmailService] ✕ Error al enviar correo ({error_msg}).")
            logger.warning(f"Error al enviar correo ({error_msg}).")
            logger.warning(f"Error al enviar correo vía SMTP ({error_msg}).")
    else:
        missing = []
        if not smtp_host: missing.append("SMTP_HOST")
        if not smtp_user: missing.append("SMTP_USER")
        if not smtp_pass: missing.append("SMTP_PASS")
        keys_summary = ", ".join(smtp_keys_in_env) if smtp_keys_in_env else "Ninguna detectada en el contenedor"
        error_msg = (
            f"Variables SMTP faltantes en el servidor: {', '.join(missing)}.\n"
            f"Claves encontradas en Render: [{keys_summary}].\n"
            f"Nota: Si acabas de guardar las variables en Render, haz clic en 'Manual Deploy' > 'Clear build cache & deploy' en el panel de Render para que el contenedor se reinicie con las nuevas variables."
        )
        print(f"[EmailService] ℹ {error_msg}. Notificación simulada para {recipient_email}.")
        logger.info(f"ℹ {error_msg}. Notificación simulada para {recipient_email}.")

    return {
        "success": True,
        "sent_real_smtp": sent_real,
        "recipient": recipient_email,
        "applicant_name": applicant_name,
        "subject": subject,
        "action": action,
        "unit": unit,
        "error": error_msg,
        "smtp_debug": {
            "host_configured": bool(smtp_host),
            "user_configured": bool(smtp_user),
            "pass_configured": bool(smtp_pass),
            "mail_keys_in_env": smtp_keys_in_env,
            "all_custom_env_vars": all_custom_keys
        },
        "preview": plain_text[:200].strip()
    }
