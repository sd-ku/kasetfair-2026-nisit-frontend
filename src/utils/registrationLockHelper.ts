/**
 * Utility file for adding registration lock to store edit pages
 * 
 * Usage in your page component:
 * 
 * ```tsx
 * import { useRegistrationLock } from "@/hooks/useRegistrationLock"
 * import { RegistrationLockWarning } from "@/components/RegistrationLockWarning"
 * 
 * export default function YourPage() {
 *   const { settings: lockSettings, loading: lockLoading } = useRegistrationLock()
 *   const [saving, setSaving] = useState(false)
 *   
 *   // Add to loading check
 *   if (loading || lockLoading) { ... }
 *   
 *   // Get lock status
 *   const isLocked = lockSettings?.isCurrentlyLocked ?? false
 *   
 *   // Show warning
 *   {isLocked && (
 *     <RegistrationLockWarning 
 *       title="ปิดรับการแก้ไขข้อมูลร้านค้า"
 *       message={lockSettings?.lockMessage || "ขณะนี้ไม่สามารถแก้ไขข้อมูลร้านค้าได้"}
 *     />
 *   )}
 *   
 *   // Disable inputs and buttons
 *   <Input disabled={saving || isLocked} />
 *   <Button disabled={saving || isLocked}>
 *     {isLocked ? "ปิดรับการแก้ไข" : saving ? "กำลังบันทึก..." : "บันทึก"}
 *   </Button>
 * ```
 */

export const STORE_LOCK_MESSAGES = {
    title: "ปิดรับการแก้ไขข้อมูลร้านค้า",
    defaultMessage: "ขณะนี้ไม่สามารถแก้ไขข้อมูลร้านค้าได้ กรุณาลองใหม่อีกครั้งในภายหลัง",
    buttonText: "ปิดรับการแก้ไข",
} as const;

export const NISIT_LOCK_MESSAGES = {
    title: "ปิดรับการแก้ไขข้อมูล",
    defaultMessage: "ขณะนี้ไม่สามารถแก้ไขข้อมูลได้ กรุณาลองใหม่อีกครั้งในภายหลัง",
    buttonText: "ปิดรับการแก้ไข",
} as const;
