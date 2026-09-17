import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api, { getApiErrorMessage } from '../lib/api'
import { AuthError, AuthLayout } from '../components/AuthLayout'

export const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('Verifying your email...')
    const [email, setEmail] = useState('')
    const [isResending, setIsResending] = useState(false)

    useEffect(() => {
        const token = searchParams.get('token')
        if (!token) {
            setStatus('error')
            setMessage('This verification link is missing a token.')
            return
        }

        const verify = async () => {
            try {
                await api.get('/api/auth/verify', { params: { token } })
                setStatus('success')
                setMessage('Your email is verified. You can sign in now.')
            } catch (error) {
                setStatus('error')
                setMessage(getApiErrorMessage(error))
            }
        }

        void verify()
    }, [searchParams])

    const handleResend = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!email.trim()) return
        setIsResending(true)
        try {
            await api.post('/api/auth/resend-verification', { email: email.trim() })
            setMessage('If that account exists, we sent a new verification email.')
        } catch (error) {
            setMessage(getApiErrorMessage(error))
        } finally {
            setIsResending(false)
        }
    }

    if (status === 'loading') {
        return (
            <AuthLayout title="Verifying email">
                <div className="flex justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
                </div>
            </AuthLayout>
        )
    }

    if (status === 'success') {
        return (
            <AuthLayout title="Email verified" subtitle={message}>
                <Link
                    to="/login"
                    className="flex w-full justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    Continue to login
                </Link>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout title="Couldn’t verify email">
            <AuthError message={message} />
            <form className="space-y-4" onSubmit={(e) => void handleResend(e)}>
                <div>
                    <label htmlFor="resend-email" className="block text-sm font-medium text-gray-700">
                        Resend verification
                    </label>
                    <input
                        id="resend-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-gray-500"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isResending}
                    className="flex w-full justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                    {isResending ? 'Sending…' : 'Resend verification email'}
                </button>
            </form>
        </AuthLayout>
    )
}
