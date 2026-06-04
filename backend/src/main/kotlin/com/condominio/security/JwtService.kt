package com.condominio.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Service
import java.util.Date
import java.util.function.Function
import javax.crypto.SecretKey

@Service
class JwtService(private val jwtProperties: JwtProperties) {

    private val signingKey: SecretKey by lazy {
        Keys.hmacShaKeyFor(jwtProperties.secret.toByteArray(Charsets.UTF_8))
    }

    fun generateToken(userDetails: UserDetails): String {
        return buildToken(userDetails, jwtProperties.expiration)
    }

    fun generateRefreshToken(userDetails: UserDetails): String {
        return buildToken(userDetails, jwtProperties.refreshExpiration)
    }

    private fun buildToken(userDetails: UserDetails, expiration: Long): String {
        val now = Date()
        val authorities = userDetails.authorities.joinToString(",") { it.authority }
        return Jwts.builder()
            .subject(userDetails.username)
            .claim("roles", authorities)
            .issuedAt(now)
            .expiration(Date(now.time + expiration))
            .signWith(signingKey, Jwts.SIG.HS256)
            .compact()
    }

    fun extractUsername(token: String): String {
        return extractClaim(token, Claims::getSubject)
    }

    fun <T> extractClaim(token: String, claimsResolver: Function<Claims, T>): T {
        val claims = extractAllClaims(token)
        return claimsResolver.apply(claims)
    }

    fun isTokenValid(token: String, userDetails: UserDetails): Boolean {
        return try {
            val username = extractUsername(token)
            username == userDetails.username && !isTokenExpired(token)
        } catch (e: Exception) {
            false
        }
    }

    private fun isTokenExpired(token: String): Boolean {
        return extractExpiration(token).before(Date())
    }

    private fun extractExpiration(token: String): Date {
        return extractClaim(token, Claims::getExpiration)
    }

    private fun extractAllClaims(token: String): Claims {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .payload
    }
}
