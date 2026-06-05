package com.condominio.storage

import com.condominio.exception.BusinessException
import com.condominio.security.SupabaseProperties
import org.slf4j.LoggerFactory
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import org.springframework.web.multipart.MultipartFile

@Service
class SupabaseStorageService(private val supabaseProperties: SupabaseProperties) {

    private val logger = LoggerFactory.getLogger(SupabaseStorageService::class.java)
    private val restClient = RestClient.builder().build()

    fun uploadFile(path: String, file: MultipartFile): String {
        val bytes = file.bytes
        val mimeType = file.contentType ?: "application/octet-stream"
        return uploadFileBytes(path, bytes, mimeType)
    }

    fun uploadFileBytes(path: String, bytes: ByteArray, mimeType: String): String {
        val url = "${supabaseProperties.url}/storage/v1/object/${supabaseProperties.bucket}/$path"
        
        try {
            logger.info("Subiendo archivo a Supabase Storage: $url")
            val response = restClient.post()
                .uri(url)
                .header("Authorization", "Bearer ${supabaseProperties.key}")
                .header("apikey", supabaseProperties.key)
                .contentType(MediaType.parseMediaType(mimeType))
                .body(bytes)
                .retrieve()
                .toEntity(String::class.java)

            if (!response.statusCode.is2xxSuccessful) {
                logger.error("Error al subir archivo a Supabase Storage: ${response.statusCode} - ${response.body}")
                throw BusinessException("Error al subir archivo a almacenamiento")
            }

            return path
        } catch (ex: Exception) {
            logger.error("Excepción al subir archivo a Supabase Storage", ex)
            throw BusinessException("Error de comunicación con el servicio de almacenamiento: ${ex.message}")
        }
    }

    fun getSignedUrl(path: String): String {
        // En Supabase, para buckets públicos, la URL directa es pública
        return "${supabaseProperties.url}/storage/v1/object/public/${supabaseProperties.bucket}/$path"
    }
}
