/**
 * Authentication token management utilities
 *
 * This starter stores the JWT in localStorage for a simple SPA flow.
 * An httpOnly cookie session is a later upgrade if you want XSS to be
 * unable to read the token.
 */

const AUTH_TOKEN_KEY = 'auth_token'

export function setToken(token: string | null): void {
    if (token === null) {
        localStorage.removeItem(AUTH_TOKEN_KEY)
    } else {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
    }
}

export function getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function isAuthenticated(): boolean {
    const token = getToken()
    return token !== null && token.trim() !== ''
}

export function clearToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY)
}

export type AuthToken = string | null
export type AuthState = boolean
