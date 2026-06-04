package com.condominio.repository

import com.condominio.domain.Auditoria
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AuditoriaRepository : JpaRepository<Auditoria, Long>
