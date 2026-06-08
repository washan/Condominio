package com.condominio.comunicacion

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/avisos")
class AvisoController(private val avisoService: AvisoService) {

    @GetMapping
    fun getAvisosVigentes(): ResponseEntity<List<AvisoDto>> {
        val list = avisoService.getAvisosVigentes()
        return ResponseEntity.ok(list)
    }

    @GetMapping("/todos")
    @PreAuthorize("hasRole('ADMIN')")
    fun getAllAvisos(): ResponseEntity<List<AvisoDto>> {
        val list = avisoService.getAllAvisos()
        return ResponseEntity.ok(list)
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun createAviso(
        @AuthenticationPrincipal userDetails: UserDetails,
        @RequestBody dto: AvisoDto
    ): ResponseEntity<AvisoDto> {
        val created = avisoService.createAviso(dto, userDetails.username)
        return ResponseEntity.ok(created)
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateAviso(
        @PathVariable("id") id: Long,
        @RequestBody dto: AvisoDto
    ): ResponseEntity<AvisoDto> {
        val updated = avisoService.updateAviso(id, dto)
        return ResponseEntity.ok(updated)
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun deleteAviso(@PathVariable("id") id: Long): ResponseEntity<Map<String, String>> {
        avisoService.deleteAviso(id)
        return ResponseEntity.ok(mapOf("message" to "Aviso eliminado exitosamente"))
    }
}
