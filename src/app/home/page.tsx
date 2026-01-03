"use client"

import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "@/lib/toast"
import { http } from "@/lib/http"
import {
  Building2,
  GraduationCap,
  Loader2,
  LogOut,
  Plus,
  Store,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  UserCog,
  Calendar,
  Clock
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getStoreValidate, leaveStore, transferStoreAdmin } from "@/services/storeServices"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getNisitInfo } from "@/services/nisitService"
import { NisitInfo } from "@/services/dto/nisit-info.dto"
import { logout } from "@/services/authService"
import { convertStateToLabel, convertStoreTypeToLabel, getStatusColor } from "@/utils/labelConverter"
import { useRegistrationLock } from "@/hooks/useRegistrationLock"
import { RegistrationLockWarning } from "@/components/RegistrationLockWarning"

// --- Types ---
type Invitation = {
  id: string
  storeName: string
  inviterName: string
  inviteeEmail: string
  role?: string
  createdAt?: string
  message?: string | null
}

type StoreValidateResponseDto = {
  store: {
    id: number;
    storeName: string;
    type: string;
    state: string;
    boothNumber: string;
    storeAdminNisitId: string | null;
  };
  isValid: boolean;
  sections: {
    key: "members" | "clubInfo" | "storeDetail" | "goods";
    label: string;
    ok: boolean;
    items: {
      key: string;
      label: string;
      ok: boolean;
      message?: string;
    }[];
  }[];
};

const STORAGE_KEY_STORE_NAME = "kasetfair_draft_store_name"
const STORAGE_KEY_MEMBERS = "kasetfair_draft_members"

