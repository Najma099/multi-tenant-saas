export interface User {
    id: number,
    name: string;
    email?: string;    
}

export interface Tokens {
    refreshToken: string;
    accessToken: string;
}
export interface AuthSignin {
    user: User
    tokens: Tokens 
}

export interface AuthResponse {
  tokens: Tokens;
  user: {
    id: number;
    name: string;
    email: string;
  };
}
