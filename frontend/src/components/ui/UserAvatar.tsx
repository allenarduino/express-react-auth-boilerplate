import { useEffect, useState } from 'react'
import { User } from '../../context/AuthContext'

interface UserAvatarProps {
    user: User | null
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

export function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
    const sizeClasses = {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-24 w-24',
    }

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-2xl',
    }

    const getInitials = (currentUser: User) => {
        if (currentUser.profile?.name) {
            return currentUser.profile.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
        }
        if (currentUser.name) {
            return currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
        }
        return currentUser.email.slice(0, 2).toUpperCase()
    }

    const avatarUrl = user?.profile?.avatarUrl || user?.googlePicture || null
    const [imageFailed, setImageFailed] = useState(false)

    useEffect(() => {
        setImageFailed(false)
    }, [avatarUrl])

    const showImage = Boolean(avatarUrl) && !imageFailed

    return (
        <div
            className={`${sizeClasses[size]} shrink-0 overflow-hidden rounded-full ${
                showImage ? 'bg-gray-100' : 'flex items-center justify-center bg-gray-200'
            } ${className}`}
        >
            {showImage ? (
                <img
                    src={avatarUrl!}
                    alt={user?.profile?.name || user?.name || user?.email || 'Profile'}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <span className={`${textSizeClasses[size]} font-medium text-gray-700`}>
                    {user ? getInitials(user) : '?'}
                </span>
            )}
        </div>
    )
}
