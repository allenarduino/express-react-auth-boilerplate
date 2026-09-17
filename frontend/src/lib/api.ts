import axios, { AxiosInstance, AxiosResponse } from 'axios'

/**
 * API client configuration
 */
export const API_BASE_URL = String(
    (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4001'
).replace(/\/$/, '')

/**
 * Create Axios instance with base configuration.
 * withCredentials sends the httpOnly auth cookie on every request.
 */
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})

/**
 * Response interceptor for error handling
 */
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response
    },
    (error) => {
        return Promise.reject(error)
    }
)

/**
 * Example usage:
 * 
 * import api from './lib/api'
 * 
 * // GET request
 * const response = await api.get('/api/user/profile')
 * 
 * // POST request with data
 * const loginResponse = await api.post('/api/auth/login', {
 *   email: 'user@example.com',
 *   password: 'password123'
 * })
 * 
 * // PUT request
 * const updateResponse = await api.put('/api/user/profile', {
 *   name: 'John Doe',
 *   bio: 'Software Developer'
 * })
 * 
 * // DELETE request
 * await api.delete('/api/user/profile')
 * 
 * // Request with custom config
 * const customResponse = await api.get('/api/data', {
 *   params: { page: 1, limit: 10 },
 *   timeout: 5000
 * })
 */

// Export the configured API instance
export default api

// Export types for better TypeScript support
export type ApiResponse<T = any> = AxiosResponse<T>
export type ApiError = {
    message: string
    status?: number
    data?: any
}

// Helper function to extract error message from API errors
export function getApiErrorMessage(error: any): string {
    if (error.response?.data?.message) {
        return error.response.data.message
    }
    if (error.response?.data?.error) {
        return error.response.data.error
    }
    if (error.message) {
        return error.message
    }
    return 'An unexpected error occurred'
}

export type UserProfileData = {
    id: string
    email: string
    isEmailVerified: boolean
    profile: {
        name: string | null
        bio: string | null
        avatarUrl: string | null
        website: string | null
    }
}

export type ProfileUpdatePayload = {
    name?: string | null
    bio?: string | null
    avatarUrl?: string | null
    website?: string | null
}

export async function fetchUserProfile(): Promise<UserProfileData> {
    const response = await api.get<{ success: boolean; data: UserProfileData; message?: string }>(
        '/api/user/me'
    )
    const body = response.data
    if (!body?.success || !body.data) {
        throw new Error(body?.message || 'Failed to load profile')
    }
    return body.data
}

export async function updateUserProfile(payload: ProfileUpdatePayload): Promise<UserProfileData> {
    const response = await api.put<{ success: boolean; data: UserProfileData; message?: string }>(
        '/api/user/me/profile',
        payload
    )
    const body = response.data
    if (!body?.success || !body.data) {
        throw new Error(body?.message || 'Failed to update profile')
    }
    return body.data
}

export async function uploadUserAvatar(image: string): Promise<{ url: string; profile: UserProfileData }> {
    const response = await api.post<{
        success: boolean
        data: { url: string; profile: UserProfileData }
        message?: string
    }>('/api/user/me/avatar', { image })
    const body = response.data
    if (!body?.success || !body.data) {
        throw new Error(body?.message || 'Failed to upload photo')
    }
    return body.data
}

export async function deleteAccount(confirmEmail: string): Promise<void> {
    const response = await api.delete('/api/user/me', {
        data: { confirmEmail },
    })
    if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to delete account')
    }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
    })
    if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to update password')
    }
}
