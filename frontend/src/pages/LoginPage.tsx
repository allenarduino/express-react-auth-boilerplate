import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuthError, AuthLayout, AuthSubmitButton, authInputClassName } from '../components/AuthLayout'
import { AuthGoogleButton } from '../components/AuthGoogleButton'
import api, { getApiErrorMessage } from '../lib/api'

const loginSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
    const { login, isAuthenticated, isLoading } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [isResending, setIsResending] = useState(false)
    const [resendMessage, setResendMessage] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const getRedirectPath = () => {
        const fromPath = (location.state as { from?: { pathname?: string; search?: string } })?.from
        if (fromPath?.pathname) {
            return `${fromPath.pathname}${fromPath.search || ''}`
        }
        return '/dashboard'
    }

    useEffect(() => {
        if (!isLoading && isAuthenticated && !isSubmitting) {
            navigate(getRedirectPath(), { replace: true })
        }
    }, [isAuthenticated, isLoading, navigate, location.state, isSubmitting])

    if (isLoading && !isSubmitting) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
            </div>
        )
    }

    const needsVerification = Boolean(submitError?.toLowerCase().includes('verify your email'))

    const onSubmit = async (data: LoginFormData) => {
        setIsSubmitting(true)
        setSubmitError(null)
        setResendMessage(null)

        try {
            await login({ email: data.email, password: data.password })
            navigate(getRedirectPath(), { replace: true })
        } catch (error: any) {
            setSubmitError(
                error?.response?.data?.message ||
                    error?.message ||
                    'Login failed. Please check your credentials and try again.'
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleResend = async () => {
        const email = getValues('email')
        if (!email) return
        setIsResending(true)
        try {
            await api.post('/api/auth/resend-verification', { email })
            setResendMessage('Verification email sent. Check your inbox.')
        } catch (error) {
            setResendMessage(getApiErrorMessage(error))
        } finally {
            setIsResending(false)
        }
    }

    return (
        <AuthLayout
            title="Sign in to your account"
            subtitle={
                <>
                    Don&apos;t have an account?{' '}
                    <Link to="/signup" state={location.state} className="font-medium text-gray-600 hover:text-gray-500">
                        Sign up
                    </Link>
                </>
            }
        >
            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email address
                        </label>
                        <input
                            {...register('email')}
                            id="email"
                            type="email"
                            autoComplete="email"
                            className={authInputClassName}
                            placeholder="Enter your email"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            {...register('password')}
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            className={authInputClassName}
                            placeholder="Enter your password"
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                    </div>
                </div>

                <div className="flex items-center justify-end">
                    <Link to="/forgot-password" className="text-sm font-medium text-gray-600 hover:text-gray-500">
                        Forgot your password?
                    </Link>
                </div>

                {submitError && <AuthError message={submitError} />}
                {needsVerification && (
                    <button
                        type="button"
                        onClick={() => void handleResend()}
                        disabled={isResending}
                        className="text-sm font-medium text-gray-700 underline hover:text-gray-900 disabled:opacity-50"
                    >
                        {isResending ? 'Sending…' : 'Resend verification email'}
                    </button>
                )}
                {resendMessage && <p className="text-sm text-gray-600">{resendMessage}</p>}

                <div className="space-y-4">
                    <AuthSubmitButton isSubmitting={isSubmitting} idleLabel="Sign in" busyLabel="Signing in..." />
                    <AuthGoogleButton />
                </div>
            </form>
        </AuthLayout>
    )
}
