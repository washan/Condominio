package com.condominio.configuracion

import com.condominio.domain.*
import com.condominio.repository.*
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime
import kotlin.random.Random

@Component
class DatabaseSeeder(
    private val usuarioRepository: UsuarioRepository,
    private val configuracionRepository: ConfiguracionRepository,
    private val unidadRepository: UnidadRepository,
    private val medidorRepository: MedidorRepository,
    private val condominoRepository: CondominoRepository,
    private val rubroRepository: RubroRepository,
    private val tarifaRubroRepository: TarifaRubroRepository,
    private val periodoRepository: PeriodoRepository,
    private val lecturaMedidorRepository: LecturaMedidorRepository,
    private val cobroRepository: CobroRepository,
    private val itemCobroRepository: ItemCobroRepository,
    private val passwordEncoder: PasswordEncoder
) : CommandLineRunner {

    private val logger = LoggerFactory.getLogger(DatabaseSeeder::class.java)

    @Transactional
    override fun run(vararg args: String?) {
        if (usuarioRepository.count() > 0L) {
            logger.info("La base de datos ya contiene datos. Omitiendo la siembra de datos iniciales.")
            return
        }

        logger.info("Iniciando la siembra de datos de desarrollo...")

        // 1. Crear usuarios administrativos
        val admin = Usuario(
            nombre = "José Madrigal (Admin)",
            email = "admin@condominio.cr",
            passwordHash = passwordEncoder.encode("admin123"),
            rol = Rol.ADMIN,
            activo = true
        )
        usuarioRepository.save(admin)

        val tecnico = Usuario(
            nombre = "Carlos Técnico",
            email = "tecnico@condominio.cr",
            passwordHash = passwordEncoder.encode("tecnico123"),
            rol = Rol.TECNICO,
            activo = true
        )
        usuarioRepository.save(tecnico)

        val guardia = Usuario(
            nombre = "Guarda Vigilancia",
            email = "guardia@condominio.cr",
            passwordHash = passwordEncoder.encode("guardia123"),
            rol = Rol.GUARDIA,
            activo = true
        )
        usuarioRepository.save(guardia)

        // 2. Crear configuraciones base
        val configs = listOf(
            Configuracion(clave = "condominio.nombre", valor = "Veredas del Bosque", descripcion = "Nombre comercial", modificadoPor = admin),
            Configuracion(clave = "condominio.nombre_legal", valor = "Condominio Residencial Veredas del Bosque", descripcion = "Nombre de personería jurídica", modificadoPor = admin),
            Configuracion(clave = "condominio.telefono", valor = "+506 8888-8888", descripcion = "Teléfono de la administración", modificadoPor = admin),
            Configuracion(clave = "condominio.email_contacto", valor = "admin@veredasbosque.cr", descripcion = "Correo de contacto oficial", modificadoPor = admin),
            Configuracion(clave = "condominio.direccion", valor = "Guadalupe, Cartago, Costa Rica", descripcion = "Dirección física", modificadoPor = admin),
            Configuracion(clave = "moneda.simbolo", valor = "₡", descripcion = "Símbolo monetario", modificadoPor = admin),
            Configuracion(clave = "tarifa.bloque1_hasta", valor = "100.0", descripcion = "Límite del primer bloque (m³)", modificadoPor = admin),
            Configuracion(clave = "tarifa.bloque1_precio", valor = "1250.0", descripcion = "Precio por m³ en Bloque 1", modificadoPor = admin),
            Configuracion(clave = "tarifa.bloque2_hasta", valor = "300.0", descripcion = "Límite del segundo bloque (m³)", modificadoPor = admin),
            Configuracion(clave = "tarifa.bloque2_precio", valor = "2100.0", descripcion = "Precio por m³ en Bloque 2", modificadoPor = admin),
            Configuracion(clave = "tarifa.bloque3_precio", valor = "3500.0", descripcion = "Precio por m³ en Bloque 3 (Excedente)", modificadoPor = admin),
            Configuracion(clave = "tarifa.cuota_administracion", valor = "15000.0", descripcion = "Cuota básica de administración", modificadoPor = admin),
            Configuracion(clave = "mora.dias", valor = "15", descripcion = "Días de gracia para pago", modificadoPor = admin),
            Configuracion(clave = "mora.porcentaje", valor = "10.0", descripcion = "Recargo por morosidad (%)", modificadoPor = admin)
        )
        configuracionRepository.saveAll(configs)

        // 3. Crear Rubros
        val rubroAgua = Rubro(nombre = "Servicio de Agua", descripcion = "Consumo medido de agua potable", tipo = TipoRubro.CONSUMO, ordenDisplay = 1, porcentajeMora = BigDecimal.ZERO)
        val rubroAdmin = Rubro(nombre = "Cuota de Administración", descripcion = "Mantenimiento general y áreas comunes", tipo = TipoRubro.FIJO, ordenDisplay = 2, porcentajeMora = BigDecimal("2.00"))
        val rubroSeguridad = Rubro(nombre = "Seguridad Comunitaria", descripcion = "Servicio de vigilancia 24/7", tipo = TipoRubro.FIJO, ordenDisplay = 3, porcentajeMora = BigDecimal("1.50"))
        rubroRepository.saveAll(listOf(rubroAgua, rubroAdmin, rubroSeguridad))

        // Tarifas de rubros
        val tarifaAgua = TarifaRubro(
            rubro = rubroAgua,
            fechaInicio = LocalDate.now().minusYears(1),
            configJson = """[{"desde": 0, "hasta": 100, "precio": 1250}, {"desde": 100, "hasta": 300, "precio": 2100}, {"desde": 300, "hasta": 99999, "precio": 3500}]""",
            creadoPor = admin
        )
        val tarifaAdmin = TarifaRubro(
            rubro = rubroAdmin,
            fechaInicio = LocalDate.now().minusYears(1),
            configJson = """{"monto": 15000.0}""",
            creadoPor = admin
        )
        val tarifaSeguridad = TarifaRubro(
            rubro = rubroSeguridad,
            fechaInicio = LocalDate.now().minusYears(1),
            configJson = """{"monto": 8000.0}""",
            creadoPor = admin
        )
        tarifaRubroRepository.saveAll(listOf(tarifaAgua, tarifaAdmin, tarifaSeguridad))

        // 4. Crear Periodos
        val now = LocalDate.now()
        val periodos = mutableListOf<Periodo>()
        // Crear 6 periodos anteriores cerrados
        for (i in 6 downTo 1) {
            val date = now.minusMonths(i.toLong())
            val p = Periodo(
                anio = date.year.toShort(),
                mes = date.monthValue.toShort(),
                fechaApertura = date.withDayOfMonth(1),
                fechaCierre = date.withDayOfMonth(date.lengthOfMonth()),
                estado = EstadoPeriodo.CERRADO
            )
            periodos.add(p)
        }
        // Periodo actual abierto
        val periodoActual = Periodo(
            anio = now.year.toShort(),
            mes = now.monthValue.toShort(),
            fechaApertura = now.withDayOfMonth(1),
            estado = EstadoPeriodo.ABIERTO
        )
        periodos.add(periodoActual)
        periodoRepository.saveAll(periodos)

        // 5. Crear 52 Unidades y sus Medidores y Condóminos
        val apellidos = listOf("Madrigal", "González", "Rodríguez", "Mata", "Montenegro", "Vargas", "Mora", "Castro", "Sánchez", "Chaves", "Brenes", "Ureña", "Quesada", "Solano", "Araya", "Herrera", "Fernández", "Pérez")
        val nombres = listOf("Juan", "María", "Carlos", "Ana", "Luis", "Elena", "Pedro", "Laura", "Jorge", "Sofía", "Andrés", "Lucía", "Diego", "Carmen", "Mario", "Silvia", "José", "Gabriela")

        val unidades = mutableListOf<Unidad>()
        val medidores = mutableListOf<Medidor>()
        val condominos = mutableListOf<Condomino>()

        for (i in 1..52) {
            val numCasa = i.toString()
            val propNombre = "${nombres[Random.nextInt(nombres.size)]} ${apellidos[Random.nextInt(apellidos.size)]} ${apellidos[Random.nextInt(apellidos.size)]}"
            
            val unidad = Unidad(
                numero = numCasa,
                nombrePropietario = propNombre,
                email = "casa$numCasa@condominio.cr",
                telefono = "+506 8${Random.nextInt(1000000, 9999999)}",
                empresa = if (Random.nextFloat() < 0.15f) "Inversiones Casa $numCasa S.A." else null
            )
            unidades.add(unidad)
        }
        unidadRepository.saveAll(unidades)

        unidades.forEach { u ->
            val medidor = Medidor(
                unidad = u,
                codigoInterno = "MED-${u.numero}",
                activo = true,
                fechaInstalacion = LocalDate.now().minusYears(1)
            )
            medidores.add(medidor)

            // Crear usuario condómino
            val uUser = Usuario(
                nombre = u.nombrePropietario,
                email = u.email!!,
                passwordHash = passwordEncoder.encode("casa${u.numero}"),
                rol = Rol.CONDOMINO,
                activo = true
            )
            usuarioRepository.save(uUser)

            val condomino = Condomino(
                usuario = uUser,
                unidad = u
            )
            condominos.add(condomino)
        }
        medidorRepository.saveAll(medidores)
        condominoRepository.saveAll(condominos)

        // 6. Crear lecturas de medidor e iniciales
        val lecturas = mutableListOf<LecturaMedidor>()
        
        medidores.forEach { medidor ->
            // Lectura inicial hace 6 meses
            val valInicial = BigDecimal(Random.nextInt(100, 300))
            val lectInicial = LecturaMedidor(
                medidor = medidor,
                tipo = TipoLectura.INICIAL,
                fechaLectura = LocalDate.now().minusMonths(6).withDayOfMonth(1),
                valorM3 = valInicial,
                tomadaPor = admin,
                subidaEn = LocalDateTime.now().minusMonths(6)
            )
            lecturas.add(lectInicial)

            // Lecturas regulares para periodos pasados
            var ultimoValor = valInicial
            for (pIndex in 0 until periodos.size - 1) {
                val periodo = periodos[pIndex]
                val consumo = BigDecimal(Random.nextInt(10, 45))
                val nuevoValor = ultimoValor.add(consumo)
                val lectRegular = LecturaMedidor(
                    medidor = medidor,
                    periodo = periodo,
                    tipo = TipoLectura.REGULAR,
                    fechaLectura = LocalDate.of(periodo.anio.toInt(), periodo.mes.toInt(), 28),
                    valorM3 = nuevoValor,
                    consumoM3 = consumo,
                    tomadaPor = tecnico,
                    subidaEn = LocalDateTime.of(periodo.anio.toInt(), periodo.mes.toInt(), 28, 10, 0)
                )
                lecturas.add(lectRegular)
                ultimoValor = nuevoValor
            }

            // Lectura del periodo actual ABIERTO
            // Vamos a registrar lecturas para el 87% de las unidades (unas 45 unidades de las 52)
            // de modo que el dashboard empiece con un estado real de 87% recorrido!
            if (medidor.unidad.numero.toInt() <= 45) {
                val consumo = BigDecimal(Random.nextInt(10, 50))
                val nuevoValor = ultimoValor.add(consumo)
                
                // Simular una anomalía en casa 8 (+278%)
                val finalConsumo = if (medidor.unidad.numero == "8") BigDecimal(220) else consumo
                val finalValor = if (medidor.unidad.numero == "8") ultimoValor.add(finalConsumo) else nuevoValor

                val lectActual = LecturaMedidor(
                    medidor = medidor,
                    periodo = periodoActual,
                    tipo = TipoLectura.REGULAR,
                    fechaLectura = LocalDate.now().minusDays(2),
                    valorM3 = finalValor,
                    consumoM3 = finalConsumo,
                    tomadaPor = tecnico,
                    subidaEn = LocalDateTime.now().minusDays(2),
                    fotoUrl = "lecturas/casa_${medidor.unidad.numero}_junio.webp"
                )
                lecturas.add(lectActual)
            }
        }
        lecturaMedidorRepository.saveAll(lecturas)

        // 7. Generar cobros para periodos anteriores (Cerrados) y algunos para el actual (Borrador)
        val cobros = mutableListOf<Cobro>()
        
        // Cobros para periodos anteriores
        for (pIndex in 0 until periodos.size - 1) {
            val periodo = periodos[pIndex]
            unidades.forEach { unidad ->
                val medidor = medidores.find { it.unidad.id == unidad.id }!!
                val lectura = lecturas.find { it.medidor.id == medidor.id && it.periodo?.id == periodo.id }
                
                val consumoM3 = lectura?.consumoM3 ?: BigDecimal.ZERO
                // Cálculo simple de agua para el seed
                val aguaSubtotal = consumoM3.multiply(BigDecimal(1250))
                val adminSubtotal = BigDecimal(15000)
                val segSubtotal = BigDecimal(8000)
                val totalCobros = aguaSubtotal.add(adminSubtotal).add(segSubtotal)

                val cobro = Cobro(
                    unidad = unidad,
                    periodo = periodo,
                    saldoMonetarioAnterior = BigDecimal.ZERO,
                    totalCobros = totalCobros,
                    totalPagar = totalCobros,
                    estado = if (Random.nextFloat() < 0.90f) EstadoCobro.PAGADO else EstadoCobro.MORA
                )
                cobros.add(cobro)
            }
        }

        // Cobros en estado BORRADOR para el periodo actual para las unidades con lectura registrada
        unidades.forEach { unidad ->
            val medidor = medidores.find { it.unidad.id == unidad.id }!!
            val lectura = lecturas.find { it.medidor.id == medidor.id && it.periodo?.id == periodoActual.id }
            
            if (lectura != null) {
                val consumoM3 = lectura.consumoM3 ?: BigDecimal.ZERO
                val aguaSubtotal = consumoM3.multiply(BigDecimal(1250))
                val adminSubtotal = BigDecimal(15000)
                val segSubtotal = BigDecimal(8000)
                val totalCobros = aguaSubtotal.add(adminSubtotal).add(segSubtotal)

                val cobro = Cobro(
                    unidad = unidad,
                    periodo = periodoActual,
                    saldoMonetarioAnterior = BigDecimal.ZERO,
                    totalCobros = totalCobros,
                    totalPagar = totalCobros,
                    estado = EstadoCobro.BORRADOR
                )
                cobros.add(cobro)
            }
        }
        
        cobroRepository.saveAll(cobros)

        // Generar items de cobro
        val itemsCobro = mutableListOf<ItemCobro>()
        cobros.forEach { cobro ->
            val medidor = medidores.find { it.unidad.id == cobro.unidad.id }!!
            val lectura = lecturas.find { it.medidor.id == medidor.id && it.periodo?.id == cobro.periodo.id }
            val consumoM3 = lectura?.consumoM3 ?: BigDecimal.ZERO
            
            itemsCobro.add(ItemCobro(
                cobro = cobro,
                rubro = rubroAgua,
                descripcion = "Consumo de Agua (${consumoM3} m³)",
                cantidad = consumoM3,
                precioUnitario = BigDecimal(1250),
                subtotal = consumoM3.multiply(BigDecimal(1250))
            ))
            
            itemsCobro.add(ItemCobro(
                cobro = cobro,
                rubro = rubroAdmin,
                descripcion = "Cuota de Administración Base",
                cantidad = BigDecimal.ONE,
                precioUnitario = BigDecimal(15000),
                subtotal = BigDecimal(15000)
            ))
            
            itemsCobro.add(ItemCobro(
                cobro = cobro,
                rubro = rubroSeguridad,
                descripcion = "Vigilancia y Seguridad",
                cantidad = BigDecimal.ONE,
                precioUnitario = BigDecimal(8000),
                subtotal = BigDecimal(8000)
            ))
        }
        itemCobroRepository.saveAll(itemsCobro)

        logger.info("Siembra de datos de desarrollo completada exitosamente!")
    }
}
