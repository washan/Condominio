package com.condominio.email

import jakarta.mail.internet.MimeMessage
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.ByteArrayResource
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service
import java.io.File
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class EmailService(
    @Autowired(required = false) private val mailSender: JavaMailSender?,
    @Value("\${app.frontend-url}") private val frontendUrl: String,
    @Value("\${app.backend-url}") private val backendUrl: String
) {
    private val logger = LoggerFactory.getLogger(EmailService::class.java)

    fun enviarEstadoCuenta(
        emailDestino: String,
        nombreDestinatario: String,
        periodoStr: String,
        casaNumero: String,
        montoPagar: String,
        pdfBytes: ByteArray,
        pdfFilename: String
    ) {
        val htmlContent = obtenerTemplateHtml(nombreDestinatario, periodoStr, casaNumero, montoPagar)

        // 1. Intentar enviar correo real
        if (mailSender != null) {
            try {
                val message: MimeMessage = mailSender.createMimeMessage()
                val helper = MimeMessageHelper(message, true, "UTF-8")

                helper.setTo(emailDestino)
                helper.setSubject("Estado de Cuenta - Casa #$casaNumero - Período $periodoStr")
                helper.setText(htmlContent, true)
                helper.addAttachment(pdfFilename, ByteArrayResource(pdfBytes))

                mailSender.send(message)
                logger.info("Correo electrónico enviado exitosamente a $emailDestino")
            } catch (e: Exception) {
                logger.warn("No se pudo enviar el correo real a $emailDestino (SMTP no configurado o inaccesible): ${e.message}")
            }
        } else {
            logger.info("JavaMailSender no está configurado (SMTP no habilitado). Omitiendo envío real.")
        }

        // 2. Siempre guardar una copia local en desarrollo (o como contingencia)
        try {
            val uploadsDir = File("uploads/emails").absoluteFile
            if (!uploadsDir.exists()) {
                uploadsDir.mkdirs()
            }

            val timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
            val cleanEmail = emailDestino.replace("@", "_at_").replace(".", "_")
            
            // Guardar HTML
            val htmlFile = File(uploadsDir, "${timestamp}_${cleanEmail}.html")
            htmlFile.writeText(htmlContent, Charsets.UTF_8)

            // Guardar PDF Adjunto
            val pdfFile = File(uploadsDir, "${timestamp}_${cleanEmail}_attachment.pdf")
            pdfFile.writeBytes(pdfBytes)

            logger.info("=== [SIMULACIÓN DE CORREO] ===")
            logger.info("Destinatario: $emailDestino ($nombreDestinatario)")
            logger.info("Asunto: Estado de Cuenta - Casa #$casaNumero - Período $periodoStr")
            logger.info("Visualizar Email HTML: $backendUrl/uploads/emails/${htmlFile.name}")
            logger.info("Descargar PDF Adjunto: $backendUrl/uploads/emails/${pdfFile.name}")
            logger.info("==============================")
        } catch (e: Exception) {
            logger.error("Error al guardar respaldo local del correo: ${e.message}", e)
        }
    }

    private fun obtenerTemplateHtml(
        nombreDestinatario: String,
        periodoStr: String,
        casaNumero: String,
        montoPagar: String
    ): String {
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Estado de Cuenta</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f5f7; color: #1e1e2f; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #e1e8ed; }
                .header { background: linear-gradient(135deg, #6A11CB 0%, #2575FC 100%); padding: 32px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
                .content { padding: 40px; line-height: 1.6; }
                .welcome { font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #1A1A2E; }
                .bill-card { background: #f8f9fc; border-radius: 12px; padding: 24px; border: 1px solid #eaedf3; margin: 24px 0; text-align: center; }
                .bill-amount { font-size: 32px; font-weight: 800; color: #6A11CB; margin: 8px 0; }
                .bill-meta { color: #718096; font-size: 14px; }
                .button { display: inline-block; background: linear-gradient(135deg, #6A11CB, #2575FC); color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 16px; margin-top: 16px; box-shadow: 0 4px 15px rgba(106,17,203,0.2); }
                .footer { background: #f8f9fc; padding: 24px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #eaedf3; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Veredas del Bosque</h1>
                    <div style="font-size: 14px; opacity: 0.8; margin-top: 4px;">Portal del Condómino</div>
                </div>
                <div class="content">
                    <div class="welcome">Hola, $nombreDestinatario,</div>
                    <p>Le informamos que ya se encuentra disponible su estado de cuenta para el período <strong>$periodoStr</strong>.</p>
                    
                    <div class="bill-card">
                        <div style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Total a Pagar</div>
                        <div class="bill-amount">$montoPagar</div>
                        <div class="bill-meta">Unidad: Casa #$casaNumero</div>
                    </div>

                    <p>Adjunto a este correo encontrará el detalle completo de los rubros cobrados (agua, cuota condominal y mantenimiento) en formato PDF.</p>
                    
                    <div style="text-align: center; margin-top: 32px;">
                        <a href="$frontendUrl" class="button" style="color: #ffffff;">Ir al Portal del Condómino</a>
                    </div>
                </div>
                <div class="footer">
                    Este es un correo automático de prueba/desarrollo, por favor no responda directamente.<br>
                    &copy; 2026 Condominio Veredas del Bosque. Todos los derechos reservados.
                </div>
            </div>
        </body>
        </html>
        """.trimIndent()
    }
}
