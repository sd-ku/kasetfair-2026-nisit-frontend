"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Save, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { GoogleFileUpload } from "@/components/uploadFile"
import { Badge } from "@/components/ui/badge"

import { getMediaUrl, uploadMediaViaPresign } from "@/services/mediaService"
import { MediaPurpose } from "@/services/dto/media.dto"
import { getStoreStatus, updateStore, extractErrorMessage } from "@/services/storeServices"
import { getNisitInfo } from "@/services/nisitService"
import { isStoreAdmin as isStoreAdminUtil } from "@/utils/storeAdmin"
import type { StoreResponseDto } from "@/services/dto/store-info.dto"

type InitialUploadedFile = {
  id: string
  name: string
  url: string
  size?: number
  type?: string
}

export default function StoreLayoutPage() {
  const [store, setStore] = useState<StoreResponseDto | null>(null)
  const [storeFiles, setStoreFiles] = useState<File[]>([])
  const [savingStoreFiles, setSavingStoreFiles] = useState(false)
  const [storeFileError, setStoreFileError] = useState<string | null>(null)
  const [storeFileMessage, setStoreFileMessage] = useState<string | null>(null)
  const [initialLayoutUploadedFiles, setInitialLayoutUploadedFiles] = useState<InitialUploadedFile[]>([])
  const [currentUserNisitId, setCurrentUserNisitId] = useState<string | null>(null)

  const router = useRouter()

  const isStoreAdmin = useMemo(
    () => isStoreAdminUtil(currentUserNisitId, store?.storeAdminNisitId ?? null),
    [currentUserNisitId, store?.storeAdminNisitId],
  )
  const canEditStore = Boolean(store && isStoreAdmin)

  const fetchStore = useCallback(async () => {
    try {
      const data = await getStoreStatus()
      setStore(data)
      if (data.boothLayoutMediaId) {
        const mediaRes = await getMediaUrl(data.boothLayoutMediaId)
        setInitialLayoutUploadedFiles([
          {
            id: mediaRes.id,
            name: mediaRes.originalName ?? "layout_name",
            url: mediaRes.link ?? "",
            size: mediaRes.size,
            type: mediaRes.mimeType,
          },
        ])
      }
    } catch (error) {
      console.error("Failed to fetch store info", error)
    }
  }, [])

  useEffect(() => {
    fetchStore()
  }, [fetchStore])

  useEffect(() => {
    ;(async () => {
      try {
        const profile = await getNisitInfo()
        if (profile?.nisitId) {
          setCurrentUserNisitId(profile.nisitId)
        }
      } catch (error) {
        console.error("Failed to load current user profile", error)
      }
    })()
  }, [])

  const handleSaveStoreFiles = async () => {
    if (!store) {
      setStoreFileError("ไม่พบข้อมูลร้านค้า")
      return
    }

    if (storeFiles.length === 0) {
      setStoreFileError("กรุณาอัปโหลดไฟล์ก่อนบันทึก")
      return
    }

    setSavingStoreFiles(true)
    setStoreFileError(null)
    setStoreFileMessage(null)

    try {
      const uploadRes = await uploadMediaViaPresign({
        purpose: MediaPurpose.STORE_LAYOUT,
        file: storeFiles[0],
      })

      if (!uploadRes?.mediaId) {
        throw new Error("อัปโหลดไฟล์ไม่สำเร็จ")
      }

      await updateStore({
        boothMediaId: uploadRes.mediaId,
      })

      setStoreFileMessage("บันทึกการเปลี่ยนแปลงแล้ว")
    } catch (error) {
      setStoreFileError(extractErrorMessage(error, "บันทึกการเปลี่ยนแปลงไม่สำเร็จ"))
    } finally {
      setSavingStoreFiles(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 px-6 py-5 shadow-lg ring-1 ring-emerald-100 backdrop-blur">
          <div className="flex items-center gap-3">
            <Button
                type="button"
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => router.push("/store")}
            >
                <ArrowLeft />
            </Button>

            <div className="space-y-2">
              <h1 className="mt-1 text-2xl font-semibold text-emerald-900">
                  อัปโหลดรูป/ไฟล์ร้านค้า
              </h1>
              <p className="mt-1 text-sm text-emerald-700">
                  ดูสถานะร้าน ปรับปรุงสมาชิก และอัปเดตรายการสินค้าได้จากหน้าเดียว
              </p>
              {store?.storeAdminNisitId && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50/50 px-4 py-3 border border-emerald-100">
                  <Badge variant="outline" className="border-emerald-300 bg-white text-emerald-700 font-medium">
                    Store Admin
                  </Badge>
                  <span className="text-sm font-medium text-emerald-800">{store.storeAdminNisitId}</span>
                  {isStoreAdmin && (
                    <Badge variant="secondary" className="bg-emerald-600 text-white hover:bg-emerald-700">
                      You
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <Card className="border-emerald-100 bg-white/90 shadow-md">
          <CardHeader>
            <CardTitle className="text-emerald-800">
                อัปโหลดรูป/ไฟล์ร้านค้า
            </CardTitle>
            <CardDescription className="text-sm">
              เพิ่มรูปโปรโมต เมนู หรือเอกสารที่เกี่ยวข้องกับร้านค้า (สูงสุด 5MB ต่อไฟล์)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleFileUpload
              maxFiles={1}
              accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
              maxSize={5 * 1024 * 1024}
              onFilesChange={setStoreFiles}
              className="max-w-xl"
              disabled={!canEditStore}
              initialFiles={initialLayoutUploadedFiles}
            />
            {storeFileError && <p className="mt-2 text-sm text-red-600">{storeFileError}</p>}
            {storeFileMessage && <p className="mt-2 text-sm text-emerald-700">{storeFileMessage}</p>}
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleSaveStoreFiles}
                disabled={!canEditStore || savingStoreFiles}
              >
                {savingStoreFiles ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    บันทึกการเปลี่ยนแปลง
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
