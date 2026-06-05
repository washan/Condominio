package com.condominio.cobros

import com.condominio.domain.Rol
import com.condominio.domain.Usuario
import com.condominio.exception.BusinessException
import com.condominio.repository.CondominoRepository
import com.condominio.repository.UsuarioRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*

@RestController
class CobroController(
    private val motorCobroService: MotorCobroService,
    private val usuarioRepository: UsuarioRepository,
    private val condominoRepository: CondominoRepository
) {

    @GetMapping("/api/cobros/periodo/{periodoId}")
    @PreAuthorize("hasRole('ADMIN')")
    fun getCobrosPorPeriodo(@PathVariable("periodoId") periodoId: Long): ResponseEntity<List<CobroDto>> {
        val list = motorCobroService.getCobrosPorPeriodo(periodoId)
        return ResponseEntity.ok(list)
    }

    @GetMapping("/api/cobros/{id}")
    fun getCobro(
        @PathVariable("id") id: Long,
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<CobroDto> {
        val usuario = usuarioRepository.findByEmail(userDetails.username)
            .orElseThrow { BusinessException("Usuario no encontrado") }
        
        val dto = motorCobroService.getCobro(id)
        
        // Owner verification check: Condominos can only read bills belonging to their unit
        if (usuario.rol == Rol.CONDOMINO) {
            val condomino = condominoRepository.findByUsuarioId(usuario.id)
                .orElseThrow { BusinessException("No está asociado a ninguna unidad habitacional") }
            if (dto.unidadId != condomino.unidad.id) {
                throw AccessDeniedException("No tiene permisos para ver este cobro")
            }
        }
        
        return ResponseEntity.ok(dto)
    }

    @PostMapping("/api/periodos/{periodoId}/generar-cobros")
    @PreAuthorize("hasRole('ADMIN')")
    fun generarCobros(@PathVariable("periodoId") periodoId: Long): ResponseEntity<List<CobroDto>> {
        val list = motorCobroService.generarCobros(periodoId)
        return ResponseEntity.ok(list)
    }

    @PostMapping("/api/periodos/{periodoId}/emitir-cobros")
    @PreAuthorize("hasRole('ADMIN')")
    fun emitirCobros(@PathVariable("periodoId") periodoId: Long): ResponseEntity<Map<String, String>> {
        motorCobroService.emitirCobros(periodoId)
        return ResponseEntity.ok(mapOf("message" to "Cobros emitidos correctamente"))
    }

    @PostMapping("/api/cobros/{id}/pagar")
    @PreAuthorize("hasRole('ADMIN')")
    fun pagarCobro(@PathVariable("id") id: Long): ResponseEntity<CobroDto> {
        val dto = motorCobroService.pagarCobro(id)
        return ResponseEntity.ok(dto)
    }
}
