package com.condominio.condomino

import com.condominio.cobros.CobroDto
import com.condominio.cobros.MotorCobroService
import com.condominio.domain.EstadoPeriodo
import com.condominio.domain.Usuario
import com.condominio.exception.BusinessException
import com.condominio.repository.*
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
    private val medidorRepository: MedidorRepository,
    private val lecturaMedidorRepository: LecturaMedidorRepository,
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

    @GetMapping("/lectura-actual")
    fun getLecturaActual(@AuthenticationPrincipal userDetails: UserDetails): ResponseEntity<Map<String, Any?>> {
        val usuario = getUsuarioFromDetails(userDetails)
        val condomino = condominoRepository.findByUsuarioId(usuario.id)
            .orElseThrow { BusinessException("No está asociado a ninguna unidad habitacional") }

        val abiertos = periodoRepository.findByEstado(EstadoPeriodo.ABIERTO)
        if (abiertos.isEmpty()) {
            throw BusinessException("No hay ningún período de facturación abierto actualmente")
        }
        val periodo = abiertos.first()

        val medidores = medidorRepository.findByUnidadIdAndActivoTrue(condomino.unidad.id)
        if (medidores.isEmpty()) {
            return ResponseEntity.ok(mapOf(
                "lecturaAnterior" to 0.0,
                "lecturaActual" to null,
                "consumoM3" to null,
                "fotoAnteriorUrl" to null,
                "fotoActualUrl" to null
            ))
        }
        val medidor = medidores.first()

        // Lectura actual
        val lecturaActualOpt = lecturaMedidorRepository.findByMedidorIdAndPeriodoId(medidor.id, periodo.id)
        val lecturaActual = lecturaActualOpt.orElse(null)

        // Lectura anterior
        val prevAnio: Short
        val prevMes: Short
        if (periodo.mes == 1.toShort()) {
            prevAnio = (periodo.anio - 1).toShort()
            prevMes = 12.toShort()
        } else {
            prevAnio = periodo.anio
            prevMes = (periodo.mes - 1).toShort()
        }
        val prevPeriodOpt = periodoRepository.findByAnioAndMes(prevAnio, prevMes)
        val lecturaAnteriorVal = if (prevPeriodOpt.isPresent) {
            lecturaMedidorRepository.findByMedidorIdAndPeriodoId(medidor.id, prevPeriodOpt.get().id)
                .map { it.valorM3.toDouble() }
                .orElse(0.0)
        } else {
            lecturaActual?.let { it.valorM3.toDouble() - (it.consumoM3?.toDouble() ?: 0.0) } ?: 0.0
        }

        return ResponseEntity.ok(mapOf(
            "lecturaAnterior" to lecturaAnteriorVal,
            "lecturaActual" to lecturaActual?.valorM3?.toDouble(),
            "consumoM3" to lecturaActual?.consumoM3?.toDouble(),
            "fotoAnteriorUrl" to null,
            "fotoActualUrl" to lecturaActual?.fotoUrl
        ))
    }

    private fun getUsuarioFromDetails(userDetails: UserDetails): Usuario {
        return usuarioRepository.findByEmail(userDetails.username)
            .orElseThrow { BusinessException("Usuario no encontrado") }
    }
}
