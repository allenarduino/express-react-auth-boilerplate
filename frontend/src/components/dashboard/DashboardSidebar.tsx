import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { UserAvatar } from '../ui/UserAvatar'

interface DashboardSidebarProps {
    open: boolean
    setOpen: (open: boolean) => void
}

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
    { name: 'Profile', href: '/dashboard/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { name: 'Settings', href: '/dashboard/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
]

export function DashboardSidebar({ open, setOpen }: DashboardSidebarProps) {
    const location = useLocation()
    const { user, logout } = useAuth()
    const displayName = user?.profile?.name || user?.name || 'User'

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600/75 lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <div
                className={`
          fixed bottom-0 left-0 top-16 z-50 flex w-64 transform flex-col bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                <div className="flex flex-shrink-0 items-center justify-end px-6 py-3 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 lg:hidden"
                        aria-label="Close sidebar"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <UserAvatar user={user} size="lg" />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
                            <p className="truncate text-xs text-gray-500">{user?.email}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-6 py-4">
                    <ul className="space-y-2">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href
                            return (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        className={`
                                      flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200
                                          ${
                                              isActive
                                                  ? 'bg-gray-200 text-gray-900'
                                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                          }
                                    `}
                                        onClick={() => setOpen(false)}
                                    >
                                        <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                        </svg>
                                        {item.name}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4">
                    <button
                        type="button"
                        onClick={() => logout()}
                        className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900"
                    >
                        <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    )
}
