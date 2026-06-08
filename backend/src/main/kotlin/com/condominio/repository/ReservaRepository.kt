package com.condominio.repository

import com.condominio.domain.EstadoReserva
import com.condominio.domain.Reserva
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface ReservaRepository : JpaRepository<Reserva, Long> {
    
    fun findByEspacioIdAndFechaReservaAndEstadoIn(
        espacioId: Long, 
        fechaReserva: LocalDate, 
        estados: List<EstadoReserva>
    ): List<Reserva>

    fun findByUnidadIdOrderByFechaReservaDescHoraInicioDesc(unidadId: Long): List<Reserva>

    @Query("SELECT r FROM Reserva r ORDER BY r.fechaReserva DESC, r.horaInicio DESC")
    fun findAllOrderByFechaReservaDescHoraInicioDesc(): List<Reserva>
}
