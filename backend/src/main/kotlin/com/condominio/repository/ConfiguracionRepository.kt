package com.condominio.repository

import com.condominio.domain.Configuracion
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface ConfiguracionRepository : JpaRepository<Configuracion, Long> {
    fun findByClaveIgnoreCase(clave: String): Optional<Configuracion>
}
