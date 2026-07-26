package com.exam.platform.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

public class JdbcUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String url = environment.getProperty("SPRING_DATASOURCE_URL");
        if (url == null) {
            url = environment.getProperty("spring.datasource.url");
        }

        if (url != null && url.startsWith("postgresql://")) {
            String jdbcUrl = "jdbc:" + url;
            System.out.println("[JdbcUrlPostProcessor] Converting URL to JDBC format: " + jdbcUrl);
            Map<String, Object> map = new HashMap<>();
            map.put("spring.datasource.url", jdbcUrl);
            map.put("SPRING_DATASOURCE_URL", jdbcUrl);
            environment.getPropertySources().addFirst(new MapPropertySource("jdbcUrlFix", map));
        }
    }
}
