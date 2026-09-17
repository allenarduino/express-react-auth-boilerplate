import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getApiErrorMessage } from '../lib/api'
import { logoutSession } from '../lib/auth'

export interface User {
    id: string
    email: string
    name?: string
    googlePicture?: string
    isEmailVerified?: boolean
    authProvider?: string
    hasPassword?: boolean
    profile?: {
        name?: string
        avatarUrl?: string
    }
}

export interface LoginCredentials {
    email: string
    password: string
    rememberMe?: boolean
}

export interface SignupCredentials {
    email: string
    password: string
    name?: string
}

export interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (credentials: LoginCredentials) => Promise<void>
    signup: (credentials: SignupCredentials) => Promise<{ message: string }>
    logout: (options?: { to?: string; state?: unknown }) => void
    completeOAuthSession: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const navigate = useNavigate()

    const isAuthenticated = !!user

    const fetchUserProfile = async () => {
        const userResponse = await api.get('/api/auth/me')
        const profileResponse = await api.get('/api/user/me')
        const profileData = profileResponse.data.data
        setUser({
            ...userResponse.data.data,
            googlePicture: userResponse.data.data.googlePicture || profileData.googlePicture,
            name: userResponse.data.data.name || profileData.googleName || profileData.profile?.name,
            profile: profileData.profile,
        })
    }

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                await fetchUserProfile()
            } catch {
                setUser(null)
            } finally {
                setIsLoading(false)
            }
        }

        void initializeAuth()
    }, [])

    const login = async (credentials: LoginCredentials) => {
        try {
            setIsLoading(true)
            await api.post('/api/auth/login', {
                email: credentials.email,
                password: credentials.password,
                rememberMe: Boolean(credentials.rememberMe),
            })
            await fetchUserProfile()
        } catch (error) {
            throw new Error(getApiErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    const signup = async (credentials: SignupCredentials) => {
        try {
            const response = await api.post('/api/auth/signup', credentials)
            return response.data
        } catch (error) {
            throw new Error(getApiErrorMessage(error))
        }
    }

    const logout = (options?: { to?: string; state?: unknown }) => {
        void logoutSession()
        setUser(null)
        navigate(options?.to ?? '/login', { replace: true, state: options?.state })
    }

    const completeOAuthSession = async () => {
        try {
            setIsLoading(true)
            await fetchUserProfile()
        } catch (error) {
            setUser(null)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const refreshUser = async () => {
        await fetchUserProfile()
    }

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated,
        login,
        signup,
        logout,
        completeOAuthSession,
        refreshUser,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
