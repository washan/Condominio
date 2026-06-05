package com.condominio.repository

import com.condominio.domain.TarifaRubro
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface TarifaRubroRepository : JpaRepository<TarifaRubro, Long> {
    fun findByRubroIdAndFechaFinIsNullOrFechaFinAfter(rubroId: Long, fecha: LocalDate): List<TarifaRubro>
    fun existsByRubroId(rubroId: Long): Boolean
}
