import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const convertBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.readAsDataURL(file)
    fileReader.onload = () => {
      // Cast result to string and remove the prefix
      const base64WithPrefix = fileReader.result as string
      const base64 = base64WithPrefix.split('base64,')[1]
      resolve(base64)
    }
    fileReader.onerror = (error) => {
      reject(error)
    }
  })
}

export const baseUrl = process.env.SHOWCASE_BACKEND ?? 'https://bcshowcase-api.dev.nborbit.ca'
