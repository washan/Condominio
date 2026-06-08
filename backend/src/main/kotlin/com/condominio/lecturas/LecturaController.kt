package com.condominio.lecturas

import com.condominio.domain.Usuario
import com.condominio.exception.BusinessException
import com.condominio.repository.UsuarioRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.math.BigDecimal

@RestController
class LecturaController(
    private val lecturaService: LecturaService,
    private val usuarioRepository: UsuarioRepository,
    private val ocrService: OcrService
) {

    // --- PERIODOS ENDPOINTS ---

    @GetMapping("/api/periodos")
    fun getPeriodos(): ResponseEntity<List<PeriodoDto>> {
        val list = lecturaService.getPeriodos()
        return ResponseEntity.ok(list)
    }

    @PostMapping("/api/periodos")
    @PreAuthorize("hasRole('ADMIN')")
    fun abrirPeriodo(
        @RequestParam("anio") anio: Short,
        @RequestParam("mes") mes: Short
    ): ResponseEntity<PeriodoDto> {
        val created = lecturaService.abrirPeriodo(anio, mes)
        return ResponseEntity.ok(created)
    }

    @PostMapping("/api/periodos/{id}/cerrar")
    @PreAuthorize("hasRole('ADMIN')")
    fun cerrarPeriodo(@PathVariable("id") id: Long): ResponseEntity<PeriodoDto> {
        val closed = lecturaService.cerrarPeriodo(id)
        return ResponseEntity.ok(closed)
    }

    // --- LECTURAS ENDPOINTS ---

    @GetMapping("/api/lecturas")
    fun getLecturas(
        @RequestParam("anio") anio: Short,
        @RequestParam("mes") mes: Short
    ): ResponseEntity<List<LecturaDto>> {
        val list = lecturaService.getLecturasPorPeriodo(anio, mes)
        return ResponseEntity.ok(list)
    }

    @PostMapping("/api/lecturas")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO')")
    fun registrarLectura(
        @RequestParam("unidadId") unidadId: Long,
        @RequestParam("valorM3") valorM3: BigDecimal,
        @RequestParam(value = "fotoUrl", required = false) fotoUrl: String?,
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<LecturaDto> {
        val usuario = getUsuarioFromDetails(userDetails)
        val created = lecturaService.registrarLectura(unidadId, valorM3, fotoUrl, usuario)
        return ResponseEntity.ok(created)
    }

    @PutMapping("/api/lecturas/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO')")
    fun updateLectura(
        @PathVariable("id") id: Long,
        @RequestParam("valorM3") valorM3: BigDecimal,
        @RequestParam(value = "fotoUrl", required = false) fotoUrl: String?,
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<LecturaDto> {
        val usuario = getUsuarioFromDetails(userDetails)
        val updated = lecturaService.updateLecturaRegular(id, valorM3, fotoUrl, usuario)
        return ResponseEntity.ok(updated)
    }

    @PostMapping("/api/lecturas/inicial")
    @PreAuthorize("hasRole('ADMIN')")
    fun cargarLecturaInicial(@RequestBody dto: LecturaInicialDto): ResponseEntity<Map<String, String>> {
        lecturaService.cargarLecturaInicial(dto)
        return ResponseEntity.ok(mapOf("message" to "Lectura inicial cargada correctamente"))
    }

    @PostMapping("/api/lecturas/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO')")
    fun uploadFoto(
        @RequestParam("file") file: MultipartFile
    ): ResponseEntity<Map<String, Any?>> {
        val fileBytes = file.bytes
        val url = lecturaService.guardarFotoLocal(file)
        
        val ocrResult = try {
            ocrService.detectarLectura(fileBytes)
        } catch (e: Throwable) {
            org.slf4j.LoggerFactory.getLogger(LecturaController::class.java).error("Error al procesar OCR en controlador", e)
            null
        }

        return ResponseEntity.ok(mapOf(
            "url" to url,
            "lecturaOcr" to ocrResult
        ))
    }

    @PostMapping("/api/lecturas/importar")
    @PreAuthorize("hasRole('ADMIN')")
    fun importarCSV(
        @RequestParam("file") file: MultipartFile,
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<Map<String, Int>> {
        val usuario = getUsuarioFromDetails(userDetails)
        val result = lecturaService.importarLecturasCSV(file, usuario)
        return ResponseEntity.ok(result)
    }

    private fun getUsuarioFromDetails(userDetails: UserDetails): Usuario {
        return usuarioRepository.findByEmail(userDetails.username)
            .orElseThrow { BusinessException("Usuario no encontrado") }
    }
}
