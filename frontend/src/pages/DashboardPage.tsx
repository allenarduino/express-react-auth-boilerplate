import { Link } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { useAuth } from '../hooks/useAuth'

export function DashboardPage() {
    const { user } = useAuth()
    const displayName = user?.profile?.name || user?.name || 'there'

    return (
        <DashboardLayout>
            <div className="mx-auto w-full max-w-6xl">
                <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {displayName}</h1>
                <p className="mt-1 text-sm text-gray-600">This is your authenticated home. Build your product from here.</p>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Link
                        to="/dashboard/profile"
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <h2 className="text-lg font-medium text-gray-900">Profile</h2>
                        <p className="mt-2 text-sm text-gray-600">Update your photo and name.</p>
                    </Link>
                    <Link
                        to="/dashboard/settings"
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <h2 className="text-lg font-medium text-gray-900">Settings</h2>
                        <p className="mt-2 text-sm text-gray-600">Change your password or delete your account.</p>
                    </Link>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-medium text-gray-900">Your app</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Replace this card with the first feature of the product you are building.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
