import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api, { getApiErrorMessage } from '../lib/api'
import { AuthError, AuthLayout, AuthSubmitButton, authInputClassName } from '../components/AuthLayout'

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export const ForgotPasswordPage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitSuccess, setSubmitSuccess] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    })

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsSubmitting(true)
        setSubmitError(null)
        setSubmitSuccess(false)

        try {
            await api.post('/api/auth/forgot-password', data)
            setSubmitSuccess(true)
        } catch (error) {
            setSubmitError(getApiErrorMessage(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    if (submitSuccess) {
        return (
            <AuthLayout title="Check your email" subtitle="If an account exists, we sent a reset link.">
                <Link
                    to="/login"
                    className="flex w-full justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    Back to login
                </Link>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout
            title="Forgot your password?"
            subtitle="No worries, we'll send you reset instructions."
        >
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
                        placeholder="Enter your email address"
                    />
                    {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
                </div>
                <AuthSubmitButton
                    isSubmitting={isSubmitting}
                    idleLabel="Send reset instructions"
                    busyLabel="Sending..."
                />
                <div className="text-center">
                    <Link to="/login" className="font-medium text-gray-600 hover:text-gray-500">
                        Back to login
                    </Link>
                </div>
            </form>
        </AuthLayout>
    )
}
