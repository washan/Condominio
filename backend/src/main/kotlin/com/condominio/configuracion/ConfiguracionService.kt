package com.condominio.configuracion

import com.condominio.domain.Configuracion
import com.condominio.domain.Usuario
import com.condominio.exception.BusinessException
import com.condominio.repository.ConfiguracionRepository
import com.condominio.storage.SupabaseStorageService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.time.LocalDateTime
import java.util.UUID

@Service
class ConfiguracionService(
    private val configuracionRepository: ConfiguracionRepository,
    private val supabaseStorageService: SupabaseStorageService
) {

    private val logger = LoggerFactory.getLogger(ConfiguracionService::class.java)

    fun getValores(): Map<String, String?> {
        return configuracionRepository.findAll().associate { it.clave to it.valor }
    }

    fun getValor(clave: String): String? {
        return configuracionRepository.findByClaveIgnoreCase(clave)
            .map { it.valor }
            .orElse(null)
    }

    @Transactional
    fun updateValores(valores: Map<String, String?>, modificadoPor: Usuario) {
        valores.forEach { (clave, valor) ->
            updateValor(clave, valor, modificadoPor)
        }
    }

    @Transactional
    fun updateValor(clave: String, valor: String?, modificadoPor: Usuario): Configuracion {
        val config = configuracionRepository.findByClaveIgnoreCase(clave)
            .orElseGet {
                Configuracion(
                    clave = clave.lowercase(),
                    valor = valor,
                    descripcion = "Parámetro configurado dinámicamente",
                    modificadoPor = modificadoPor,
                    modificadoEn = LocalDateTime.now()
                )
            }

        logger.info("Actualizando parámetro: $clave = $valor (por ${modificadoPor.email})")
        config.valor = valor
        config.modificadoPor = modificadoPor
        config.modificadoEn = LocalDateTime.now()
        return configuracionRepository.save(config)
    }

    @Transactional
    fun uploadLogo(file: MultipartFile, modificadoPor: Usuario): String {
        if (file.isEmpty) {
            throw BusinessException("El archivo del logo no puede estar vacío")
        }

        val contentType = file.contentType ?: ""
        if (!contentType.startsWith("image/")) {
            throw BusinessException("El archivo debe ser una imagen válida (PNG, JPG, etc.)")
        }

        // Crear una ruta única en Supabase Storage
        val extension = when (contentType) {
            "image/png" -> "png"
            "image/jpeg", "image/jpg" -> "jpg"
            "image/webp" -> "webp"
            else -> "png"
        }
        val filename = "logos/logo_condominio_${UUID.randomUUID()}.$extension"

        // Subir a Supabase
        supabaseStorageService.uploadFile(filename, file)

        // Obtener la URL firmada/pública
        val logoUrl = supabaseStorageService.getSignedUrl(filename)

        // Actualizar en base de datos
        updateValor("condominio.logo_storage_key", filename, modificadoPor)
        updateValor("condominio.logo_url", logoUrl, modificadoPor)

        return logoUrl
    }
}
