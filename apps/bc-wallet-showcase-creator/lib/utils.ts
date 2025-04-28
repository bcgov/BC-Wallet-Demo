import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { env } from '@/env'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const convertBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.readAsDataURL(file)
    fileReader.onload = () => {
      const base64WithPrefix = fileReader.result as string
      const base64 = base64WithPrefix.split('base64,')[1]
      resolve(base64)
    }
    fileReader.onerror = (error) => {
      reject(error)
    }
  })
}

export function parseSchemaId(schemaId: string) {

  const parts = schemaId.split(':');
  return {
    schemaPrefix: parts[0],
    schemaVersion: parts[3],
  };
}

export const baseUrl = env.NEXT_PUBLIC_SHOWCASE_BACKEND;

