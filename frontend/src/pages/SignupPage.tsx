import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuthError, AuthLayout, AuthSubmitButton, authInputClassName } from '../components/AuthLayout'
import { AuthGoogleButton } from '../components/AuthGoogleButton'
import { BrandMark } from '../components/BrandMark'

const signupSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
})

type SignupFormData = z.infer<typeof signupSchema>

export const SignupPage: React.FC = () => {
    const { signup, isAuthenticated, isLoading } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        shouldUnregister: false,
    })

    const getRedirectPath = () => {
        const fromPath = (location.state as { from?: { pathname?: string; search?: string } })?.from
        if (fromPath?.pathname) {
            return `${fromPath.pathname}${fromPath.search || ''}`
        }
        return '/dashboard'
    }

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate(getRedirectPath(), { replace: true })
        }
    }, [isAuthenticated, isLoading, navigate, location.state])

    const onValidSubmit = async (data: SignupFormData) => {
        setIsSubmitting(true)
        setSubmitError(null)

        try {
            await signup({
                email: data.email,
                password: data.password,
                name: data.name,
            })
            setIsSuccess(true)
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Signup failed. Please try again.'
            setSubmitError(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading && !isSubmitting) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
            </div>
        )
    }

    if (isSuccess) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
                <div className="w-full max-w-md space-y-8 text-center">
                    <BrandMark size="auth" className="justify-center" />
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
                    <p className="text-sm text-gray-600">
                        We&apos;ve sent a verification link to your email address. Click the link to verify your
                        account, then sign in.
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsSuccess(false)}
                        className="font-medium text-gray-600 hover:text-gray-500"
                    >
                        Try signing up again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <AuthLayout
            title="Create your account"
            subtitle={
                <>
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-gray-600 hover:text-gray-500">
                        Sign in
                    </Link>
                </>
            }
        >
            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onValidSubmit)} noValidate>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Full name
                        </label>
                        <input
                            {...register('name')}
                            id="name"
                            type="text"
                            autoComplete="name"
                            className={authInputClassName}
                            placeholder="Enter your full name"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                    </div>
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
                            autoComplete="new-password"
                            className={authInputClassName}
                            placeholder="Enter your password"
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                    </div>
                </div>

                {submitError && <AuthError message={submitError} />}

                <div className="space-y-4">
                    <AuthSubmitButton
                        isSubmitting={isSubmitting}
                        idleLabel="Create account"
                        busyLabel="Creating account..."
                    />
                    <AuthGoogleButton />
                </div>
            </form>
        </AuthLayout>
    )
}
