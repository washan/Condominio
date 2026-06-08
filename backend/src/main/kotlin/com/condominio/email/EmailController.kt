package com.condominio.email

import com.condominio.domain.Rol
import com.condominio.domain.Usuario
import com.condominio.exception.BusinessException
import com.condominio.pdf.PdfGeneratorService
import com.condominio.repository.CobroRepository
import com.condominio.repository.CondominoRepository
import com.condominio.repository.UsuarioRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class EmailController(
    private val emailService: EmailService,
    private val pdfGeneratorService: PdfGeneratorService,
    private val cobroRepository: CobroRepository,
    private val usuarioRepository: UsuarioRepository,
    private val condominoRepository: CondominoRepository
) {

    @PostMapping("/api/cobros/{id}/enviar-email")
    fun enviarEmailCobro(
        @PathVariable("id") id: Long,
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<Map<String, String>> {
        val usuario = getUsuarioFromDetails(userDetails)
        val cobro = cobroRepository.findById(id)
            .orElseThrow { BusinessException("Cobro no encontrado con id: $id") }

        // Security check: Condominos can only send email for their own unit
        if (usuario.rol == Rol.CONDOMINO) {
            val condomino = condominoRepository.findByUsuarioId(usuario.id)
                .orElseThrow { BusinessException("No está asociado a ninguna unidad habitacional") }
            if (cobro.unidad.id != condomino.unidad.id) {
                throw AccessDeniedException("No tiene permisos para enviar por correo este estado de cuenta")
            }
        }

        // 1. Generar bytes de PDF
        val pdfBytes = pdfGeneratorService.generarPdfBytes(cobro)
        val filename = "estado_cuenta_casa_${cobro.unidad.numero}.pdf"
        val periodoStr = "${cobro.periodo.mes}/${cobro.periodo.anio}"
        
        // 2. Destinatario de correo
        val emailDestino = cobro.unidad.email ?: usuario.email
        val nombreDestinatario = cobro.unidad.nombrePropietario

        // 3. Monto formateado
        val total = cobro.totalCobros.add(cobro.saldoMonetarioAnterior)
        val montoPagarFormateado = "₡${String.format("%,.2f", total.toDouble())}"

        // 4. Enviar email
        emailService.enviarEstadoCuenta(
            emailDestino = emailDestino,
            nombreDestinatario = nombreDestinatario,
            periodoStr = periodoStr,
            casaNumero = cobro.unidad.numero,
            montoPagar = montoPagarFormateado,
            pdfBytes = pdfBytes,
            pdfFilename = filename
        )

        return ResponseEntity.ok(mapOf(
            "message" to "El estado de cuenta ha sido enviado a su correo registrado: $emailDestino"
        ))
    }

    private fun getUsuarioFromDetails(userDetails: UserDetails): Usuario {
        return usuarioRepository.findByEmail(userDetails.username)
            .orElseThrow { BusinessException("Usuario no encontrado") }
    }
}
