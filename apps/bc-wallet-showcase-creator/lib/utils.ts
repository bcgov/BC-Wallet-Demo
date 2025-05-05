import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { env } from '@/env'
import { ShowcaseRequest } from 'bc-wallet-openapi'
import { Showcase } from 'bc-wallet-openapi'
import { Buffer } from 'buffer'

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
export const decodeJwt = (token?: string) => {
  if (token) {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token string')
    }
    const base64 = parts[1]
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(parts[1].length + (4 - (parts[1].length % 4)) % 4, '=');

    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } else {
    throw Error('token is required')
  }
}


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

export const browserDecodeJwt = (token?: string) => {
  if (!token) {
    throw Error('token is required');
  }
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token string');
  }
  
  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  
  return JSON.parse(jsonPayload);
};