jest.mock('../../utils/auth', () => ({
  ...jest.requireActual('../../utils/auth'),
  RootTenantAuthorized: () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => descriptor,
  SoftTenantAuthorized: () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => descriptor,
}))
