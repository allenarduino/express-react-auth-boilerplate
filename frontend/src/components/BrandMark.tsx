import { Link } from 'react-router-dom'
import { APP_NAME } from '../lib/brand'

type LogoSize = 'nav' | 'auth'

export function BrandMark({
    className = '',
    size = 'nav',
}: {
    className?: string
    size?: LogoSize
}) {
    const labelSize = size === 'auth' ? 'text-2xl' : 'text-lg'

    return (
        <Link
            to="/"
            className={`inline-flex items-center transition-opacity hover:opacity-90 ${className}`.trim()}
            aria-label={`${APP_NAME} home`}
        >
            <span className={`font-semibold tracking-tight text-gray-900 ${labelSize}`}>{APP_NAME}</span>
        </Link>
    )
}
