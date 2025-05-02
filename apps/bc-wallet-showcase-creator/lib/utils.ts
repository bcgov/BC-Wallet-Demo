import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { env } from '@/env'
import { ShowcaseRequest } from 'bc-wallet-openapi'
import { Showcase } from 'bc-wallet-openapi'

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

export const baseUrl = env.NEXT_PUBLIC_SHOWCASE_API_URL;

export const debugLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

export const showcaseToShowcaseRequest = (showcase: Showcase): ShowcaseRequest => {
  return {
    ...showcase,
    scenarios: showcase.scenarios.map((scenario) => scenario.id),
    personas: showcase.personas.map((persona) => persona.id),
    bannerImage: showcase.bannerImage?.id,
  }
}
