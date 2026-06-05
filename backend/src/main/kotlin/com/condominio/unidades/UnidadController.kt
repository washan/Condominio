package com.condominio.unidades

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/unidades")
class UnidadController(private val unidadService: UnidadService) {

    @GetMapping
    fun getUnidades(@RequestParam(value = "soloActivas", required = false, defaultValue = "false") soloActivas: Boolean): ResponseEntity<List<UnidadDto>> {
        val list = unidadService.getUnidades(soloActivas)
        return ResponseEntity.ok(list)
    }

    @GetMapping("/{id}")
    fun getUnidad(@PathVariable("id") id: Long): ResponseEntity<UnidadDto> {
        val dto = unidadService.getUnidad(id)
        return ResponseEntity.ok(dto)
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun createUnidad(@RequestBody dto: UnidadDto): ResponseEntity<UnidadDto> {
        val created = unidadService.createUnidad(dto)
        return ResponseEntity.ok(created)
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateUnidad(@PathVariable("id") id: Long, @RequestBody dto: UnidadDto): ResponseEntity<UnidadDto> {
        val updated = unidadService.updateUnidad(id, dto)
        return ResponseEntity.ok(updated)
    }
}
