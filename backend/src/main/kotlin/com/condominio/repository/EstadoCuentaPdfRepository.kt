package com.condominio.repository

import com.condominio.domain.EstadoCuentaPdf
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface EstadoCuentaPdfRepository : JpaRepository<EstadoCuentaPdf, Long> {
    fun findByCobroId(cobroId: Long): Optional<EstadoCuentaPdf>
}
