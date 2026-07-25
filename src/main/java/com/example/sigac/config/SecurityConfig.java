package com.example.sigac.config;

import com.example.sigac.security.JwtAuthenticationFilter;
import com.example.sigac.security.CustomUserDetailsService;
import com.example.sigac.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(
        securedEnabled = true,
        jsr250Enabled = true,
        prePostEnabled = true
)
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;
    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper;

    @Value("${cors.allowed-origins}")
    private String allowedOriginsRaw;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin"));
        configuration.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .exceptionHandling(exception -> exception
                    .authenticationEntryPoint((request, response, authException) ->
                            writeError(response, request, HttpServletResponse.SC_UNAUTHORIZED,
                                    "No autorizado", "Debe autenticarse para acceder a este recurso"))
                    .accessDeniedHandler((request, response, accessDeniedException) ->
                            writeError(response, request, HttpServletResponse.SC_FORBIDDEN,
                                    "Acceso denegado", "No tiene permisos para realizar esta acción")))
            .sessionManagement(session -> session
                    .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    // Health check de ECS Fargate — sin autenticación
                    .requestMatchers("/actuator/health").permitAll()
                    // Rutas públicas - todos los endpoints públicos de autenticación
                    .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/register/").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/login/").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/validate-token", "/api/auth/validate-token/").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/bootstrap-admin", "/api/auth/bootstrap-admin/").permitAll()
                    // Rutas protegidas
                    .requestMatchers(HttpMethod.GET, "/api/usuarios/**").hasAnyRole("CIUDADANO", "ADMINISTRADOR", "ENTIDAD_PUBLICA")
                    // Perfil propio: cualquier usuario autenticado (debe ir antes del wildcard admin)
                    .requestMatchers(HttpMethod.PUT, "/api/usuarios/perfil").hasAnyRole("CIUDADANO", "ADMINISTRADOR", "ENTIDAD_PUBLICA")
                    .requestMatchers(HttpMethod.PUT, "/api/usuarios/perfil/password").hasAnyRole("CIUDADANO", "ADMINISTRADOR", "ENTIDAD_PUBLICA")
                    .requestMatchers(HttpMethod.PUT, "/api/usuarios/**").hasRole("ADMINISTRADOR")
                    .requestMatchers(HttpMethod.DELETE, "/api/usuarios/**").hasRole("ADMINISTRADOR")
                    .requestMatchers(HttpMethod.POST, "/api/auth/register-admin", "/api/auth/register-admin/").hasRole("ADMINISTRADOR")
                    .requestMatchers(HttpMethod.POST, "/api/auth/register-entidad", "/api/auth/register-entidad/").hasRole("ADMINISTRADOR")
                    // Entidades: GET /activas accesible por entidades; resto solo admin
                    .requestMatchers(HttpMethod.GET, "/api/entidades/activas").hasAnyRole("ADMINISTRADOR", "ENTIDAD_PUBLICA")
                    .requestMatchers(HttpMethod.GET, "/api/entidades/**").hasRole("ADMINISTRADOR")
                    .requestMatchers("/api/entidades/**").hasRole("ADMINISTRADOR")
                    // Incidencias: acceso general autenticado (control fino con @PreAuthorize en servicios)
                    .requestMatchers("/api/incidencias/**").authenticated()
                    // Auditoría: solo administradores
                    .requestMatchers(HttpMethod.GET, "/api/audit/**").hasRole("ADMINISTRADOR")
                    // Notificaciones: cualquier usuario autenticado (filtradas por destinatario en el servicio)
                    .requestMatchers("/api/notificaciones/**").authenticated()
                    // Reportería y analítica: solo administradores
                    .requestMatchers("/api/reportes/**").hasRole("ADMINISTRADOR")
                    .anyRequest().authenticated()
            );

        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter();
        jwtFilter.setTokenProvider(jwtTokenProvider);
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Mismo formato que GlobalExceptionHandler.ErrorResponse — así 401/403 emitidos por Spring Security
    // (antes de llegar a un @RestController) devuelven el mismo JSON uniforme que el resto de la API.
    private void writeError(HttpServletResponse response, HttpServletRequest request, int status, String error, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status);
        body.put("error", error);
        body.put("message", message);
        body.put("path", request.getRequestURI());

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
