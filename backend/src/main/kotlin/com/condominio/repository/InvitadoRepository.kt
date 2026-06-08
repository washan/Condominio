package com.condominio.repository

import com.condominio.domain.Invitado
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
interface InvitadoRepository : JpaRepository<Invitado, Long> {
    
    @Query("SELECT i FROM Invitado i WHERE i.estado IN (com.condominio.domain.EstadoInvitado.PENDIENTE, com.condominio.domain.EstadoInvitado.INGRESADO) AND i.fechaHoraHasta >= :dateTime ORDER BY i.fechaHoraDesde DESC")
    fun findVigentes(dateTime: LocalDateTime): List<Invitado>

    fun findByUnidadIdOrderByFechaHoraDesdeDesc(unidadId: Long): List<Invitado>

    @Query("SELECT i FROM Invitado i WHERE (LOWER(i.nombre) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(i.placaVehiculo) LIKE LOWER(CONCAT('%', :query, '%'))) ORDER BY i.fechaHoraDesde DESC")
    fun search(query: String): List<Invitado>
}
