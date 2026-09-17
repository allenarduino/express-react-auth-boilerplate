import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark'

export function AuthLayout({
    title,
    subtitle,
    children,
}: {
    title: string
    subtitle?: ReactNode
    children: ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6">
            <div className="w-full max-w-md space-y-8">
                <header className="flex flex-col items-center text-center">
                    <BrandMark size="auth" className="mb-8" />
                    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                    {subtitle ? <p className="mt-2 text-sm text-gray-600">{subtitle}</p> : null}
                </header>
                {children}
            </div>
        </div>
    )
}

export function AuthError({ message }: { message: string }) {
    return (
        <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <div className="ml-3">
                    <p className="text-sm text-red-800">{message}</p>
                </div>
            </div>
        </div>
    )
}

export function AuthSubmitButton({
    isSubmitting,
    idleLabel,
    busyLabel,
}: {
    isSubmitting: boolean
    idleLabel: string
    busyLabel: string
}) {
    return (
        <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {isSubmitting ? (
                <span className="flex items-center">
                    <svg className="mr-3 -ml-1 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {busyLabel}
                </span>
            ) : (
                idleLabel
            )}
        </button>
    )
}

export const authInputClassName =
    'mt-1 relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-gray-500 focus:outline-none focus:ring-gray-500 sm:text-sm'
