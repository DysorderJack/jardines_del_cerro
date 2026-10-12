import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, FRONTEND_URL

logger = logging.getLogger("EmailService")

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

    # Intento de envío real vía SMTP si está configurado
    sent_real = False
    error_msg = None

    if SMTP_HOST and SMTP_USER and SMTP_PASS:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"Jardines del Cerro IV <{SMTP_FROM}>"
            msg["To"] = recipient_email

            part1 = MIMEText(plain_text, "plain", "utf-8")
            part2 = MIMEText(html_content, "html", "utf-8")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(SMTP_FROM, [recipient_email], msg.as_string())
            
            sent_real = True
            logger.info(f"✓ Correo enviado exitosamente a {recipient_email} vía SMTP.")
        except Exception as e:
            error_msg = str(e)
            logger.warning(f"Error al enviar correo vía SMTP ({e}). Fallback a registro de notificación.")
    else:
        logger.info(f"ℹ SMTP no configurado en entorno. Notificación registrada para {recipient_email}.")

    return {
        "success": True,
        "sent_real_smtp": sent_real,
        "recipient": recipient_email,
        "applicant_name": applicant_name,
        "subject": subject,
        "action": action,
        "unit": unit,
        "error": error_msg,
        "preview": plain_text[:200].strip()
    }
