import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const convertBase64 = (file: File) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.readAsDataURL(file)
    fileReader.onload = () => {
      resolve(fileReader.result)
    }
    fileReader.onerror = (error) => {
      reject(error)
    }
  })
}
export const baseUrl = process.env.SHOWCASE_BACKEND ?? 'https://bcshowcase-api.dev.nborbit.ca'

export function ensureBase64HasPrefix(base64String: string) {
  if (!base64String) return ''

  if (base64String.startsWith('data:image/')) {
    return base64String
  }

  if (base64String.startsWith('iVBORw0KGgoAAAANSUhEU')) {
    return `data:image/png;base64,${base64String}`
  } else if (base64String.startsWith('/9j/')) {
    return `data:image/jpeg;base64,${base64String}`
  } else if (base64String.startsWith('R0lGOD')) {
    return `data:image/gif;base64,${base64String}`
  } else if (base64String.startsWith('UklGR')) {
    return `data:image/webp;base64,${base64String}`
  }

  return `data:image/png;base64,${base64String}`
}
