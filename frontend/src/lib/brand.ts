import { API_BASE_URL } from './api'

export const APP_NAME = 'Auth Starter'
export const APP_FULL_NAME_PREFIX = 'Node Express and React'
export const APP_FULL_NAME = `${APP_FULL_NAME_PREFIX} ${APP_NAME}`
export const APP_TAGLINE = 'A production-ready authentication starter for Express and React.'

export function getGoogleAuthUrl() {
    return `${API_BASE_URL}/api/auth/google`
}
