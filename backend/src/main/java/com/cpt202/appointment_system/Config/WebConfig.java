package com.cpt202.appointment_system.Config;

import java.util.TimeZone;
import javax.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
import com.cpt202.appointment_system.intercepter.AuthenticationInterceptor;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final AuthenticationInterceptor authentication;
    private final String[] origins;
    public WebConfig(AuthenticationInterceptor authentication, @Value("${pawpal.allowed-origins:http://localhost:8081}") String origins) {
        this.authentication = authentication; this.origins = origins.split(",");
    }
    @PostConstruct public void timezone() { TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh")); }
    @Override public void addInterceptors(InterceptorRegistry registry) { registry.addInterceptor(authentication).addPathPatterns("/**"); }
    @Override public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**").allowedOrigins(origins).allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS").allowCredentials(true);
    }
}
