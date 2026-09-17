import React, { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface RequireAuthProps {
    children: ReactNode
}

/**
 * Protected route wrapper component
 * Redirects to /login if user is not authenticated
 * 
 * @param children - The component to render if authenticated
 * @returns Either the protected component or a redirect to login
 * 
 * @example
 * ```tsx
 * import { RequireAuth } from '../components/RequireAuth'
 * 
 * function App() {
 *   return (
 *     <Routes>
 *       <Route path="/login" element={<LoginPage />} />
 *       <Route 
 *         path="/dashboard" 
 *         element={
 *           <RequireAuth>
 *             <DashboardPage />
 *           </RequireAuth>
 *         } 
 *       />
 *     </Routes>
 *   )
 * }
 * ```
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth()
    const location = useLocation()

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </div>
        )
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Render protected content if authenticated
    return <>{children}</>
}
