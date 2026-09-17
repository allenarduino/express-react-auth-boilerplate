/**
 * Center-crop an image file to a square JPEG data URL for avatar upload.
 */
export function cropImageToSquareJpeg(file: File, size = 512): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('Please choose an image file'))
            return
        }

        const image = new Image()
        const objectUrl = URL.createObjectURL(file)

        image.onload = () => {
            const min = Math.min(image.width, image.height)
            const sx = (image.width - min) / 2
            const sy = (image.height - min) / 2
            const canvas = document.createElement('canvas')
            canvas.width = size
            canvas.height = size
            const context = canvas.getContext('2d')
            if (!context) {
                URL.revokeObjectURL(objectUrl)
                reject(new Error('Could not crop image'))
                return
            }
            context.drawImage(image, sx, sy, min, min, 0, 0, size, size)
            URL.revokeObjectURL(objectUrl)
            resolve(canvas.toDataURL('image/jpeg', 0.9))
        }

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(new Error('Could not read image'))
        }

        image.src = objectUrl
    })
}
