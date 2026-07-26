package com.exam.platform.dto.admin;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleUpdateRequest {

    @NotEmpty(message = "At least one role is required")
    private List<String> roles; // ROLE_STUDENT, ROLE_EXAMINER, ROLE_ADMIN
}
