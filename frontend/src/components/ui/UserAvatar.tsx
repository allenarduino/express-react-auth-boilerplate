import { User } from '../../context/AuthContext'

interface UserAvatarProps {
    user: User | null
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

export function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-24 h-24',
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

    const avatarUrl = user?.profile?.avatarUrl || user?.googlePicture

    if (avatarUrl) {
        return (
            <div className="relative">
                <img
                    src={avatarUrl}
                    alt={user.profile?.name || user.name || user.email}
                    className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
                    onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                        const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                    }}
                />
                <div
                    className={`${sizeClasses[size]} absolute top-0 left-0 flex items-center justify-center rounded-full bg-primary-light ${className}`}
                    style={{ display: 'none' }}
                >
                    <span className={`${textSizeClasses[size]} font-medium text-primary-dark`}>
                        {user ? getInitials(user) : '?'}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-primary-light ${className}`}>
            <span className={`${textSizeClasses[size]} font-medium text-primary-dark`}>
                {user ? getInitials(user) : '?'}
            </span>
        </div>
    )
}
