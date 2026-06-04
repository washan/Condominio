package com.condominio.repository

import com.condominio.domain.Cobro
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface CobroRepository : JpaRepository<Cobro, Long> {
    fun findByPeriodoIdAndUnidadId(periodoId: Long, unidadId: Long): Optional<Cobro>
    fun findByPeriodoId(periodoId: Long): List<Cobro>
    fun findByUnidadId(unidadId: Long): List<Cobro>
}
