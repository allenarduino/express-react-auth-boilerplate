import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api, { getApiErrorMessage } from '../lib/api'
import { AuthError, AuthLayout, AuthSubmitButton, authInputClassName } from '../components/AuthLayout'

const resetPasswordSchema = z
    .object({
        email: z.string().email('Enter the email for this account'),
        password: z.string().min(6, 'Password must be at least 6 characters long'),
        confirmPassword: z.string().min(6, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [token, setToken] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    })

    useEffect(() => {
        const tokenParam = searchParams.get('token')
        if (!tokenParam) {
            setSubmitError('Invalid or missing reset token. Please request a new password reset.')
            return
        }
        setToken(tokenParam)
    }, [searchParams])

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) return
        setIsSubmitting(true)
        setSubmitError(null)

        try {
            await api.post('/api/auth/reset-password', {
                email: data.email.trim().toLowerCase(),
                token,
                password: data.password,
            })
            setSubmitSuccess(true)
        } catch (error) {
            setSubmitError(getApiErrorMessage(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    if (submitSuccess) {
        return (
            <AuthLayout title="Password reset successful" subtitle="You can now sign in with your new password.">
                <Link
                    to="/login"
                    className="flex w-full justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    Go to login
                </Link>
            </AuthLayout>
        )
    }

    if (!token) {
        return (
            <AuthLayout title="Invalid reset link" subtitle="This password reset link is invalid or has expired.">
                <Link
                    to="/forgot-password"
                    className="flex w-full justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    Request a new reset link
                </Link>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout title="Reset your password" subtitle="Confirm your email and choose a new password.">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {submitError && <AuthError message={submitError} />}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email address
                    </label>
                    <input
                        {...register('email')}
                        type="email"
                        id="email"
                        autoComplete="email"
                        className={authInputClassName}
                        placeholder="Enter your email"
                    />
                    {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        New password
                    </label>
                    <input
                        {...register('password')}
                        type="password"
                        id="password"
                        autoComplete="new-password"
                        className={authInputClassName}
                        placeholder="Enter your new password"
                    />
                    {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>}
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm new password
                    </label>
                    <input
                        {...register('confirmPassword')}
                        type="password"
                        id="confirmPassword"
                        autoComplete="new-password"
                        className={authInputClassName}
                        placeholder="Confirm your new password"
                    />
                    {errors.confirmPassword && (
                        <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                </div>
                <AuthSubmitButton isSubmitting={isSubmitting} idleLabel="Reset password" busyLabel="Resetting..." />
                <div className="text-center">
                    <Link to="/login" className="font-medium text-gray-600 hover:text-gray-500">
                        Back to login
                    </Link>
                </div>
            </form>
        </AuthLayout>
    )
}
