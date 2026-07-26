package com.exam.platform.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

public class JdbcUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String url = environment.getProperty("SPRING_DATASOURCE_URL");
        if (url == null || url.isBlank()) {
            url = environment.getProperty("spring.datasource.url");
        }

        if (url != null && !url.isBlank()) {
            String rawUrl = url.trim();
            // Handle postgresql:// or jdbc:postgresql:// with user info
            if (rawUrl.startsWith("postgresql://") || (rawUrl.startsWith("jdbc:postgresql://") && rawUrl.contains("@"))) {
                try {
                    String uriString = rawUrl.startsWith("jdbc:") ? rawUrl.substring(5) : rawUrl;
                    URI uri = new URI(uriString);

                    String host = uri.getHost();
                    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                    String path = uri.getPath();

                    String cleanJdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;

                    Map<String, Object> map = new HashMap<>();
                    map.put("spring.datasource.url", cleanJdbcUrl);
                    map.put("SPRING_DATASOURCE_URL", cleanJdbcUrl);

                    if (uri.getUserInfo() != null && uri.getUserInfo().contains(":")) {
                        String[] userInfo = uri.getUserInfo().split(":", 2);
                        map.put("spring.datasource.username", userInfo[0]);
                        map.put("SPRING_DATASOURCE_USERNAME", userInfo[0]);
                        map.put("spring.datasource.password", userInfo[1]);
                        map.put("SPRING_DATASOURCE_PASSWORD", userInfo[1]);
                    }

                    System.out.println("[JdbcUrlPostProcessor] Formatted Clean JDBC URL: " + cleanJdbcUrl);
                    environment.getPropertySources().addFirst(new MapPropertySource("jdbcUrlFix", map));
                } catch (Exception e) {
                    System.err.println("[JdbcUrlPostProcessor] Failed to parse URI: " + e.getMessage());
                }
            }
        }
    }
}
