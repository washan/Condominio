package com.condominio.lecturas

import com.condominio.domain.*
import com.condominio.exception.BusinessException
import com.condominio.repository.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.io.BufferedReader
import java.io.InputStreamReader
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class LecturaService(
    private val lecturaMedidorRepository: LecturaMedidorRepository,
    private val periodoRepository: PeriodoRepository,
    private val medidorRepository: MedidorRepository,
    private val unidadRepository: UnidadRepository,
    private val usuarioRepository: UsuarioRepository
) {

    private val logger = LoggerFactory.getLogger(LecturaService::class.java)

    // --- PERIODO METHODS ---

    fun getPeriodos(): List<PeriodoDto> {
        return periodoRepository.findAll().sortedByDescending { it.anio * 100 + it.mes }.map { toPeriodoDto(it) }
    }

    @Transactional
    fun abrirPeriodo(anio: Short, mes: Short): PeriodoDto {
        val existing = periodoRepository.findByAnioAndMes(anio, mes)
        if (existing.isPresent) {
            throw BusinessException("El período $mes/$anio ya está registrado")
        }

        // Validar que no haya otro periodo abierto
        val abiertos = periodoRepository.findByEstado(EstadoPeriodo.ABIERTO)
        if (abiertos.isNotEmpty()) {
            throw BusinessException("Debe cerrar el período anterior (${abiertos.first().mes}/${abiertos.first().anio}) antes de abrir uno nuevo")
        }

        val entity = Periodo(
            anio = anio,
            mes = mes,
            fechaApertura = LocalDate.now(),
            estado = EstadoPeriodo.ABIERTO
        )

        logger.info("Abriendo período de facturación: $mes/$anio")
        val saved = periodoRepository.save(entity)
        return toPeriodoDto(saved)
    }

    @Transactional
    fun cerrarPeriodo(id: Long): PeriodoDto {
        val entity = periodoRepository.findById(id)
            .orElseThrow { BusinessException("Período no encontrado") }

        if (entity.estado == EstadoPeriodo.CERRADO) {
            throw BusinessException("El período ya está cerrado")
        }

        // Validar que todas las unidades activas tengan lectura tomada
        val unidadesActivas = unidadRepository.findAllByActivaTrue()
        val medidoresActivos = unidadesActivas.flatMap { medidorRepository.findByUnidadIdAndActivoTrue(it.id) }
        val lecturasPeriodo = lecturaMedidorRepository.findByMedidorIdAndPeriodoId(0, id) // HACK: Repository standard but we can filter manually
        
        val todasLecturas = lecturaMedidorRepository.findAll().filter { it.periodo?.id == id }
        val medidoresConLectura = todasLecturas.map { it.medidor.id }.toSet()

        val pendientes = medidoresActivos.filter { !medidoresConLectura.contains(it.id) }
        if (pendientes.isNotEmpty()) {
            val numerosUnidades = pendientes.map { it.unidad.numero }.joinToString(", ")
            throw BusinessException("No se puede cerrar el período. Quedan medidores pendientes de lectura para las unidades: $numerosUnidades")
        }

        entity.estado = EstadoPeriodo.CERRADO
        entity.fechaCierre = LocalDate.now()
        logger.info("Cerrando período de facturación ID $id: ${entity.mes}/${entity.anio}")
        val saved = periodoRepository.save(entity)
        return toPeriodoDto(saved)
    }

    // --- LECTURAS METHODS ---

    fun getLecturasPorPeriodo(anio: Short, mes: Short): List<LecturaDto> {
        val periodo = periodoRepository.findByAnioAndMes(anio, mes)
            .orElseThrow { BusinessException("El período $mes/$anio no está registrado") }

        val unidades = unidadRepository.findAllByActivaTrue()
        val todasLecturas = lecturaMedidorRepository.findAll().filter { it.periodo?.id == periodo.id }

        return unidades.map { unidad ->
            val medidores = medidorRepository.findByUnidadIdAndActivoTrue(unidad.id)
            val medidor = medidores.firstOrNull() 
                ?: return@map LecturaDto(
                    unidadId = unidad.id,
                    unidadNumero = unidad.numero,
                    propietario = unidad.nombrePropietario,
                    lecturaAnterior = BigDecimal.ZERO,
                    estado = "ERROR",
                    observaciones = "Unidad sin medidor activo configurado"
                )

            val lectura = todasLecturas.firstOrNull { it.medidor.id == medidor.id }
            val antLect = getLecturaAnterior(medidor.id, periodo.fechaApertura)

            if (lectura != null) {
                LecturaDto(
                    id = lectura.id,
                    unidadId = unidad.id,
                    unidadNumero = unidad.numero,
                    propietario = unidad.nombrePropietario,
                    lecturaAnterior = antLect,
                    lecturaActual = lectura.valorM3,
                    consumo = lectura.consumoM3,
                    fecha = lectura.fechaLectura,
                    fotoUrl = lectura.fotoUrl,
                    estado = "COMPLETADA"
                )
            } else {
                LecturaDto(
                    unidadId = unidad.id,
                    unidadNumero = unidad.numero,
                    propietario = unidad.nombrePropietario,
                    lecturaAnterior = antLect,
                    estado = "PENDIENTE"
                )
            }
        }
    }

    @Transactional
    fun cargarLecturaInicial(dto: LecturaInicialDto) {
        val medidores = medidorRepository.findByUnidadIdAndActivoTrue(dto.unidadId)
        val medidor = medidores.firstOrNull() 
            ?: throw BusinessException("La unidad no tiene un medidor activo")

        // Validar si ya existe una lectura inicial
        val existeInicial = lecturaMedidorRepository.findAll().any { it.medidor.id == medidor.id && it.tipo == TipoLectura.INICIAL }
        if (existeInicial) {
            throw BusinessException("La unidad ya cuenta con una lectura inicial cargada")
        }

        val entity = LecturaMedidor(
            medidor = medidor,
            periodo = null,
            tipo = TipoLectura.INICIAL,
            fechaLectura = dto.fecha,
            valorM3 = dto.lecturaInicial,
            consumoM3 = BigDecimal.ZERO,
            subidaEn = LocalDateTime.now()
        )

        logger.info("Cargando lectura inicial para medidor ${medidor.codigoInterno}: ${dto.lecturaInicial} m3")
        lecturaMedidorRepository.save(entity)
    }

    @Transactional
    fun updateLecturaRegular(lecturaId: Long, valorM3: BigDecimal, fotoUrl: String?, tomadaPor: Usuario): LecturaDto {
        val lectura = lecturaMedidorRepository.findById(lecturaId)
            .orElseThrow { BusinessException("Lectura no encontrada con id: $lecturaId") }

        if (lectura.periodo?.estado == EstadoPeriodo.CERRADO) {
            throw BusinessException("No se pueden modificar lecturas de un período cerrado")
        }

        val antLect = getLecturaAnterior(lectura.medidor.id, lectura.periodo!!.fechaApertura)
        if (valorM3 < antLect) {
            throw BusinessException("La lectura actual ($valorM3) no puede ser menor a la lectura anterior ($antLect)")
        }

        val fieldValor = lectura.javaClass.getDeclaredField("valorM3")
        fieldValor.isAccessible = true
        fieldValor.set(lectura, valorM3)

        val consumo = valorM3.subtract(antLect)
        lectura.consumoM3 = consumo
        
        val fieldFoto = lectura.javaClass.getDeclaredField("fotoUrl")
        fieldFoto.isAccessible = true
        fieldFoto.set(lectura, fotoUrl)

        val fieldTomada = lectura.javaClass.getDeclaredField("tomadaPor")
        fieldTomada.isAccessible = true
        fieldTomada.set(lectura, tomadaPor)

        logger.info("Actualizando lectura ID $lecturaId (medidor ${lectura.medidor.codigoInterno}) a $valorM3 m3 (Consumo: $consumo m3)")
        val saved = lecturaMedidorRepository.save(lectura)
        
        return LecturaDto(
            id = saved.id,
            unidadId = saved.medidor.unidad.id,
            unidadNumero = saved.medidor.unidad.numero,
            propietario = saved.medidor.unidad.nombrePropietario,
            lecturaAnterior = antLect,
            lecturaActual = saved.valorM3,
            consumo = saved.consumoM3,
            fecha = saved.fechaLectura,
            fotoUrl = saved.fotoUrl,
            estado = "COMPLETADA"
        )
    }

    @Transactional
    fun registrarLectura(unidadId: Long, valorM3: BigDecimal, fotoUrl: String?, tomadaPor: Usuario): LecturaDto {
        val abiertos = periodoRepository.findByEstado(EstadoPeriodo.ABIERTO)
        if (abiertos.isEmpty()) {
            throw BusinessException("No hay ningún período abierto para registrar lecturas")
        }
        val periodo = abiertos.first()

        val medidores = medidorRepository.findByUnidadIdAndActivoTrue(unidadId)
        val medidor = medidores.firstOrNull() 
            ?: throw BusinessException("La unidad no tiene un medidor activo")

        // Validar si ya se registró lectura para este período
        val existente = lecturaMedidorRepository.findAll().firstOrNull { it.medidor.id == medidor.id && it.periodo?.id == periodo.id }
        if (existente != null) {
            return updateLecturaRegular(existente.id, valorM3, fotoUrl, tomadaPor)
        }

        val antLect = getLecturaAnterior(medidor.id, periodo.fechaApertura)
        if (valorM3 < antLect) {
            throw BusinessException("La lectura actual ($valorM3) no puede ser menor a la lectura anterior ($antLect)")
        }

        val consumo = valorM3.subtract(antLect)

        val entity = LecturaMedidor(
            medidor = medidor,
            periodo = periodo,
            tipo = TipoLectura.REGULAR,
            fechaLectura = LocalDate.now(),
            valorM3 = valorM3,
            fotoUrl = fotoUrl,
            consumoM3 = consumo,
            tomadaPor = tomadaPor,
            subidaEn = LocalDateTime.now()
        )

        logger.info("Registrando lectura para medidor ${medidor.codigoInterno}: $valorM3 m3 (Consumo: $consumo m3)")
        val saved = lecturaMedidorRepository.save(entity)

        return LecturaDto(
            id = saved.id,
            unidadId = medidor.unidad.id,
            unidadNumero = medidor.unidad.numero,
            propietario = medidor.unidad.nombrePropietario,
            lecturaAnterior = antLect,
            lecturaActual = saved.valorM3,
            consumo = saved.consumoM3,
            fecha = saved.fechaLectura,
            fotoUrl = saved.fotoUrl,
            estado = "COMPLETADA"
        )
    }

    @Transactional
    fun importarLecturasCSV(file: MultipartFile, tomadaPor: Usuario): Map<String, Int> {
        val abiertos = periodoRepository.findByEstado(EstadoPeriodo.ABIERTO)
        if (abiertos.isEmpty()) {
            throw BusinessException("No hay ningún período abierto para registrar lecturas")
        }

        var importadas = 0
        var errores = 0

        BufferedReader(InputStreamReader(file.inputStream)).use { reader ->
            var line: String? = reader.readLine() // Saltar cabecera
            while (reader.readLine().also { line = it } != null) {
                try {
                    val tokens = line!!.split(",")
                    if (tokens.size < 2) continue
                    val numeroUnidad = tokens[0].trim().replace("\"", "")
                    val valorStr = tokens[1].trim().replace("\"", "")
                    val valor = BigDecimal(valorStr)

                    val unidad = unidadRepository.findByNumero(numeroUnidad)
                    if (unidad.isPresent) {
                        registrarLectura(unidad.get().id, valor, null, tomadaPor)
                        importadas++
                    } else {
                        errores++
                        logger.warn("CSV Import: No se encontró la unidad con número $numeroUnidad")
                    }
                } catch (e: Exception) {
                    errores++
                    logger.error("Error importando línea de CSV: $line", e)
                }
            }
        }

        return mapOf("importadas" to importadas, "errores" to errores)
    }

    fun guardarFotoLocal(file: MultipartFile): String {
        if (file.isEmpty) {
            throw BusinessException("El archivo de la imagen no puede estar vacío")
        }
        val contentType = file.contentType ?: ""
        if (!contentType.startsWith("image/")) {
            throw BusinessException("El archivo debe ser una imagen válida (PNG, JPG, WEBP, etc.)")
        }
        val extension = when (contentType) {
            "image/png" -> "png"
            "image/jpeg", "image/jpg" -> "jpg"
            "image/webp" -> "webp"
            else -> "png"
        }
        val filename = "lectura_${java.util.UUID.randomUUID()}.$extension"
        val directory = java.io.File("uploads").absoluteFile
        if (!directory.exists()) {
            directory.mkdirs()
        }
        val destFile = java.io.File(directory, filename).absoluteFile
        file.transferTo(destFile)
        return "/uploads/$filename"
    }

    private fun getLecturaAnterior(medidorId: Long, fechaLimite: LocalDate): BigDecimal {
        val lecturas = lecturaMedidorRepository.findAll()
            .filter { it.medidor.id == medidorId && it.fechaLectura.isBefore(fechaLimite) }
            .sortedByDescending { it.fechaLectura }
        return lecturas.firstOrNull()?.valorM3 ?: BigDecimal.ZERO
    }

    private fun toPeriodoDto(entity: Periodo): PeriodoDto {
        return PeriodoDto(
            id = entity.id,
            anio = entity.anio,
            mes = entity.mes,
            fechaApertura = entity.fechaApertura,
            fechaCierre = entity.fechaCierre,
            estado = entity.estado.name
        )
    }
}
