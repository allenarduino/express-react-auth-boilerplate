import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { RequireAuth } from './components/RequireAuth'
import { LandingPage } from './pages/LandingPage'
import { SignupPage } from './pages/SignupPage'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/dashboard/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'

function AppContent() {
    const location = useLocation()
    const isDashboardRoute = location.pathname.startsWith('/dashboard')
    const authRoutes = [
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password',
        '/auth/callback',
        '/verify-email',
    ]
    const isAuthRoute = authRoutes.some((route) => location.pathname.startsWith(route))
    const showNavbar = !isDashboardRoute && !isAuthRoute

    return (
        <div className="min-h-screen bg-gray-50">
            {showNavbar && <Navbar />}
            <div className={showNavbar ? 'pt-16' : undefined}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />
                    <Route
                        path="/dashboard"
                        element={
                            <RequireAuth>
                                <DashboardPage />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/dashboard/profile"
                        element={
                            <RequireAuth>
                                <ProfilePage />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/dashboard/settings"
                        element={
                            <RequireAuth>
                                <SettingsPage />
                            </RequireAuth>
                        }
                    />
                </Routes>
            </div>
        </div>
    )
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    )
}

export default App
