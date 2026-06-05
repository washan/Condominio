package com.condominio.rubros

import com.condominio.domain.Usuario
import com.condominio.exception.BusinessException
import com.condominio.repository.UsuarioRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*
import java.time.LocalDate

@RestController
class RubroController(
    private val rubroService: RubroService,
    private val usuarioRepository: UsuarioRepository
) {

    // --- RUBROS ENDPOINTS ---

    @GetMapping("/api/rubros")
    fun getRubros(
        @RequestParam(value = "soloActivos", required = false, defaultValue = "false") soloActivos: Boolean
    ): ResponseEntity<List<RubroDto>> {
        val list = rubroService.getRubros(soloActivos)
        return ResponseEntity.ok(list)
    }

    @GetMapping("/api/rubros/{id}")
    fun getRubro(@PathVariable("id") id: Long): ResponseEntity<RubroDto> {
        val dto = rubroService.getRubro(id)
        return ResponseEntity.ok(dto)
    }

    @PostMapping("/api/rubros")
    @PreAuthorize("hasRole('ADMIN')")
    fun createRubro(@RequestBody dto: RubroDto): ResponseEntity<RubroDto> {
        val created = rubroService.createRubro(dto)
        return ResponseEntity.ok(created)
    }

    @PutMapping("/api/rubros/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateRubro(
        @PathVariable("id") id: Long,
        @RequestBody dto: RubroDto
    ): ResponseEntity<RubroDto> {
        val updated = rubroService.updateRubro(id, dto)
        return ResponseEntity.ok(updated)
    }

    @DeleteMapping("/api/rubros/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun deleteRubro(@PathVariable("id") id: Long): ResponseEntity<Map<String, String>> {
        rubroService.deactivateRubro(id)
        return ResponseEntity.ok(mapOf("message" to "Rubro desactivado correctamente"))
    }

    // --- TARIFF ENDPOINTS ---

    @GetMapping("/api/tarifas/{rubroId}/vigente")
    fun getTarifaVigente(
        @PathVariable("rubroId") rubroId: Long,
        @RequestParam(value = "fecha", required = false) fechaStr: String?
    ): ResponseEntity<TarifaRubroDto> {
        val fecha = if (fechaStr != null) LocalDate.parse(fechaStr) else LocalDate.now()
        val dto = rubroService.getTarifaVigente(rubroId, fecha)
            ?: throw BusinessException("No hay una tarifa vigente para este rubro en la fecha indicada")
        return ResponseEntity.ok(dto)
    }

    @GetMapping("/api/tarifas/{rubroId}/historial")
    fun getHistorialTarifas(@PathVariable("rubroId") rubroId: Long): ResponseEntity<List<TarifaRubroDto>> {
        val list = rubroService.getHistorialTarifas(rubroId)
        return ResponseEntity.ok(list)
    }

    @PostMapping("/api/tarifas/{rubroId}")
    @PreAuthorize("hasRole('ADMIN')")
    fun createTarifa(
        @PathVariable("rubroId") rubroId: Long,
        @RequestBody dto: TarifaRubroDto,
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<TarifaRubroDto> {
        val usuario = getUsuarioFromDetails(userDetails)
        val created = rubroService.createTarifa(rubroId, dto, usuario)
        return ResponseEntity.ok(created)
    }

    private fun getUsuarioFromDetails(userDetails: UserDetails): Usuario {
        return usuarioRepository.findByEmail(userDetails.username)
            .orElseThrow { BusinessException("Usuario no encontrado") }
    }
}
