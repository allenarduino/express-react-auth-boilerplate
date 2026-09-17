export const APP_NAME = 'Auth Starter'
export const APP_FULL_NAME = 'Express React Auth Starter'
export const APP_TAGLINE = 'A production-ready authentication starter for Express and React.'

export function getGoogleAuthUrl() {
    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || ''
    return `${String(apiBase).replace(/\/$/, '')}/api/auth/google`
}
