"use client"

import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
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
import { http } from "@/lib/http"
import {
  Building2,
  GraduationCap,
  Loader2,
  LogOut,
  Mail,
  Plus,
  Store,
  Users2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getStoreStatus, leaveStore } from "@/services/storeServices"

type Invitation = {
  id: string
  storeName: string
  inviterName: string
  inviteeEmail: string
  role?: string
  createdAt?: string
  message?: string | null
}

type myStore = {
  id: number
  storeName: string
  type: string
  state: string
}

const draftStates = ["CreateStore", "ClubInfo", "StoreDetails", "ProductDetails"]

export const convertStateToLabel = (
  state: string,
): string => {
  if (!state) return "ไม่ระบุ"

  switch (state) {
    case "CreateStore":
      return "สร้างร้านค้า"
    case "StoreDetails":
      return "รายละเอียดร้านค้า"
    case "ProductDetails":
      return "รายละเอียดสินค้า"
    case "Pending":
      return "รอจับฉลาก"
    default:
      return "ไม่ระบุ"
  }
}

export default function HomePage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [selectingStoreType, setSelectingStoreType] = useState(false)

  const [store, setStore] = useState<myStore | null>(null)
  const [loadingStore, setLoadingStore] = useState(true)
  const [storeError, setStoreError] = useState<string | null>(null)

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const displayName = useMemo(
    () => session?.user?.name || session?.user?.email || "Kaset Fair Member",
    [session?.user?.email, session?.user?.name]
  )

  const fetchInvitations = useCallback(async () => {
    setLoadingInvites(true)
    setInviteError(null)
    try {
      const res = await http.get<Invitation[]>("/shops/invitations")
      const data = Array.isArray(res.data) ? res.data : []
      setInvitations(data)
    } catch (error) {
      console.error("Failed to load invitations", error)
      setInviteError("โหลดคำเชิญไม่สำเร็จ")
      setInvitations([])
    } finally {
      setLoadingInvites(false)
    }
  }, [])

  const fetchStoreStatus = useCallback(async () => {
    setLoadingStore(true)
    setStoreError(null)

    try {
      const res = await getStoreStatus()
      setStore(res || null) // มีร้าน -> แสดงการ์ดร้าน
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status
      if (status === 404) {
        setStore(null)
        setStoreError(null)
      } else {
        console.error("Failed to load store status", err)
        setStore(null)
        setStoreError("โหลดสถานะร้านไม่สำเร็จ")
      }
    } finally {
      setLoadingStore(false)
    }
  }, [])


  useEffect(() => {
    fetchInvitations()
    fetchStoreStatus()
  }, [fetchInvitations, fetchStoreStatus])

  useEffect(() => {    
    const onFocus = () => fetchStoreStatus()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [fetchStoreStatus])

  const handleLeaveStoreClick = useCallback(() => {
    setLeaveDialogOpen(true)
  }, [])

  const handleLeaveStore = useCallback(async () => {
    setLoadingStore(true)
    setStoreError(null)
    try {
      await leaveStore()
      setStore(null)
      setLeaveDialogOpen(false)
    } catch (err: any) {
      console.error("Failed to leave store", err)
      setStoreError("ไม่สามารถออกจากร้านได้ กรุณาลองใหม่")
    } finally {
      setLeaving(false)
      setLoadingStore(false)
    }
  }, [leaveStore])

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

  return (
    <div className="min-h-screen bg-emerald-50 px-4 py-6">
      {/* Header — compact, mobile-first */}
      <header className="mx-auto w-full max-w-3xl">
        <div className="flex items-start justify-between">
          <div>
            {/* <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
              สวัสดี
            </p> */}
            <h1 className="text-2xl font-bold text-emerald-900">{displayName}</h1>
            <p className="mt-1 text-sm text-emerald-700">
              จัดการร้านและคำเชิญของคุณ
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 shrink-0 border-emerald-200 text-emerald-700"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">ออกจากระบบ</span>
          </Button>
        </div>
      </header>

      {/* Content — single column on mobile, two on md+ */}
      <main className="mx-auto mt-4 grid w-full max-w-3xl gap-4 md:mt-6 md:grid-cols-2">
        {/* My Store */}
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Store className="h-5 w-5" />
              ร้านของฉัน
            </CardTitle>
            <CardDescription className="text-sm">
              สร้างร้านเพื่อจัดการบูธและทีมงาน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 1) Loading */}
            {loadingStore && (
              <div className="flex items-center justify-center py-8 text-emerald-700">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                กำลังโหลดสถานะร้าน...
              </div>
            )}
            {/* 2) Store error */}
            {!loadingStore && storeError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p>{storeError}</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" onClick={fetchStoreStatus} className="border-red-200">
                    ลองใหม่
                  </Button>
                </div>
              </div>
            )}
            {/* 3) มีร้านแล้ว */}
            {!loadingStore && !storeError && store && (
              <div className="rounded-xl border border-emerald-100 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-emerald-900">
                      {store.storeName}
                    </h3>
                    <p className="mt-0.5 text-xs text-emerald-700">
                      ประเภท: {store.type}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
                    {convertStateToLabel(store.state)}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="
                      w-full
                      border-red-500
                      text-red-600
                      bg-white
                      hover:bg-red-50
                      hover:text-red-700
                      active:bg-red-100
                    "
                    onClick={handleLeaveStoreClick}
                    disabled={leaving}
                  >
                    {leaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังออก...
                      </>
                    ) : (
                      "ออกจากร้าน"
                    )}
                  </Button>
                  <Button
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => {
                      const isDraft = draftStates.includes(store.state)
                      router.push(isDraft ? "/store/create" : "/store")
                    }}
                  >
                    จัดการร้าน
                  </Button>
                </div>
              </div>
            )}
            {/* ปุ่มหลัก: toggle แสดง/ซ่อนพาเนล */}
            <Button
              className={`w-full ${
                store
                  ? "bg-emerald-200 text-emerald-500 cursor-not-allowed" // มีร้านแล้ว -> จาง
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
              aria-expanded={selectingStoreType}
              onClick={() => {
                if (!store) handleCreateStore()
              }}
              disabled={!!store} // disable จริง
            >
              <Plus className="h-5 w-5" />
              {store ? "คุณมีร้านแล้ว" : selectingStoreType ? "Cancel" : "Create a new store"}
            </Button>
            {!selectingStoreType && (
              <p className="text-[11px] text-emerald-600 mt-1">
                {store
                  ? "คุณสร้างร้านแล้ว จัดการร้านได้ด้านบน"
                  : "Invite your teammates to manage the store together once registration is complete."}
              </p>
            )}

            <AnimatePresence initial={false}>
              {!store && selectingStoreType && (
                <motion.div
                  ref={selectorRef}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pt-3">
                    <p className="text-sm font-medium text-emerald-800">
                      Select store type
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        className="w-full justify-start gap-3 bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => handleSelectStoreType("Nisit")}
                      >
                        <GraduationCap className="h-5 w-5" />
                        Nisit store
                      </Button>
                      <Button
                        className="w-full justify-start gap-3 border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                        variant="outline"
                        onClick={() => handleSelectStoreType("Club")}
                      >
                        <Building2 className="h-5 w-5" />
                        Club store
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Dialog ยืนยันออกจากร้าน */}
            <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>ออกจากร้านนี้?</DialogTitle>
                  <DialogDescription>
                    หากคุณออกจากร้านแล้ว คุณจะไม่สามารถจัดการร้านนี้ได้อีก จนกว่าจะได้รับคำเชิญใหม่จากเจ้าของร้าน
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setLeaveDialogOpen(false)}
                    disabled={leaving}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleLeaveStore}
                    disabled={leaving}
                  >
                    {leaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังออก...
                      </>
                    ) : (
                      "ยืนยันออกจากร้าน"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Invitations */}
        {/* <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Users2 className="h-5 w-5" />
              คำเชิญเข้าร่วมร้าน
            </CardTitle>
            <CardDescription className="text-sm">
              ตอบรับหรือปฏิเสธคำเชิญได้ที่นี่
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingInvites ? (
              <div className="flex items-center justify-center py-8 text-emerald-700">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                กำลังโหลด...
              </div>
            ) : inviteError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p>{inviteError}</p>
                <Button
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={fetchInvitations}
                >
                  ลองใหม่
                </Button>
              </div>
            ) : invitations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-emerald-200 bg-white p-4 text-center text-sm text-emerald-700">
                <Users2 className="mx-auto mb-2 h-7 w-7" />
                ยังไม่มีคำเชิญ
              </div>
            ) : (
              <ul className="space-y-3">
                {invitations.map((inv) => (
                  <li key={inv.id}>
                    <InvitationCard invitation={inv} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card> */}
      </main>
    </div>
  )
}

type InvitationCardProps = { invitation: Invitation }

function InvitationCard({ invitation }: InvitationCardProps) {
  const formattedDate =
    invitation.createdAt && !Number.isNaN(new Date(invitation.createdAt).getTime())
      ? new Intl.DateTimeFormat("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(invitation.createdAt))
      : null

  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-emerald-900">
            {invitation.storeName}
          </h3>
          <p className="mt-0.5 text-xs text-emerald-700">เชิญโดย {invitation.inviterName}</p>
        </div>
        {invitation.role && (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
            {invitation.role}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-emerald-700">
        <Mail className="h-3.5 w-3.5" />
        <span className="truncate">{invitation.inviteeEmail}</span>
        {formattedDate && (
          <>
            <span className="h-1 w-1 rounded-full bg-emerald-300" />
            <span>{formattedDate}</span>
          </>
        )}
      </div>

      {invitation.message && (
        <p className="mt-2 rounded-md bg-emerald-50 p-2 text-sm text-emerald-800">
          {invitation.message}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
          ตอบรับ
        </Button>
        <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          ปฏิเสธ
        </Button>
      </div>
    </div>
  )
}
