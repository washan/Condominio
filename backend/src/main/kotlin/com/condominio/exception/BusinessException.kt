package com.condominio.exception

class BusinessException(
    message: String,
    cause: Throwable? = null
) : RuntimeException(message, cause)
