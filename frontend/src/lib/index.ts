/**
 * Library exports for easy importing
 */

// Auth utilities
export * from './auth'

// API client
export { default as api, getApiErrorMessage, fetchUserProfile, updateUserProfile } from './api'
export type { ApiResponse, ApiError } from './api'
