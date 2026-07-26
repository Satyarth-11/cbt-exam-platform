package com.exam.platform.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private UUID id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private boolean active;
    private boolean emailVerified;
    private List<String> roles;
    private List<String> permissions;
}
