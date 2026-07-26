export type RoleType = 'ROLE_STUDENT' | 'ROLE_EXAMINER' | 'ROLE_ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: RoleType[];
  sessionId?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: RoleType[];
  sessionId: string;
}

export interface UserProfileResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  active: boolean;
  emailVerified: boolean;
  roles: RoleType[];
  permissions: string[];
}
