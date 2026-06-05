package com.condominio.condomino

import com.condominio.cobros.CobroDto
import com.condominio.cobros.MotorCobroService
import com.condominio.domain.EstadoPeriodo
import com.condominio.domain.Usuario
import com.condominio.exception.BusinessException
import com.condominio.repository.CobroRepository
import com.condominio.repository.CondominoRepository
import com.condominio.repository.PeriodoRepository
import com.condominio.repository.UsuarioRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/condomino")
class CondominoController(
    private val condominoRepository: CondominoRepository,
    private val usuarioRepository: UsuarioRepository,
    private val periodoRepository: PeriodoRepository,
    private val cobroRepository: CobroRepository,
    private val motorCobroService: MotorCobroService
) {

    @GetMapping("/me")
    fun getPerfil(@AuthenticationPrincipal userDetails: UserDetails): ResponseEntity<Map<String, Any?>> {
        val usuario = getUsuarioFromDetails(userDetails)
        val condomino = condominoRepository.findByUsuarioId(usuario.id)
            .orElseThrow { BusinessException("No está asociado a ninguna unidad habitacional") }
        
        return ResponseEntity.ok(mapOf(
            "usuarioId" to usuario.id,
            "nombre" to usuario.nombre,
            "email" to usuario.email,
            "unidadId" to condomino.unidad.id,
            "unidadNumero" to condomino.unidad.numero,
            "propietario" to condomino.unidad.nombrePropietario,
            "telefono" to condomino.unidad.telefono
        ))
    }

    @GetMapping("/cobro-actual")
    fun getCobroActual(@AuthenticationPrincipal userDetails: UserDetails): ResponseEntity<CobroDto> {
        val usuario = getUsuarioFromDetails(userDetails)
        val condomino = condominoRepository.findByUsuarioId(usuario.id)
            .orElseThrow { BusinessException("No está asociado a ninguna unidad habitacional") }
        
        // Buscar periodo abierto
        val abiertos = periodoRepository.findByEstado(EstadoPeriodo.ABIERTO)
        if (abiertos.isEmpty()) {
            throw BusinessException("No hay ningún período de facturación abierto actualmente")
        }
        val periodo = abiertos.first()

        val cobroOpt = cobroRepository.findByPeriodoIdAndUnidadId(periodo.id, condomino.unidad.id)
        if (!cobroOpt.isPresent) {
            throw BusinessException("No se ha generado el cobro para este período aún")
        }

        val cobroDto = motorCobroService.getCobro(cobroOpt.get().id)
        return ResponseEntity.ok(cobroDto)
    }

    @GetMapping("/historial")
    fun getHistorial(@AuthenticationPrincipal userDetails: UserDetails): ResponseEntity<List<CobroDto>> {
        val usuario = getUsuarioFromDetails(userDetails)
        val condomino = condominoRepository.findByUsuarioId(usuario.id)
            .orElseThrow { BusinessException("No está asociado a ninguna unidad habitacional") }

        val cobros = cobroRepository.findByUnidadId(condomino.unidad.id)
            .filter { it.periodo.estado == EstadoPeriodo.CERRADO }
            .map { motorCobroService.getCobro(it.id) }

        return ResponseEntity.ok(cobros)
    }

    private fun getUsuarioFromDetails(userDetails: UserDetails): Usuario {
        return usuarioRepository.findByEmail(userDetails.username)
            .orElseThrow { BusinessException("Usuario no encontrado") }
    }
}
