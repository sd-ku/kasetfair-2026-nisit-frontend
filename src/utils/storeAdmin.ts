export const isStoreAdmin = (
  nisitId?: string | null,
  storeAdminNisitId?: string | null
): boolean => {
  if (!nisitId || !storeAdminNisitId) return false
  return nisitId.trim() === storeAdminNisitId.trim()
}
