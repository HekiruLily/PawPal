package com.cpt202.appointment_system.Config;

import java.nio.file.Paths;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class UrlConfig implements WebMvcConfigurer {
    @Value("${pawpal.upload-directory:./uploads}") private String uploadDirectory;
    @Override public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**").addResourceLocations(Paths.get(uploadDirectory).toAbsolutePath().normalize().toUri().toString() + "/");
    }
}
