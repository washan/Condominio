package com.condominio.reportes

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/reportes")
@PreAuthorize("hasRole('ADMIN')")
class ReporteController(private val reporteService: ReporteService) {

    @GetMapping("/consumo-anual/{anio}")
    fun getConsumoAnual(@PathVariable("anio") anio: Short): ResponseEntity<List<ConsumoAnualDto>> {
        val list = reporteService.getConsumoAnual(anio)
        return ResponseEntity.ok(list)
    }

    @GetMapping("/morosidad")
    fun getMorosidad(): ResponseEntity<List<MorosidadDto>> {
        val list = reporteService.getMorosidad()
        return ResponseEntity.ok(list)
    }

    @GetMapping("/ingresos-mensual/{anio}")
    fun getIngresosMensual(@PathVariable("anio") anio: Short): ResponseEntity<List<IngresoMensualDto>> {
        val list = reporteService.getIngresoMensual(anio)
        return ResponseEntity.ok(list)
    }
}
