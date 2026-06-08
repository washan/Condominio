package com.condominio.lecturas

import java.math.BigDecimal

interface OcrService {
    fun detectarLectura(fotoBytes: ByteArray): BigDecimal?
}
