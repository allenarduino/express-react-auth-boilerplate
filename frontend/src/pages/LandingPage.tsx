import { Link } from 'react-router-dom'
import { APP_FULL_NAME, APP_TAGLINE } from '../lib/brand'
import { useAuth } from '../hooks/useAuth'

const features = [
    {
        title: 'Email authentication',
        body: 'Sign up, verify email, log in, and reset passwords with a clean API and React UI.',
    },
    {
        title: 'Google sign-in',
        body: 'OAuth is wired end to end, including account linking when the email already exists.',
    },
    {
        title: 'User management',
        body: 'Editable profiles, avatars, password changes, and account deletion. Ready to drop into a product.',
    },
]

export function LandingPage() {
    const { isAuthenticated } = useAuth()

    return (
        <div className="bg-white">
            <section className="px-4 pt-16 pb-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <p className="text-sm font-medium uppercase tracking-widest text-gray-500">Boilerplate</p>
                    <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                        {APP_FULL_NAME}
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-600">{APP_TAGLINE}</p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        {isAuthenticated ? (
                            <Link
                                to="/dashboard"
                                className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                            >
                                Go to dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/signup"
                                    className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                                >
                                    Get started
                                </Link>
                                <Link
                                    to="/login"
                                    className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                                >
                                    Sign in
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <section className="border-t border-gray-100 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
                    {features.map((feature) => (
                        <div key={feature.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900">{feature.title}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.body}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
