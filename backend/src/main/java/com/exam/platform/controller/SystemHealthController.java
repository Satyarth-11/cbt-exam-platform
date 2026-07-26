package com.exam.platform.controller;

import com.exam.platform.dto.ApiResponse;
import com.exam.platform.websocket.SignalingHandler;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;

@RestController
@RequestMapping("/api/v1/admin/system-health")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
public class SystemHealthController {

    private final DataSource dataSource;

    @Data
    @Builder
    public static class TelemetryResponse {
        private int dbPoolActive;
        private int dbPoolIdle;
        private int dbPoolTotal;
        private int dbPoolMax;

        private long heapMemoryUsedMb;
        private long heapMemoryMaxMb;
        private long nonHeapMemoryUsedMb;

        private long uptimeSeconds;
        private int activeCandidateWebSockets;
        private int activeProctorWebSockets;
        private String schedulerStatus;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<TelemetryResponse>> getSystemTelemetry() {
        int activeConn = 0;
        int idleConn = 0;
        int totalConn = 0;
        int maxConn = 10;

        if (dataSource instanceof HikariDataSource hikariDataSource) {
            HikariPoolMXBean poolBean = hikariDataSource.getHikariPoolMXBean();
            if (poolBean != null) {
                activeConn = poolBean.getActiveConnections();
                idleConn = poolBean.getIdleConnections();
                totalConn = poolBean.getTotalConnections();
            }
            maxConn = hikariDataSource.getMaximumPoolSize();
        }

        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
        long heapUsedMb = memoryMXBean.getHeapMemoryUsage().getUsed() / (1024 * 1024);
        long heapMaxMb = memoryMXBean.getHeapMemoryUsage().getMax() / (1024 * 1024);
        long nonHeapUsedMb = memoryMXBean.getNonHeapMemoryUsage().getUsed() / (1024 * 1024);

        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;

        TelemetryResponse telemetry = TelemetryResponse.builder()
                .dbPoolActive(activeConn)
                .dbPoolIdle(idleConn)
                .dbPoolTotal(totalConn)
                .dbPoolMax(maxConn)
                .heapMemoryUsedMb(heapUsedMb)
                .heapMemoryMaxMb(heapMaxMb > 0 ? heapMaxMb : 1024)
                .nonHeapMemoryUsedMb(nonHeapUsedMb)
                .uptimeSeconds(uptimeSeconds)
                .activeCandidateWebSockets(SignalingHandler.getActiveCandidateCount())
                .activeProctorWebSockets(SignalingHandler.getActiveProctorCount())
                .schedulerStatus("ACTIVE")
                .build();

        return ResponseEntity.ok(ApiResponse.success(telemetry));
    }
}
