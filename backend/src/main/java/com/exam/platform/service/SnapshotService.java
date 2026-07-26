package com.exam.platform.service;

import com.exam.platform.entity.ExamAttempt;
import com.exam.platform.entity.ExamSnapshot;
import com.exam.platform.exception.ResourceNotFoundException;
import com.exam.platform.repository.ExamAttemptRepository;
import com.exam.platform.repository.ExamSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SnapshotService {

    private final ExamAttemptRepository attemptRepository;
    private final ExamSnapshotRepository snapshotRepository;
    /**
     * Storage Directory Path.
     * DEPLOYMENT ARCHITECTURE NOTE:
     * Ephemeral local filesystems (like default Render free tier containers) do NOT persist files across redeploys.
     * For production deployments on Render or Kubernetes:
     * 1) Attach a Render Persistent Disk mounted at e.g. '/var/data/snapshots' and set APP_SNAPSHOT_STORAGE_DIR=/var/data/snapshots.
     * 2) Or plug in an S3-compatible Object Storage Service (AWS S3, Cloudflare R2, GCP Bucket) adapter here.
     */
    @Value("${app.snapshot.storage-dir:./snapshots}")
    private String storageDir;

    @Transactional
    public Map<String, Object> saveSnapshot(UUID attemptId, MultipartFile file, UUID userId) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamAttempt", "id", attemptId));

        if (!attempt.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized attempt snapshot upload");
        }

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Snapshot file cannot be empty");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Snapshot file size exceeds maximum limit of 5 MB");
        }

        String contentType = file.getContentType();
        if (contentType != null && !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Invalid content type for webcam snapshot. Expected image/*, received: " + contentType);
        }

        try {
            // Ensure attempt-specific directory exists: ./snapshots/{attemptId}/
            Path dirPath = Paths.get(storageDir, attemptId.toString());
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }

            String filename = "snap_" + System.currentTimeMillis() + ".jpg";
            Path filePath = dirPath.resolve(filename);

            file.transferTo(filePath.toFile());

            ExamSnapshot snapshot = ExamSnapshot.builder()
                    .attempt(attempt)
                    .filePath(filePath.toAbsolutePath().toString())
                    .build();
            ExamSnapshot saved = snapshotRepository.save(snapshot);

            log.info("Saved webcam snapshot for attempt {} at {}", attemptId, filePath);

            return Map.of(
                "snapshotId", saved.getId(),
                "filePath", saved.getFilePath(),
                "capturedAt", saved.getCapturedAt() != null ? saved.getCapturedAt() : Instant.now()
            );

        } catch (IOException e) {
            log.error("Failed to save webcam snapshot for attempt {}: {}", attemptId, e.getMessage(), e);
            throw new RuntimeException("Failed to store webcam snapshot file", e);
        }
    }
}
