package com.exam.platform.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Slf4j
@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSourceProperties dataSourceProperties(DataSourceProperties properties) {
        String url = properties.getUrl();
        if (url != null && url.startsWith("postgresql://")) {
            String jdbcUrl = "jdbc:" + url;
            log.info("Formatting PostgreSQL URL for JDBC driver: {}", jdbcUrl);
            properties.setUrl(jdbcUrl);
        }
        return properties;
    }
}
