package com.condominio.repository

import com.condominio.domain.EstadoPeriodo
import com.condominio.domain.Periodo
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface PeriodoRepository : JpaRepository<Periodo, Long> {
    fun findByAnioAndMes(anio: Short, mes: Short): Optional<Periodo>
    fun findByEstado(estado: EstadoPeriodo): List<Periodo>
}
