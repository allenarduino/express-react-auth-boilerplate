import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuthError, AuthLayout } from '../components/AuthLayout'

export const AuthCallbackPage: React.FC = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { setTokenFromCallback } = useAuth()
    const [error, setError] = useState<string | null>(null)
    const processedRef = useRef(false)

    useEffect(() => {
        if (processedRef.current) return
        processedRef.current = true

        const handleCallback = async () => {
            try {
                const token = searchParams.get('token')
                if (!token) {
                    setError('No authentication token received')
                    return
                }
                await setTokenFromCallback(token)
                navigate('/dashboard', { replace: true })
            } catch (err) {
                console.error('OAuth callback error:', err)
                setError('Authentication failed. Please try again.')
            }
        }

        void handleCallback()
    }, [searchParams, navigate, setTokenFromCallback])

    if (error) {
        return (
            <AuthLayout title="Authentication error">
                <AuthError message={error} />
                <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="flex w-full justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    Back to login
                </button>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout title="Completing authentication..." subtitle="Please wait while we sign you in.">
            <div className="flex justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
            </div>
        </AuthLayout>
    )
}
