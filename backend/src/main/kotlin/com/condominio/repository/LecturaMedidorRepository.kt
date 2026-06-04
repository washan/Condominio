package com.condominio.repository

import com.condominio.domain.LecturaMedidor
import com.condominio.domain.TipoLectura
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface LecturaMedidorRepository : JpaRepository<LecturaMedidor, Long> {
    fun findByMedidorIdAndPeriodoId(medidorId: Long, periodoId: Long): Optional<LecturaMedidor>
    fun findByMedidorIdAndTipo(medidorId: Long, tipo: TipoLectura): List<LecturaMedidor>
    fun findTopByMedidorIdOrderByFechaLecturaDesc(medidorId: Long): Optional<LecturaMedidor>
}
