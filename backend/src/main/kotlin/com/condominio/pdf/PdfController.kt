package com.condominio.pdf

import com.condominio.domain.Rol
import com.condominio.domain.Usuario
import com.condominio.exception.BusinessException
import com.condominio.repository.CobroRepository
import com.condominio.repository.CondominoRepository
import com.condominio.repository.UsuarioRepository
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*
import java.io.ByteArrayOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

@RestController
class PdfController(
    private val pdfGeneratorService: PdfGeneratorService,
    private val cobroRepository: CobroRepository,
    private val usuarioRepository: UsuarioRepository,
    private val condominoRepository: CondominoRepository
) {

    @GetMapping("/api/cobros/{id}/pdf")
    fun descargarPdf(
        @PathVariable("id") id: Long,
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<ByteArray> {
        val usuario = getUsuarioFromDetails(userDetails)
        val cobro = cobroRepository.findById(id)
            .orElseThrow { BusinessException("Cobro no encontrado con id: $id") }

        // Security check: Condominos can only view their own bill PDF
        if (usuario.rol == Rol.CONDOMINO) {
            val condomino = condominoRepository.findByUsuarioId(usuario.id)
                .orElseThrow { BusinessException("No está asociado a ninguna unidad habitacional") }
            if (cobro.unidad.id != condomino.unidad.id) {
                throw AccessDeniedException("No tiene permisos para descargar este estado de cuenta")
            }
        }

        // Generar PDF bytes
        val pdfBytes = pdfGeneratorService.generarPdfBytes(cobro)

        // Subir a storage en segundo plano si aún no está guardado (opcional, para persistencia)
        try {
            pdfGeneratorService.generarYSubirPdf(id)
        } catch (e: Exception) {
            // No bloquear la descarga si falla la subida a storage
        }

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_PDF
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=estado_cuenta_casa_${cobro.unidad.numero}.pdf")
        
        return ResponseEntity(pdfBytes, headers, HttpStatus.OK)
    }

    @PostMapping("/api/periodos/{periodoId}/pdf-masivo")
    @PreAuthorize("hasRole('ADMIN')")
    fun descargarPdfMasivo(
        @PathVariable("periodoId") periodoId: Long
    ): ResponseEntity<ByteArray> {
        val cobros = cobroRepository.findByPeriodoId(periodoId)
        if (cobros.isEmpty()) {
            throw BusinessException("No hay cobros generados para este período")
        }

        val baos = ByteArrayOutputStream()
        ZipOutputStream(baos).use { zos ->
            cobros.forEach { cobro ->
                val filename = "estado_cuenta_casa_${cobro.unidad.numero}.pdf"
                val pdfBytes = pdfGeneratorService.generarPdfBytes(cobro)
                
                val entry = ZipEntry(filename)
                zos.putNextEntry(entry)
                zos.write(pdfBytes)
                zos.closeEntry()
            }
        }

        val zipBytes = baos.toByteArray()
        val headers = HttpHeaders()
        headers.contentType = MediaType.parseMediaType("application/zip")
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=estados_cuenta_periodo_$periodoId.zip")

        return ResponseEntity(zipBytes, headers, HttpStatus.OK)
    }

    private fun getUsuarioFromDetails(userDetails: UserDetails): Usuario {
        return usuarioRepository.findByEmail(userDetails.username)
            .orElseThrow { BusinessException("Usuario no encontrado") }
    }
}