export default function HomePage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [selectingStoreType, setSelectingStoreType] = useState(false)

  const [validationData, setValidationData] = useState<StoreValidateResponseDto | null>(null)
  const [userInfo, setUserInfo] = useState<NisitInfo | null>(null)

  const [loadingStore, setLoadingStore] = useState(true)
  const [loadingUser, setLoadingUser] = useState(true)
  const [storeError, setStoreError] = useState<string | null>(null)
  const [userError, setUserError] = useState<string | null>(null)

  const [showValidationDetails, setShowValidationDetails] = useState(true)

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [transferTargetId, setTransferTargetId] = useState("")
  const [transferring, setTransferring] = useState(false)

  const { settings: lockSettings, loading: lockLoading } = useRegistrationLock('store')

  const displayName = useMemo(
    () => `${userInfo?.firstName} ${userInfo?.lastName}` || "Kaset Fair Member",
    [userInfo?.lastName, userInfo?.firstName]
  )
  const displayInitial = useMemo(
    () => (displayName?.charAt(0)?.toUpperCase() ?? "U"),
    [displayName]
  )

  // const fetchInvitations = useCallback(async () => {
  //   setLoadingInvites(true)
  //   setInviteError(null)
  //   try {
  //     const res = await http.get<Invitation[]>("/shops/invitations")
  //     const data = Array.isArray(res.data) ? res.data : []
  //     setInvitations(data)
  //   } catch (error) {
  //     console.error("Failed to load invitations", error)
  //     setInviteError("โหลดคำเชิญไม่สำเร็จ")
  //     setInvitations([])
  //     // Toast Error
  //     toast({
  //       variant: "error",
  //       title: "ผิดพลาด",
  //       description: "ไม่สามารถโหลดข้อมูลคำเชิญได้",
  //     })
  //   } finally {
  //     setLoadingInvites(false)
  //   }
  // }, [toast])

  const handleLogout = async () => {
    try {
      const res = await logout();

      if (!res?.success) {
        console.error("Logout failed:", res);
        return;
      }

      // ล้าง state client อื่น ๆ ถ้าจำเป็น
      // เช่น sessionStorage.clear()

      // reload หน้าให้ browser ล้าง cookie จากฝั่ง server
      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const fetchStoreData = useCallback(async () => {
    setLoadingStore(true)
    setStoreError(null)
    try {
      const data = await getStoreValidate()
      if (data.store.state.toLowerCase() === "createstore") {
        if (data.store.type.toLowerCase() === "club") {
          router.push("/store/create?type=Club")
        } else {
          router.push("/store/create?type=Nisit")
        }
      } else {
        localStorage.removeItem(STORAGE_KEY_STORE_NAME)
        localStorage.removeItem(STORAGE_KEY_MEMBERS)
      }

      setValidationData(data || null)
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status
      if (status === 404) {
        setValidationData(null)
        setStoreError(null)
      } else {
        console.error("Failed to load store status", err)
        setValidationData(null)
        const errorMessage = "โหลดข้อมูลร้านไม่สำเร็จ"
        setStoreError(errorMessage)

        // Toast Error (Ignore 404)
        toast({
          variant: "error",
          title: "เกิดข้อผิดพลาด",
          description: errorMessage,
        })
      }
    } finally {
      setLoadingStore(false)
    }
  }, [toast])

  const fetchUserData = useCallback(async () => {
    setLoadingUser(true)
    setUserError(null)
    try {
      const data = await getNisitInfo()
      setUserInfo(data || null)
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status
      if (status === 404) {
        setUserInfo(null)
        setUserError(null)
      } else {
        console.error("Failed to load user information", err)
        setUserInfo(null)
        const errorMessage = "โหลดข้อมูลนิสิตไม่สำเร็จ"
        setUserError(errorMessage)

        // Toast Error
        toast({
          variant: "error",
          title: "เกิดข้อผิดพลาด",
          description: errorMessage,
        })
      }
    } finally {
      setLoadingUser(false)
    }
  }, [toast])

  useEffect(() => {
    fetchUserData()
    fetchStoreData()
    // fetchInvitations() // Uncomment if needed
  }, [fetchUserData, fetchStoreData])

  useEffect(() => {
    const onFocus = () => fetchStoreData()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [fetchStoreData])

  const handleLeaveStoreClick = useCallback(() => {
    setLeaveDialogOpen(true)
  }, [])

  const handleLeaveStore = useCallback(async () => {
    setLeaving(true) // แก้จาก setLoadingStore เป็น setLeaving เพื่อให้ตรง logic ปุ่ม
    setStoreError(null)
    try {
      await leaveStore()
      setValidationData(null)
      setLeaveDialogOpen(false)

      // Toast Success
      toast({
        variant: "success",
        title: "สำเร็จ",
        description: "คุณออกจากร้านค้าเรียบร้อยแล้ว",
      })

      // Refresh data to ensure UI updates (e.g. show create store button)
      fetchStoreData()

    } catch (err: any) {
      console.error("Failed to leave store", err)
      const msg = err?.response?.data?.message || "ไม่สามารถออกจากร้านได้ กรุณาลองใหม่"
      setStoreError(msg)

      // Toast Error
      toast({
        variant: "error",
        title: "ไม่สามารถออกจากร้านได้",
        description: msg,
      })
    } finally {
      setLeaving(false)
    }
  }, [fetchStoreData, toast])

  // --- Handle Transfer ---
  const handleTransferAdmin = async () => {
    if (!transferTargetId) return
    setTransferring(true)
    try {
      await transferStoreAdmin(transferTargetId)

      // Mock success delay (optional)
      await new Promise(r => setTimeout(r, 1000))

      setTransferDialogOpen(false)
      setTransferTargetId("") // Reset input

      // Toast Success
      toast({
        variant: "success",
        title: "ดำเนินการสำเร็จ",
        description: `โอนสิทธิ์การเป็น Admin ให้ ${transferTargetId} เรียบร้อยแล้ว`,
      })

      fetchStoreData() // Refresh data
    } catch (error: any) {
      console.error("Transfer failed", error)
      const msg = error?.response?.data?.message || "เกิดข้อผิดพลาดในการโอนสิทธิ์"

      // Toast Error
      toast({
        variant: "error",
        title: "โอนสิทธิ์ล้มเหลว",
        description: msg,
      })
    } finally {
      setTransferring(false)
    }
  }

  const selectorRef = useRef<HTMLDivElement>(null)
  const handleCreateStore = () => {
    setSelectingStoreType((v) => !v)
  }
  useEffect(() => {
    if (selectingStoreType) {
      selectorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [selectingStoreType])

  const handleSelectStoreType = (type: "Nisit" | "Club") => {
    if (type === "Club") {
      router.push(`/store/create/club-info`)
    } else {
      router.push(`/store/create?type=Nisit`)
    }
  }

  const getRouteForSection = (sectionKey: string) => {
    switch (sectionKey) {
      case "members":
        return "/store/info"
      case "clubInfo":
        return "/store/club-info"
      case "storeDetail":
        return "/store/layout"
      case "goods":
        return "/store/goods"
      default:
        return "/store/info"
    }
  }

  const calculateProgress = () => {
    if (!validationData) return 0
    const totalItems = validationData.sections.reduce((acc, curr) => acc + curr.items.length, 0)
    const completedItems = validationData.sections.reduce(
      (acc, curr) => acc + curr.items.filter((i) => i.ok).length,
      0
    )
    return totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100)
  }

  const store = validationData?.store
  const progress = calculateProgress()
  const isReady = validationData?.isValid

  const isOwner = store?.storeAdminNisitId && userInfo?.nisitId === store.storeAdminNisitId

  // Modern theme system with vibrant colors and gradients
  const getPageTheme = (state: string) => {
    switch (state?.toLowerCase()) {
      case "validated":
        return {
          // Page level - Vibrant gradient backgrounds
          background: "bg-gradient-to-br from-emerald-100 via-green-100 to-teal-100",
          // Header card - Glassmorphism
          headerBg: "bg-white/80 backdrop-blur-xl",
          headerBorder: "border-emerald-200/50",
          headerShadow: "shadow-lg shadow-emerald-200/50",
          headerRing: "ring-2 ring-emerald-200/30",
          headerAccent: "bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-lg shadow-emerald-300/50",
          headerAccentText: "text-emerald-700 font-semibold",
          // Store card - Enhanced depth
          cardBg: "bg-white/90 backdrop-blur-sm",
          cardBorder: "border-emerald-300/60",
          cardShadow: "shadow-xl shadow-emerald-200/40",
          // Store info container - Gradient backgrounds
          container: "bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-300/60",
          containerShadow: "shadow-md shadow-emerald-200/30",
          title: "text-emerald-950 font-bold",
          sub: "text-emerald-800/90",
          // Buttons - Modern gradients
          primaryButton: "bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 shadow-lg shadow-emerald-300/50 hover:shadow-xl hover:shadow-emerald-400/50",
          outlineButton: "border-2 border-emerald-400/60 text-emerald-800 hover:bg-emerald-100/80 hover:border-emerald-500 backdrop-blur-sm",
          // Progress section
          progressReady: "border-emerald-400/60 bg-gradient-to-br from-emerald-100 to-green-100 shadow-inner",
          progressNotReady: "border-amber-300/60 bg-gradient-to-br from-amber-50 to-orange-50 shadow-inner",
          progressBar: "bg-gradient-to-r from-emerald-600 to-green-600",
          // Badge
          badgeGlow: "shadow-lg shadow-emerald-300/50",
        }
      case "pending":
        return {
          background: "bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50",
          headerBg: "bg-white/80 backdrop-blur-xl",
          headerBorder: "border-teal-100/50",
          headerShadow: "shadow-lg shadow-teal-100/50",
          headerRing: "ring-2 ring-teal-100/30",
          headerAccent: "bg-gradient-to-br from-teal-400 to-emerald-500 text-white shadow-lg shadow-teal-200/50",
          headerAccentText: "text-teal-600 font-semibold",
          cardBg: "bg-white/90 backdrop-blur-sm",
          cardBorder: "border-teal-200/60",
          cardShadow: "shadow-xl shadow-teal-100/40",
          container: "bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200/60",
          containerShadow: "shadow-md shadow-teal-100/30",
          title: "text-teal-950 font-bold",
          sub: "text-teal-700/90",
          primaryButton: "bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-lg shadow-teal-200/50 hover:shadow-xl hover:shadow-teal-300/50",
          outlineButton: "border-2 border-teal-300/60 text-teal-700 hover:bg-teal-50/80 hover:border-teal-400 backdrop-blur-sm",
          progressReady: "border-teal-300/60 bg-gradient-to-br from-teal-50 to-emerald-50 shadow-inner",
          progressNotReady: "border-amber-300/60 bg-gradient-to-br from-amber-50 to-orange-50 shadow-inner",
          progressBar: "bg-gradient-to-r from-teal-400 to-emerald-500",
          badgeGlow: "shadow-lg shadow-teal-200/50",
        }
      case "rejected":
        return {
          background: "bg-gradient-to-br from-red-50 via-rose-50 to-pink-50",
          headerBg: "bg-white/80 backdrop-blur-xl",
          headerBorder: "border-red-100/50",
          headerShadow: "shadow-lg shadow-red-100/50",
          headerRing: "ring-2 ring-red-100/30",
          headerAccent: "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-200/50",
          headerAccentText: "text-red-600 font-semibold",
          cardBg: "bg-white/90 backdrop-blur-sm",
          cardBorder: "border-red-200/60",
          cardShadow: "shadow-xl shadow-red-100/40",
          container: "bg-gradient-to-br from-red-50 to-rose-50 border-red-200/60",
          containerShadow: "shadow-md shadow-red-100/30",
          title: "text-red-950 font-bold",
          sub: "text-red-700/90",
          primaryButton: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-200/50 hover:shadow-xl hover:shadow-red-300/50",
          outlineButton: "border-2 border-red-300/60 text-red-700 hover:bg-red-50/80 hover:border-red-400 backdrop-blur-sm",
          progressReady: "border-red-300/60 bg-gradient-to-br from-red-50 to-rose-50 shadow-inner",
          progressNotReady: "border-orange-300/60 bg-gradient-to-br from-orange-50 to-red-50 shadow-inner",
          progressBar: "bg-gradient-to-r from-red-500 to-rose-500",
          badgeGlow: "shadow-lg shadow-red-200/50",
        }
      case "storedetails":
      case "productdetails":
        return {
          background: "bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50",
          headerBg: "bg-white/80 backdrop-blur-xl",
          headerBorder: "border-blue-100/50",
          headerShadow: "shadow-lg shadow-blue-100/50",
          headerRing: "ring-2 ring-blue-100/30",
          headerAccent: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200/50",
          headerAccentText: "text-blue-600 font-semibold",
          cardBg: "bg-white/90 backdrop-blur-sm",
          cardBorder: "border-blue-200/60",
          cardShadow: "shadow-xl shadow-blue-100/40",
          container: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/60",
          containerShadow: "shadow-md shadow-blue-100/30",
          title: "text-blue-950 font-bold",
          sub: "text-blue-700/90",
          primaryButton: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50",
          outlineButton: "border-2 border-blue-300/60 text-blue-700 hover:bg-blue-50/80 hover:border-blue-400 backdrop-blur-sm",
          progressReady: "border-blue-300/60 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-inner",
          progressNotReady: "border-amber-300/60 bg-gradient-to-br from-amber-50 to-orange-50 shadow-inner",
          progressBar: "bg-gradient-to-r from-blue-500 to-indigo-500",
          badgeGlow: "shadow-lg shadow-blue-200/50",
        }
      default:
        return {
          background: "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50",
          headerBg: "bg-white/80 backdrop-blur-xl",
          headerBorder: "border-emerald-100/50",
          headerShadow: "shadow-lg shadow-emerald-100/50",
          headerRing: "ring-2 ring-emerald-100/30",
          headerAccent: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/50",
          headerAccentText: "text-emerald-600 font-semibold",
          cardBg: "bg-white/90 backdrop-blur-sm",
          cardBorder: "border-emerald-200/60",
          cardShadow: "shadow-xl shadow-emerald-100/40",
          container: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/60",
          containerShadow: "shadow-md shadow-emerald-100/30",
          title: "text-emerald-950 font-bold",
          sub: "text-emerald-700/90",
          primaryButton: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50",
          outlineButton: "border-2 border-emerald-300/60 text-emerald-700 hover:bg-emerald-50/80 hover:border-emerald-400 backdrop-blur-sm",
          progressReady: "border-emerald-300/60 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-inner",
          progressNotReady: "border-amber-300/60 bg-gradient-to-br from-amber-50 to-orange-50 shadow-inner",
          progressBar: "bg-gradient-to-r from-emerald-500 to-teal-500",
          badgeGlow: "shadow-lg shadow-emerald-200/50",
        }
    }
  }

  const theme = getPageTheme(store?.state || "")

  return (
    <div className={cn("min-h-screen px-4 py-8 transition-all duration-500 ease-in-out", theme.background)}>
      <header className="mx-auto w-full max-w-3xl mb-4 px-1 sm:px-0">
        <div className={cn(
          "rounded-3xl p-5 flex items-center justify-between gap-4 border transition-all duration-500 ease-in-out",
          theme.headerBg,
          theme.headerBorder,
          theme.headerShadow
        )}>

          <div className="flex items-center gap-4 overflow-hidden">
            <Link
              href="/info"
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95",
                theme.headerAccent,
                theme.headerRing
              )}
            >
              {displayInitial}
            </Link>
            <div className="flex flex-col min-w-0">
              <span className={cn("text-xs font-medium", theme.headerAccentText)}>ยินดีต้อนรับ</span>
              <h1 className="text-lg font-bold text-slate-900 truncate leading-tight">
                {displayName}
              </h1>
            </div>
          </div>

          <div>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-xl hover:bg-red-50/80 hover:text-red-600 transition-all duration-300 sm:w-auto sm:px-4"
              onClick={() => handleLogout()}
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline text-xs font-medium">ออกระบบ</span>
            </Button>
          </div>

        </div>
      </header>

      {/* Registration Status Card */}
      {!lockLoading && lockSettings && (
        <div className="mx-auto w-full max-w-3xl mb-6">
          {lockSettings.isCurrentlyLocked ? (
            <RegistrationLockWarning
              title="ปิดรับการแก้ไขข้อมูล"
              message={lockSettings.lockMessage || "ขณะนี้ปิดรับการแก้ไขข้อมูลชั่วคราว"}
            />
          ) : lockSettings.registrationEnd ? (
            <Card className={cn(
              "border-2 backdrop-blur-sm transition-all duration-500",
              theme.cardBorder,
              theme.cardBg,
              theme.cardShadow
            )}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-emerald-800 mb-1">
                      ระบบเปิดรับการแก้ไขข้อมูล
                    </h3>
                    <div className="space-y-1">
                      {lockSettings.registrationStart && (
                        <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          เริ่ม: {new Date(lockSettings.registrationStart).toLocaleString('th-TH', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                      )}
                      {lockSettings.registrationEnd && (
                        <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          สิ้นสุด: {new Date(lockSettings.registrationEnd).toLocaleString('th-TH', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto grid w-full max-w-3xl gap-3">

        {/* My Store Card */}
        <Card className={cn(
          "md:col-span-2 lg:col-span-1 border-2 gap-1 transition-all duration-500 ease-in-out hover:scale-[1.01]",
          theme.cardBg,
          theme.cardBorder,
          theme.cardShadow
        )}>
          <CardHeader className="gap-0">
            <CardTitle className="flex items-center gap-3 text-slate-900 text-base">
              <div className={cn(
                "p-2.5 rounded-xl transition-all duration-300",
                theme.headerAccent
              )}>
                <Store className="h-5 w-5" />
              </div>
              ร้านของฉัน
            </CardTitle>
            {/* <CardDescription className="text-sm text-slate-600 mt-2">
              {store ? "สถานะความพร้อมและข้อมูลร้านค้า" : "สร้างร้านเพื่อจัดการบูธและทีมงาน"}
            </CardDescription> */}
          </CardHeader>
          <CardContent className="space-y-4 pt-4">

            {/* Loading State */}
            {loadingStore && (
              <div className="flex items-center justify-center py-8 text-emerald-700">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                กำลังโหลดข้อมูลร้าน...
              </div>
            )}

            {/* Error State */}
            {!loadingStore && storeError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p>{storeError}</p>
                <Button variant="outline" size="sm" onClick={fetchStoreData} className="mt-2 border-red-200">
                  ลองใหม่
                </Button>
              </div>
            )}

            {/* STORE EXISTS: SHOW VALIDATION DASHBOARD */}
            {!loadingStore && !storeError && validationData && store && (
              <div className="space-y-4">
                {/* Store Header */}
                <div className={cn(
                  "rounded-2xl p-4 border-2 transition-all duration-500 ease-in-out",
                  theme.container,
                  theme.containerShadow
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className={cn("text-lg font-bold mb-1.5", theme.title)}>
                        <div style={{ wordBreak: 'break-all' }}>{store.storeName}</div>
                      </h3>
                      <p className={cn("text-xs", theme.sub)}>
                        หมายเลขร้าน: {store.id} | {convertStoreTypeToLabel(store.type)} | บูธ: {store.boothNumber || "-"}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-xs px-2.5 py-1 font-semibold border-2 transition-all duration-300",
                      getStatusColor(store.state),
                      theme.badgeGlow
                    )}>
                      {convertStateToLabel(store.state)}
                    </Badge>
                  </div>
                </div>

                {/* --- VALIDATION / PROGRESS SECTION --- */}
                <div className={cn(
                  "rounded-2xl border-2 transition-all overflow-hidden duration-500 ease-in-out",
                  isReady ? theme.progressReady : theme.progressNotReady
                )}>
                  {/* Progress Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 transition-colors duration-200"
                    onClick={() => setShowValidationDetails(!showValidationDetails)}
                  >
                    <div className="flex items-center gap-4">
                      {isReady ? (
                        <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                      ) : (
                        <div className="relative">
                          <AlertCircle className="h-9 w-9 text-amber-600" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          {isReady ? "ข้อมูลครบถ้วน" : "ข้อมูลยังไม่ครบ"}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">
                          ความคืบหน้า {progress}%
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-black/10 transition-colors">
                      {showValidationDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Progress Line */}
                  <div className="h-2 w-full bg-white/60 relative overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-1000 ease-out relative overflow-hidden",
                        theme.progressBar
                      )}
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </div>
                  </div>

                  {/* Detail List */}
                  <AnimatePresence>
                    {showValidationDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 space-y-2 bg-white/40 border-t border-black/5">
                          {validationData.sections.map((section) => (
                            <div key={section.key} className="text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-700 flex items-center gap-1.5">
                                  {section.ok ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 text-red-400" />
                                  )}
                                  {section.label}
                                </span>
                                {!section.ok && (
                                  <Link
                                    href={getRouteForSection(section.key)}
                                    className="text-[10px] bg-white border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded-full hover:bg-emerald-50 flex items-center"
                                  >
                                    แก้ไข <ArrowRight className="ml-1 h-2 w-2" />
                                  </Link>
                                )}
                              </div>

                              {!section.ok && (
                                <div className="pl-5 space-y-1">
                                  {section.items.filter(i => !i.ok).map(item => (
                                    <div key={item.key} className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50/50 px-2 py-1 rounded">
                                      <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                      <span>{item.message || item.label}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <div className={cn(
                  "grid gap-3 pt-3",
                  isOwner ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"
                )}>
                  {/* Transfer Button (Only for Admin) */}
                  {isOwner && (
                    <Button
                      variant="outline"
                      className={cn(
                        "transition-all duration-300 hover:scale-105 active:scale-95 font-semibold",
                        theme.outlineButton
                      )}
                      onClick={() => setTransferDialogOpen(true)}
                      disabled={leaving}
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      ถ่ายโอนสิทธิ์
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="border-2 border-red-300/60 text-red-700 hover:bg-red-50/80 hover:border-red-400 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 font-semibold"
                    onClick={handleLeaveStoreClick}
                    disabled={leaving}
                  >
                    ออกจากร้าน
                  </Button>

                  <Button
                    className={cn(
                      "text-white font-semibold transition-all duration-300 hover:scale-105 active:scale-95",
                      theme.primaryButton,
                      isOwner && "sm:col-span-2"
                    )}
                    onClick={() => router.push("/store")}
                  >
                    จัดการร้าน
                  </Button>
                </div>
              </div>
            )}

            {/* NO STORE: CREATE UI */}
            {!loadingStore && !storeError && !store && (
              <div className="space-y-5">
                <Button
                  className={cn(
                    "w-full h-12 text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95",
                    selectingStoreType
                      ? theme.outlineButton
                      : theme.primaryButton
                  )}
                  onClick={handleCreateStore}
                  disabled={lockSettings?.isCurrentlyLocked}
                >
                  {lockSettings?.isCurrentlyLocked ? (
                    <>ปิดรับลงทะเบียน</>
                  ) : selectingStoreType ? (
                    <>ยกเลิก</>
                  ) : (
                    <>
                      <Plus className="mr-2 h-5 w-5" /> สร้างร้านค้าใหม่
                    </>
                  )}
                </Button>
                {/* {!selectingStoreType && (
                  <p className="text-center text-xs text-gray-400">
                    หรือรอรับคำเชิญจากเพื่อนของคุณ
                  </p>
                )} */}

                <AnimatePresence initial={false}>
                  {selectingStoreType && !lockSettings?.isCurrentlyLocked && (
                    <motion.div
                      ref={selectorRef}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className={cn(
                        "rounded-2xl border-2 p-5 backdrop-blur-sm transition-all duration-500",
                        theme.container,
                        theme.containerShadow
                      )}>
                        <p className="mb-3 text-sm font-bold text-slate-900">
                          เลือกประเภทร้านค้า
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Button
                            className={cn(
                              "w-full h-12 justify-start gap-2.5 text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95",
                              theme.outlineButton
                            )}
                            variant="outline"
                            onClick={() => handleSelectStoreType("Nisit")}
                          >
                            <GraduationCap className="h-5 w-5" />
                            ร้านนิสิต
                          </Button>
                          <Button
                            className={cn(
                              "w-full h-12 justify-start gap-2.5 text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95",
                              theme.outlineButton
                            )}
                            variant="outline"
                            onClick={() => handleSelectStoreType("Club")}
                          >
                            <Building2 className="h-5 w-5" />
                            ร้านชมรม/องค์กร
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Leave Dialog */}
            <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>ออกจากร้านนี้?</DialogTitle>
                  <DialogDescription>
                    คุณจะไม่สามารถจัดการร้านนี้ได้อีก จนกว่าจะได้รับคำเชิญใหม่
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setLeaveDialogOpen(false)} disabled={leaving}>
                    ยกเลิก
                  </Button>
                  <Button variant="destructive" onClick={handleLeaveStore} disabled={leaving}>
                    {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยัน"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Transfer Admin Dialog */}
            <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>ถ่ายโอนสิทธิ์เจ้าของร้าน</DialogTitle>
                  <DialogDescription>
                    กรุณาระบุรหัสนิสิตของผู้ที่คุณต้องการมอบสิทธิ์ Admin ให้
                    <span className="block mt-2 text-red-500 font-medium text-xs">
                      คำเตือน: หลังจากโอนสิทธิ์แล้ว คุณจะเสียสถานะ Admin ทันที
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="newAdmin">รหัสนิสิตผู้รับสิทธิ์</Label>
                  <Input
                    id="newAdmin"
                    placeholder="ระบุรหัสนิสิต"
                    value={transferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                  />
                </div>
                <DialogFooter className="mt-2 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setTransferDialogOpen(false)} disabled={transferring}>
                    ยกเลิก
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleTransferAdmin}
                    disabled={transferring || !transferTargetId}
                  >
                    {transferring ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันถ่ายโอน"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </CardContent>
        </Card>
      </main>
    </div >
  )
}