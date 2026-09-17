import React, { useCallback, useEffect, useRef, useState } from 'react'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import {
    fetchUserProfile,
    getApiErrorMessage,
    updateUserProfile,
    uploadUserAvatar,
    type UserProfileData,
} from '../../lib/api'
import { cropImageToSquareJpeg } from '../../lib/cropImage'
import { UserAvatar } from '../../components/ui/UserAvatar'
import { ToastViewport, useToast } from '../../components/ui/toast'
import type { User } from '../../context/AuthContext'

const PROFILE_PAGE_MAX_WIDTH = 'mx-auto w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl'

function profileToForm(profile: UserProfileData) {
    return {
        name: profile.profile.name ?? '',
        bio: profile.profile.bio ?? '',
        website: profile.profile.website ?? '',
        avatarUrl: profile.profile.avatarUrl ?? '',
    }
}

function Spinner({ className = 'h-8 w-8' }: { className?: string }) {
    return (
        <svg className={`animate-spin text-gray-400 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    )
}

export const ProfilePage: React.FC = () => {
    const { user, refreshUser } = useAuth()
    const { toasts, showToast } = useToast()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [profile, setProfile] = useState<UserProfileData | null>(null)
    const [form, setForm] = useState({ name: '', bio: '', website: '', avatarUrl: '' })
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [avatarCleared, setAvatarCleared] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadProfile = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await fetchUserProfile()
            setProfile(data)
            setForm(profileToForm(data))
            setAvatarCleared(false)
        } catch (err) {
            setError(getApiErrorMessage(err))
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadProfile()
    }, [loadProfile])

    const displayAvatarUrl = avatarCleared
        ? form.avatarUrl || null
        : form.avatarUrl || profile?.profile.avatarUrl || null

    const previewUser: User | null = profile
        ? {
              id: profile.id,
              email: profile.email,
              name: form.name || user?.name,
              googlePicture: avatarCleared || form.avatarUrl ? undefined : profile.googlePicture || user?.googlePicture,
              profile: {
                  name: form.name || undefined,
                  avatarUrl: displayAvatarUrl || undefined,
              },
          }
        : user

    const handleAvatarPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return

        try {
            setIsUploadingAvatar(true)
            const dataUrl = await cropImageToSquareJpeg(file)
            const uploaded = await uploadUserAvatar(dataUrl)
            setAvatarCleared(false)
            setForm((prev) => ({ ...prev, avatarUrl: uploaded.url }))
            setProfile(uploaded.profile)
            await refreshUser()
            showToast('Photo updated', 'success')
        } catch (err) {
            showToast(getApiErrorMessage(err), 'error')
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const handleRemoveAvatar = () => {
        setAvatarCleared(true)
        setForm((prev) => ({ ...prev, avatarUrl: '' }))
    }

    const normalizeWebsite = (value: string) => {
        const trimmed = value.trim()
        if (!trimmed) return null
        if (/^https?:\/\//i.test(trimmed)) return trimmed
        return `https://${trimmed}`
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!profile) return

        const trimmedName = form.name.trim()
        if (!trimmedName) {
            showToast('Full name is required', 'error')
            return
        }

        try {
            setIsSaving(true)
            const updated = await updateUserProfile({
                name: trimmedName,
                bio: form.bio.trim() || null,
                website: normalizeWebsite(form.website),
                avatarUrl: form.avatarUrl.trim() || null,
            })
            setProfile(updated)
            setForm(profileToForm(updated))
            setAvatarCleared(false)
            await refreshUser()
            showToast('Profile updated', 'success')
        } catch (err) {
            showToast(getApiErrorMessage(err), 'error')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className={`flex h-64 items-center justify-center ${PROFILE_PAGE_MAX_WIDTH}`}>
                    <Spinner />
                </div>
            </DashboardLayout>
        )
    }

    if (error || !profile) {
        return (
            <DashboardLayout>
                <div className={PROFILE_PAGE_MAX_WIDTH}>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error || 'Could not load profile.'}
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <ToastViewport toasts={toasts} />
            <div className={PROFILE_PAGE_MAX_WIDTH}>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-6 py-5 lg:px-8">
                        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Update your photo, name, and public details.
                        </p>
                    </div>

                    <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-6 lg:px-8">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                            <div className="relative shrink-0 self-start">
                                <UserAvatar user={previewUser} size="xl" />
                                {isUploadingAvatar ? (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                                        <Spinner className="h-6 w-6 text-white" />
                                    </div>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-900">Profile photo</p>
                                <p className="text-sm text-gray-500">JPG, PNG, or WebP. Cropped to a square.</p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        disabled={isUploadingAvatar || isSaving}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {form.avatarUrl ? 'Change photo' : 'Upload photo'}
                                    </button>
                                    {form.avatarUrl || (!avatarCleared && (profile.profile.avatarUrl || user?.googlePicture)) ? (
                                        <button
                                            type="button"
                                            disabled={isUploadingAvatar || isSaving}
                                            onClick={handleRemoveAvatar}
                                            className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                        >
                                            Remove
                                        </button>
                                    ) : null}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => void handleAvatarPick(e)}
                                />
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div>
                                <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700">
                                    Full name
                                </label>
                                <input
                                    id="profile-name"
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                    maxLength={100}
                                    required
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                    placeholder="Your full name"
                                />
                            </div>

                            <div>
                                <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    id="profile-email"
                                    type="email"
                                    value={profile.email}
                                    readOnly
                                    className="mt-1 block w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                                />
                                <div className="mt-2">
                                    {profile.isEmailVerified ? (
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                            Unverified
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Email cannot be changed here.</p>
                            </div>

                            <div>
                                <label htmlFor="profile-website" className="block text-sm font-medium text-gray-700">
                                    Website
                                </label>
                                <input
                                    id="profile-website"
                                    type="text"
                                    value={form.website}
                                    onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                                    maxLength={200}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                    placeholder="https://your-site.com"
                                />
                            </div>

                            <div className="lg:col-span-2">
                                <label htmlFor="profile-bio" className="block text-sm font-medium text-gray-700">
                                    Bio
                                </label>
                                <textarea
                                    id="profile-bio"
                                    value={form.bio}
                                    onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                                    maxLength={500}
                                    rows={4}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                    placeholder="A short introduction"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
                            <button
                                type="button"
                                disabled={isSaving || isUploadingAvatar}
                                onClick={() => {
                                    setForm(profileToForm(profile))
                                    setAvatarCleared(false)
                                }}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || isUploadingAvatar}
                                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <Spinner className="h-4 w-4 text-white" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save profile'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    )
}
