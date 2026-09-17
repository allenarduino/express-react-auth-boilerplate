import { Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { BrandMark } from './BrandMark'
import { UserAvatar } from './ui/UserAvatar'

export function Navbar() {
    const { user, isAuthenticated, logout } = useAuth()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleLogout = () => {
        logout()
        setIsDropdownOpen(false)
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    <div className="flex items-center">
                        <BrandMark />
                    </div>

                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
                                >
                                    Dashboard
                                </Link>
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center justify-center overflow-hidden rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                        aria-label="User menu"
                                        aria-expanded={isDropdownOpen}
                                    >
                                        <UserAvatar user={user} size="sm" />
                                    </button>
                                    {isDropdownOpen && (
                                        <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                                            <div className="border-b border-gray-100 px-4 py-2">
                                                <p className="truncate text-sm font-medium text-gray-900">
                                                    {user?.profile?.name || user?.name || 'Account'}
                                                </p>
                                                <p className="truncate text-xs text-gray-500">{user?.email}</p>
                                            </div>
                                            <Link
                                                to="/dashboard/profile"
                                                className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                Profile
                                            </Link>
                                            <Link
                                                to="/dashboard/settings"
                                                className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                Settings
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                                            >
                                                Sign out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
