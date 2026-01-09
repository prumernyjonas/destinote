// types/auth.ts
export interface User {
  uid: string;
  email: string;
  displayName: string;
  nickname?: string;
  nicknameSlug?: string; // URL-friendly verze nickname (bez diakritiky)
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthError {
  code: string;
  message: string;
}
