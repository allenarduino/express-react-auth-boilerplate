export const APP_NAME = 'Auth Starter'
export const APP_FULL_NAME_PREFIX = 'Node Express and React'
export const APP_FULL_NAME = `${APP_FULL_NAME_PREFIX} ${APP_NAME}`
export const APP_TAGLINE = 'A production-ready authentication starter for Express and React.'

export function getGoogleAuthUrl() {
    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || ''
    return `${String(apiBase).replace(/\/$/, '')}/api/auth/google`
}
