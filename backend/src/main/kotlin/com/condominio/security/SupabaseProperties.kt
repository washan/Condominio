package com.condominio.security

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "supabase")
data class SupabaseProperties(
    val url: String,
    val key: String,
    val bucket: String
)
