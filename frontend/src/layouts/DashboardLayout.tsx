import React, { useState } from 'react'
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar'
import { UserAvatarDropdown } from '../components/dashboard/UserAvatarDropdown'
import { BrandMark } from '../components/BrandMark'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen flex-col bg-gray-50">
            <div className="fixed top-0 left-0 right-0 z-[60] w-full border-b border-gray-200 bg-white shadow-sm">
                <div className="flex h-16 items-center justify-between px-4 lg:px-6">
                    <div className="flex min-w-0 items-center">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="mr-3 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 lg:hidden"
                            aria-label="Open sidebar"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <BrandMark className="shrink-0" />
                    </div>
                    <UserAvatarDropdown />
                </div>
            </div>

            <div className="flex min-h-0 flex-1 pt-16 lg:pl-64">
                <DashboardSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
                <div className="flex min-h-0 w-full flex-1 flex-col">
                    <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-2 sm:px-4 sm:py-5">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}
