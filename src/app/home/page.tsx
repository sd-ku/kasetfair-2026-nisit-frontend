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
  UserCog
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
import { convertStateToLabel, convertStoreTypeToLabel } from "@/utils/labelConverter"

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
      router.push(`/store/create?type=Club`)
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

  return (
    <div className="min-h-screen bg-emerald-50 px-4 py-6">
      <header className="mx-auto w-full max-w-3xl shadowmb-6 px-1 sm:px-0">
        <div className="rounded-2xl bg-white border border-emerald-50 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center justify-between gap-4">

          <div className="flex items-center gap-3.5 overflow-hidden">
            <Link
              href="/info"
              // เพิ่ม ring ให้ดูมีมิติเมื่ออยู่บนการ์ดขาว
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-lg ring-4 ring-emerald-50 transition-all active:scale-95"
            >
              {displayInitial}
            </Link>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-emerald-500">ยินดีต้อนรับ,</span>
              <h1 className="text-lg font-bold text-slate-800 truncate leading-tight">
                {displayName}
              </h1>
            </div>
          </div>

          <div>
            {/* ใช้ปุ่มสีเทาอ่อนๆ (slate-100) เพื่อให้ดูเป็น action รองลงมา */}
            <Button
              variant="secondary"
              size="sm"
              className="h-9 w-9 p-0 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors sm:w-auto sm:px-3"
              onClick={() => handleLogout()}
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline text-xs">ออกระบบ</span>
            </Button>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto mt-4 grid w-full max-w-3xl gap-4 md:mt-6">

        {/* My Store Card */}
        <Card className="border-emerald-100 md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Store className="h-5 w-5" />
              ร้านของฉัน
            </CardTitle>
            <CardDescription className="text-sm">
              {store ? "สถานะความพร้อมและข้อมูลร้านค้า" : "สร้างร้านเพื่อจัดการบูธและทีมงาน"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">

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
                <div className="rounded-xl bg-emerald-50/50 p-3 border border-emerald-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-emerald-900">
                        {store.storeName}
                      </h3>
                      <p className="text-xs text-emerald-600">
                        {convertStoreTypeToLabel(store.type)} | บูธ: {store.boothNumber || "-"}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700">
                      {convertStateToLabel(store.state)}
                    </Badge>
                  </div>
                </div>

                {/* --- VALIDATION / PROGRESS SECTION --- */}
                <div className={cn(
                  "rounded-lg border transition-all overflow-hidden",
                  isReady ? "border-emerald-200 bg-emerald-50/30" : "border-amber-200 bg-amber-50/30"
                )}>
                  {/* Progress Header */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-black/5"
                    onClick={() => setShowValidationDetails(!showValidationDetails)}
                  >
                    <div className="flex items-center gap-3">
                      {isReady ? (
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      ) : (
                        <div className="relative">
                          <AlertCircle className="h-8 w-8 text-amber-500" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          {isReady ? "ข้อมูลครบถ้วน" : "ข้อมูลยังไม่ครบ"}
                        </div>
                        <div className="text-xs text-gray-500">
                          ความคืบหน้า {progress}%
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {showValidationDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Progress Line */}
                  <div className="h-1 w-full bg-white/50">
                    <div
                      className={cn("h-full transition-all duration-1000", isReady ? "bg-emerald-500" : "bg-amber-500")}
                      style={{ width: `${progress}%` }}
                    />
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
                  "grid gap-2 pt-2",
                  isOwner ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"
                )}>
                  {/* Transfer Button (Only for Admin) */}
                  {isOwner && (
                    <Button
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => setTransferDialogOpen(true)}
                      disabled={leaving}
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      ถ่ายโอนสิทธิ์
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={handleLeaveStoreClick}
                    disabled={leaving}
                  >
                    ออกจากร้าน
                  </Button>

                  <Button
                    className={cn(
                      "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
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
              <div className="space-y-4">
                <Button
                  className={`w-full ${selectingStoreType
                    ? "border border-emerald-600 text-emerald-600 bg-white hover:bg-emerald-50"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  onClick={handleCreateStore}
                >
                  {selectingStoreType ? (
                    <>ยกเลิก</>
                  ) : (
                    <>
                      <Plus className="mr-2 h-5 w-5" /> สร้างร้านค้าใหม่
                    </>
                  )}
                </Button>
                {!selectingStoreType && (
                  <p className="text-center text-xs text-gray-400">
                    หรือรอรับคำเชิญจากเพื่อนของคุณ
                  </p>
                )}

                <AnimatePresence initial={false}>
                  {selectingStoreType && (
                    <motion.div
                      ref={selectorRef}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                        <p className="mb-3 text-sm font-medium text-emerald-800">
                          เลือกประเภทร้านค้า
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button
                            className="w-full justify-start gap-2 bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                            variant="outline"
                            onClick={() => handleSelectStoreType("Nisit")}
                          >
                            <GraduationCap className="h-4 w-4" />
                            ร้านนิสิต
                          </Button>
                          <Button
                            className="w-full justify-start gap-2 bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                            variant="outline"
                            onClick={() => handleSelectStoreType("Club")}
                          >
                            <Building2 className="h-4 w-4" />
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
    </div>
  )
}