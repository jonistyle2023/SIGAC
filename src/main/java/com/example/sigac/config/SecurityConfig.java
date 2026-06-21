package com.example.sigac.config;

import com.example.sigac.security.JwtAuthenticationFilter;
import com.example.sigac.security.CustomUserDetailsService;
import com.example.sigac.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
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

import java.util.List;

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
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "http://127.0.0.1:3000"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .exceptionHandling(exception -> exception
                    .authenticationEntryPoint((request, response, authException) -> {
                        response.setStatus(401);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"No autorizado\", \"mensaje\": \"" + authException.getMessage() + "\"}");
                    }))
            .sessionManagement(session -> session
                    .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    // Rutas públicas - todos los endpoints públicos de autenticación
                    .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/register/").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/login/").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/validate-token", "/api/auth/validate-token/").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/bootstrap-admin", "/api/auth/bootstrap-admin/").permitAll()
                    .requestMatchers("/api-docs").permitAll()
                    .requestMatchers("/swagger-ui.html").permitAll()
                    .requestMatchers("/swagger-ui/**").permitAll()
                    .requestMatchers("/v3/api-docs/**").permitAll()
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
                    .anyRequest().authenticated()
            );

        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter();
        jwtFilter.setTokenProvider(jwtTokenProvider);
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
