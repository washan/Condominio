package com.condominio.invitados

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/invitados")
class InvitadoController(private val invitadoService: InvitadoService) {

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GUARDIA')")
    fun getInvitadosVigentes(): ResponseEntity<List<InvitadoDto>> {
        val list = invitadoService.getInvitadosVigentes()
        return ResponseEntity.ok(list)
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'GUARDIA')")
    fun searchInvitados(@RequestParam("q") q: String): ResponseEntity<List<InvitadoDto>> {
        val list = invitadoService.searchInvitados(q)
        return ResponseEntity.ok(list)
    }

    @GetMapping("/unidad/{unidadId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GUARDIA')")
    fun getInvitadosPorUnidad(@PathVariable("unidadId") unidadId: Long): ResponseEntity<List<InvitadoDto>> {
        val list = invitadoService.getInvitadosPorUnidad(unidadId)
        return ResponseEntity.ok(list)
    }

    @GetMapping("/mis-invitados")
    @PreAuthorize("hasRole('CONDOMINO')")
    fun getMisInvitados(@AuthenticationPrincipal userDetails: UserDetails): ResponseEntity<List<InvitadoDto>> {
        val list = invitadoService.getInvitadosPorCondomino(userDetails.username)
        return ResponseEntity.ok(list)
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CONDOMINO')")
    fun createInvitado(
        @AuthenticationPrincipal userDetails: UserDetails,
        @RequestBody dto: InvitadoDto
    ): ResponseEntity<InvitadoDto> {
        val created = invitadoService.createInvitado(dto, userDetails.username)
        return ResponseEntity.ok(created)
    }

    @PutMapping("/{id}/estado")
    fun updateEstado(
        @PathVariable("id") id: Long,
        @RequestParam("estado") estado: String,
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<InvitadoDto> {
        val updated = invitadoService.updateEstado(id, estado, userDetails.username)
        return ResponseEntity.ok(updated)
    }
}
