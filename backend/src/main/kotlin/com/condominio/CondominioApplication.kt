package com.condominio

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication

@SpringBootApplication
@ConfigurationPropertiesScan
class CondominioApplication

fun main(args: Array<String>) {
    runApplication<CondominioApplication>(*args)
}
