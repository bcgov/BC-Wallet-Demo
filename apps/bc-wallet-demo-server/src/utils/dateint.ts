export const getDateInt = (offsetYear?: number) => {
  const pastDate = new Date()
  pastDate.setFullYear(pastDate.getFullYear() + (offsetYear ?? 0))
  return parseInt(pastDate.toISOString().split('T')[0].replace(/-/g, ''))
}
