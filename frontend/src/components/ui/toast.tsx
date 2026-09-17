import { useCallback, useEffect, useRef, useState } from 'react'

export type ToastType = 'success' | 'error'

export interface ToastItem {
    id: string
    message: string
    type: ToastType
    duration?: number
}

const DEFAULT_TOAST_DURATION = 3000

export function useToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const timersRef = useRef<Map<string, number>>(new Map())

    const dismissToast = useCallback((id: string) => {
        const timer = timersRef.current.get(id)
        if (timer !== undefined) {
            window.clearTimeout(timer)
            timersRef.current.delete(id)
        }
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    const showToast = useCallback((message: string, type: ToastType, duration = DEFAULT_TOAST_DURATION) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        setToasts((prev) => [...prev, { id, message, type, duration }])

        const timer = window.setTimeout(() => {
            timersRef.current.delete(id)
            setToasts((prev) => prev.filter((toast) => toast.id !== id))
        }, duration)
        timersRef.current.set(id, timer)
    }, [])

    useEffect(() => {
        const timers = timersRef.current
        return () => {
            timers.forEach((timer) => window.clearTimeout(timer))
            timers.clear()
        }
    }, [])

    return { toasts, showToast, dismissToast }
}

export function ToastViewport({ toasts }: { toasts: ToastItem[] }) {
    if (toasts.length === 0) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={
                        toast.type === 'error'
                            ? 'rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg'
                            : 'rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg'
                    }
                >
                    {toast.message}
                </div>
            ))}
        </div>
    )
}
