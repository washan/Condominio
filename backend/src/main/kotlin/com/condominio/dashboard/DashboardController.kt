package com.condominio.dashboard

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/dashboard")
class DashboardController(private val dashboardService: DashboardService) {

    @GetMapping("/resumen-mes")
    fun getResumenMes(): ResponseEntity<ResumenMesDto> {
        val dto = dashboardService.getResumenMes()
        return ResponseEntity.ok(dto)
    }

    @GetMapping("/consumo-historico")
    fun getConsumoHistorico(): ResponseEntity<List<ConsumoHistoricoDto>> {
        val list = dashboardService.getConsumoHistorico()
        return ResponseEntity.ok(list)
    }

    @GetMapping("/top-consumidores")
    fun getTopConsumidores(): ResponseEntity<List<TopConsumidorDto>> {
        val list = dashboardService.getTopConsumidores()
        return ResponseEntity.ok(list)
    }

    @GetMapping("/alertas")
    fun getAlertas(): ResponseEntity<List<AlertaDashboardDto>> {
        val list = dashboardService.getAlertas()
        return ResponseEntity.ok(list)
    }
}
