import React, { useMemo, useState } from 'react'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { changePassword, deleteAccount, getApiErrorMessage } from '../lib/api'
import { ToastViewport, useToast } from '../components/ui/toast'

export const SettingsPage: React.FC = () => {
    const { user, logout } = useAuth()
    const { toasts, showToast } = useToast()
    const [confirmEmail, setConfirmEmail] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isSavingPassword, setIsSavingPassword] = useState(false)

    const accountEmail = user?.email?.trim().toLowerCase() ?? ''
    const emailsMatch = useMemo(
        () => accountEmail.length > 0 && confirmEmail.trim().toLowerCase() === accountEmail,
        [accountEmail, confirmEmail]
    )

    const canChangePassword = user?.hasPassword !== false

    const handleChangePassword = async (event: React.FormEvent) => {
        event.preventDefault()
        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error')
            return
        }
        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error')
            return
        }

        setIsSavingPassword(true)
        try {
            await changePassword(currentPassword, newPassword)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            showToast('Password updated', 'success')
        } catch (err) {
            showToast(getApiErrorMessage(err), 'error')
        } finally {
            setIsSavingPassword(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (!emailsMatch || !user?.email) return
        setDeleteError(null)
        const ok = window.confirm(
            'This permanently deletes your account and profile. This cannot be undone. Continue?'
        )
        if (!ok) return

        setIsDeleting(true)
        try {
            await deleteAccount(confirmEmail.trim())
            logout()
        } catch (err) {
            setDeleteError(getApiErrorMessage(err))
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <DashboardLayout>
            <ToastViewport toasts={toasts} />
            <div className="mx-auto w-full max-w-3xl space-y-6 lg:max-w-4xl">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
                    <p className="mt-1 text-sm text-gray-600">Manage security and your account.</p>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-medium text-gray-900">Password</h2>
                        <p className="mt-1 text-sm text-gray-600">
                            {canChangePassword
                                ? 'Update the password you use to sign in.'
                                : 'This account uses Google sign-in, so a password cannot be changed here.'}
                        </p>
                    </div>
                    {canChangePassword ? (
                        <form onSubmit={(e) => void handleChangePassword(e)} className="space-y-4 px-6 py-6">
                            <div>
                                <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                                    Current password
                                </label>
                                <input
                                    id="current-password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                                    New password
                                </label>
                                <input
                                    id="new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700">
                                    Confirm new password
                                </label>
                                <input
                                    id="confirm-new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSavingPassword}
                                className="inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                            >
                                {isSavingPassword ? 'Saving...' : 'Update password'}
                            </button>
                        </form>
                    ) : (
                        <div className="px-6 py-6 text-sm text-gray-600">
                            Sign in with Google to access this account. Password login is not enabled.
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
                    <div className="rounded-t-xl border-b border-red-100 bg-red-50 px-6 py-4">
                        <h2 className="text-lg font-medium text-red-900">Delete account</h2>
                        <p className="mt-1 text-sm text-red-800">
                            Permanently remove your account and profile. You will be signed out immediately.
                        </p>
                    </div>
                    <div className="space-y-4 px-6 py-6">
                        <p className="text-sm text-gray-700">
                            Type your account email <span className="font-medium text-gray-900">{user?.email}</span> to
                            confirm:
                        </p>
                        <input
                            type="email"
                            autoComplete="off"
                            value={confirmEmail}
                            onChange={(e) => {
                                setConfirmEmail(e.target.value)
                                setDeleteError(null)
                            }}
                            placeholder={user?.email}
                            className="block w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
                            disabled={isDeleting}
                        />
                        {deleteError && (
                            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                {deleteError}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => void handleDeleteAccount()}
                            disabled={!emailsMatch || isDeleting}
                            className="inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-red-300"
                        >
                            {isDeleting ? 'Deleting…' : 'Delete my account'}
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
