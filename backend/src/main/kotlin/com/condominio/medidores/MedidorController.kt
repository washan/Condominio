package com.condominio.medidores

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/medidores")
class MedidorController(private val medidorService: MedidorService) {

    @GetMapping("/unidad/{unidadId}")
    fun getMedidoresPorUnidad(@PathVariable("unidadId") unidadId: Long): ResponseEntity<List<MedidorDto>> {
        val list = medidorService.getMedidoresPorUnidad(unidadId)
        return ResponseEntity.ok(list)
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun createMedidor(@RequestBody dto: MedidorDto): ResponseEntity<MedidorDto> {
        val created = medidorService.createMedidor(dto)
        return ResponseEntity.ok(created)
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateMedidor(@PathVariable("id") id: Long, @RequestBody dto: MedidorDto): ResponseEntity<MedidorDto> {
        val updated = medidorService.updateMedidor(id, dto)
        return ResponseEntity.ok(updated)
    }
}
