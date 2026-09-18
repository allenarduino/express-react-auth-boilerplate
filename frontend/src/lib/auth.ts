/**
 * Session helpers.
 *
 * The session lives in httpOnly cookies set by the API. It is not
 * stored in localStorage. JWT-in-localStorage is a known shortcut that
 * lets XSS steal the session.
 */

import api from './api'

export async function logoutSession(): Promise<void> {
    try {
        await api.post('/api/auth/logout')
    } catch {
        // Cookie is cleared server-side when possible; local state still resets.
    }
}
