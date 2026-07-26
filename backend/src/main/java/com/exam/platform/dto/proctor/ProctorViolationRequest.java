package com.exam.platform.dto.proctor;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProctorViolationRequest {

    @NotBlank(message = "Violation type is required")
    private String violationType; // TAB_SWITCH, FULLSCREEN_EXIT, FACE_MISSING, MULTIPLE_FACES

    private String details;
}
