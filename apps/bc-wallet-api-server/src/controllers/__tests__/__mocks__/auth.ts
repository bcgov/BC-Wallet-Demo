export function RootTenantAuthorized() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Just return the original method without modification
    return descriptor
  }
}

export function SoftTenantAuthorized() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Just return the original method without modification
    return descriptor
  }
}

export const checkRoles = jest.fn().mockReturnValue(true)
export const isAccessTokenValid = jest.fn().mockResolvedValue(true)
export const getBasePath = jest.fn((path) => `${path || ''}`)
export const authorizationChecker = jest.fn().mockResolvedValue(true)
export const isAccessTokenExpired = jest.fn().mockReturnValue(false)
