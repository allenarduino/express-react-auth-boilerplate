import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getApiErrorMessage } from '../lib/api'
import { getToken, setToken, clearToken } from '../lib/auth'

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
        bio?: string
        avatarUrl?: string
        website?: string
    }
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface SignupCredentials {
    email: string
    password: string
    name?: string
}

export interface AuthContextType {
    user: User | null
    token: string | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (credentials: LoginCredentials) => Promise<void>
    signup: (credentials: SignupCredentials) => Promise<{ message: string }>
    logout: (options?: { to?: string; state?: unknown }) => void
    setTokenFromCallback: (token: string) => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [token, setTokenState] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const navigate = useNavigate()

    const isAuthenticated = !!user && !!token

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedToken = getToken()
                if (storedToken) {
                    setTokenState(storedToken)
                    await fetchUserProfile(storedToken)
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error)
                clearToken()
                setTokenState(null)
                setUser(null)
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()
    }, [])

    const fetchUserProfile = async (authToken: string) => {
        const userResponse = await api.get('/api/auth/me', {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        })

        const profileResponse = await api.get('/api/user/me', {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        })

        const profileData = profileResponse.data.data
        const userData = {
            ...userResponse.data.data,
            profile: profileData.profile,
        }

        setUser(userData)
    }

    const login = async (credentials: LoginCredentials) => {
        try {
            setIsLoading(true)
            const response = await api.post('/api/auth/login', credentials)
            const authToken = response.data?.data?.token || response.data?.token

            if (!authToken) {
                throw new Error('No token received from server')
            }

            setToken(authToken)
            setTokenState(authToken)
            await fetchUserProfile(authToken)
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
        clearToken()
        setTokenState(null)
        setUser(null)
        navigate(options?.to ?? '/login', { replace: true, state: options?.state })
    }

    const setTokenFromCallback = async (authToken: string) => {
        try {
            setIsLoading(true)
            setToken(authToken)
            setTokenState(authToken)
            await fetchUserProfile(authToken)
        } catch (error) {
            console.error('Failed to process OAuth callback:', error)
            clearToken()
            setTokenState(null)
            setUser(null)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const refreshUser = async () => {
        if (!token) return
        await fetchUserProfile(token)
    }

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        signup,
        logout,
        setTokenFromCallback,
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
