"use client"

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadMedia, uploadMediaViaPresign } from "@/services/mediaService"
import { MediaPurpose } from "@/services/dto/media.dto"
import { GoogleFileUpload } from "@/components/uploadFile"
import { getMediaUrl } from "@/services/mediaService"
import {
  createClubInfo,
  getClubInfo,
  mapClubInfoErrors,
  updateClubInfo,
} from "@/services/clubInfoService"
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { ClubInfoResponseDto } from "@/services/dto/club-info.dto"
import { toast } from "@/lib/toast"

export type ClubInfoFormValues = {
  clubName: string
  leaderFirstName: string
  leaderLastName: string
  leaderNisitId: string
  leaderEmail: string
  leaderPhone: string
  clubApplicationMediaId: string | null
  applicationFileName: string | null
}

export type ClubInfoFormErrors = Partial<
  Record<keyof ClubInfoFormValues | "clubApplicationFile", string>
>

type InitialUploadedFile = {
  id: string
  name: string
  url: string
  size?: number
  type?: string
}

const CLUB_INFO_STORAGE_KEY = "club_info_draft"

const emptyValues: ClubInfoFormValues = {
  clubName: "",
  leaderFirstName: "",
  leaderLastName: "",
  leaderNisitId: "",
  leaderEmail: "",
  leaderPhone: "",
  clubApplicationMediaId: null,
  applicationFileName: null,
}

// Load from local storage
const loadFromLocalStorage = (): Partial<ClubInfoFormValues> | null => {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(CLUB_INFO_STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored)
  } catch (error) {
    console.error("Failed to load from local storage", error)
    return null
  }
}

// Save to local storage
const saveToLocalStorage = (values: ClubInfoFormValues) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CLUB_INFO_STORAGE_KEY, JSON.stringify(values))
  } catch (error) {
    console.error("Failed to save to local storage", error)
  }
}

// Clear local storage
const clearLocalStorage = () => {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(CLUB_INFO_STORAGE_KEY)
  } catch (error) {
    console.error("Failed to clear local storage", error)
  }
}

const translateFieldErrors = (
  errors?: Parameters<typeof mapClubInfoErrors>[0]
): ClubInfoFormErrors | undefined => {
  if (!errors?.length) return undefined
  const mapped = mapClubInfoErrors(errors)
  return Object.entries(mapped).reduce<ClubInfoFormErrors>((acc, [field, message]) => {
    const normalizedField = field.startsWith("clubInfo.")
      ? field.slice("clubInfo.".length)
      : field
    acc[normalizedField as keyof ClubInfoFormErrors] = message
    return acc
  }, {})
}

const buildFormValues = (
  values?: Partial<ClubInfoResponseDto> | null
): ClubInfoFormValues => ({
  clubName: values?.clubName ?? "",
  leaderFirstName: values?.leaderFirstName ?? "",
  leaderLastName: values?.leaderLastName ?? "",
  leaderNisitId: values?.leaderNisitId ?? "",
  leaderEmail: values?.leaderEmail ?? "",
  leaderPhone: values?.leaderPhone ?? "",
  clubApplicationMediaId: values?.clubApplicationMediaId ?? null,
  applicationFileName: null,
})

// เกณฑ์ว่า "ครบพอจะไปเปิดร้านได้หรือยัง"
const isClubInfoComplete = (values: ClubInfoFormValues | null): boolean => {
  if (!values) return false
  return (
    !!values.clubName.trim() &&
    !!values.leaderFirstName.trim() &&
    !!values.leaderLastName.trim() &&
    !!values.leaderNisitId.trim() &&
    !!values.leaderEmail.trim() &&
    !!values.leaderPhone.trim()
    // !!values.clubApplicationMediaId
  )
}

export default function ClubInfoPage() {
  const router = useRouter()

  // ใช้ savedValues แค่ไว้เช็คว่า "กรอกครบแล้วจนผ่าน save อย่างน้อย 1 ครั้งหรือยัง"
  const [savedValues, setSavedValues] = useState<ClubInfoFormValues | null>(null)

  // state ฟอร์มจริง ๆ
  const [values, setValues] = useState<ClubInfoFormValues>(emptyValues)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [initialUploadedFiles, setInitialUploadedFiles] = useState<InitialUploadedFile[]>([])

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ClubInfoFormErrors | undefined>()
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const canContinue = isClubInfoComplete(savedValues)

  const fetchDraft = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const clubInfo = await getClubInfo()

      // Load from local storage
      const localData = loadFromLocalStorage()

      if (clubInfo) {
        const filled = buildFormValues(clubInfo)
        setSavedValues(filled)

        // Merge with local storage data (prioritize local storage for unsaved changes)
        const mergedValues = localData
          ? { ...filled, ...localData }
          : filled
        setValues(mergedValues)

        if (clubInfo.clubApplicationMediaId) {
          try {
            const media = await getMediaUrl(clubInfo.clubApplicationMediaId)
            setInitialUploadedFiles([
              {
                id: clubInfo.clubApplicationMediaId,
                name: media.originalName ?? "club_application",
                url: media.link ?? "",
                size: media.size,
                type: media.mimeType,
              },
            ])
          } catch (err) {
            console.error("Failed to fetch club application file", err)
            toast({
              variant: "error",
              description: "ไม่สามารถโหลดไฟล์ใบคำร้องได้",
            })
          }
        } else {
          setInitialUploadedFiles([])
        }

        setUploadedFiles([])
      } else {
        // No server data, use local storage or empty values
        setSavedValues(null)
        const initialValues = localData
          ? { ...emptyValues, ...localData }
          : emptyValues
        setValues(initialValues)
        setInitialUploadedFiles([])
        setUploadedFiles([])
      }
    } catch (error) {
      console.error("Failed to load club information", error)
      const msg = error instanceof Error
        ? error?.message
        : "ไม่สามารถโหลดข้อมูลองค์กรได้"
      setLoadError(msg)
      toast({
        variant: "error",
        description: msg,
      })

      // Even on error, try to load from local storage
      const localData = loadFromLocalStorage()
      if (localData) {
        setValues({ ...emptyValues, ...localData })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDraft()
  }, [fetchDraft])

  const isSubmitDisabled =
    submitting ||
    !values.clubName.trim() ||
    !values.leaderFirstName.trim() ||
    !values.leaderLastName.trim() ||
    !values.leaderNisitId.trim() ||
    !values.leaderEmail.trim() ||
    !values.leaderPhone.trim()

  const handleChange = (key: keyof ClubInfoFormValues, value: string) => {
    setValues((prev) => {
      const updated = {
        ...prev,
        [key]: value,
      }
      // Save to local storage on every change
      saveToLocalStorage(updated)
      return updated
    })
  }

  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files)
    if (files[0]) {
      setValues((prev) => ({
        ...prev,
        applicationFileName: files[0]?.name ?? prev.applicationFileName,
      }))
    }
    setFieldErrors((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      delete next.clubApplicationMediaId
      return next
    })
  }

  const resolveError = (key: keyof ClubInfoFormValues | "clubApplicationFile") =>
    fieldErrors?.[key] ?? null

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (isSubmitDisabled) return

      setSubmitting(true)
      setGeneralError(null)
      setFieldErrors(undefined)
      setSuccessMessage(null)

      const applicationFile = uploadedFiles[0] ?? null

      try {
        const trimmed = {
          clubName: values.clubName.trim(),
          leaderFirstName: values.leaderFirstName.trim(),
          leaderLastName: values.leaderLastName.trim(),
          leaderNisitId: values.leaderNisitId.trim(),
          leaderEmail: values.leaderEmail.trim(),
          leaderPhone: values.leaderPhone.trim(),
        }

        const applicationFileName =
          applicationFile?.name ??
          values.applicationFileName ??
          null

        let clubApplicationMediaId = values.clubApplicationMediaId ?? null
        if (applicationFile) {
          const media = await uploadMediaViaPresign({
            purpose: MediaPurpose.CLUB_APPLICATION,
            file: applicationFile,
          })
          clubApplicationMediaId = media.mediaId
        }

        if (savedValues) {
          const result = await updateClubInfo({
            ...trimmed,
            clubApplicationMediaId,
          })

          if (result.errors?.length) {
            const nextErrors = translateFieldErrors(result.errors)
            setFieldErrors(nextErrors)
            const msg = "กรุณาตรวจสอบข้อมูลที่ไฮไลท์และลองใหม่อีกครั้ง"
            setGeneralError(msg)
            toast({
              variant: "error",
              description: msg,
            })
            return
          }

          const newValues = result.clubInfo
            ? buildFormValues(result.clubInfo)
            : buildFormValues({
              ...trimmed,
              clubApplicationMediaId,
            })

          setSavedValues(newValues)
          setValues(newValues)
          try {
            if (clubApplicationMediaId) {
              const media = await getMediaUrl(clubApplicationMediaId)
              setInitialUploadedFiles([
                {
                  id: clubApplicationMediaId,
                  name:
                    media.originalName ??
                    applicationFileName ??
                    "club_application",
                  url: media.link ?? "",
                  size: media.size,
                  type: media.mimeType,
                },
              ])
            } else {
              setInitialUploadedFiles([])
            }
          } catch (err) {
            console.error("Failed to refresh application file", err)
          }
          setUploadedFiles([])

          // ✅ ถ้า response ที่กลับมาครบแล้ว → ไปหน้า /store/create
          if (isClubInfoComplete(newValues)) {
            // Clear local storage after successful save
            clearLocalStorage()
            toast({
              variant: "success",
              description: "บันทึกข้อมูลสำเร็จ กำลังดำเนินการต่อ...",
            })
            router.push("/store/create")
            return
          }
        } else {
          const created = await createClubInfo({
            ...trimmed,
            clubApplicationMediaId: clubApplicationMediaId ?? undefined,
          })

          const newValues = buildFormValues({
            clubName: created.clubName ?? trimmed.clubName,
            leaderFirstName: created.leaderFirstName ?? trimmed.leaderFirstName,
            leaderLastName: created.leaderLastName ?? trimmed.leaderLastName,
            leaderNisitId: created.leaderNisitId ?? trimmed.leaderNisitId,
            leaderEmail: created.leaderEmail ?? trimmed.leaderEmail,
            leaderPhone: created.leaderPhone ?? trimmed.leaderPhone,
            clubApplicationMediaId:
              created.clubApplicationMediaId ?? clubApplicationMediaId,
          })

          setSavedValues(newValues)
          setValues(newValues)
          try {
            if (clubApplicationMediaId) {
              const media = await getMediaUrl(clubApplicationMediaId)
              setInitialUploadedFiles([
                {
                  id: clubApplicationMediaId,
                  name:
                    media.originalName ??
                    applicationFileName ??
                    "club_application",
                  url: media.link ?? "",
                  size: media.size,
                  type: media.mimeType,
                },
              ])
            } else {
              setInitialUploadedFiles([])
            }
          } catch (err) {
            console.error("Failed to refresh application file", err)
          }
          setUploadedFiles([])

          // ✅ ถ้า response ที่กลับมาครบแล้ว → ไปหน้า /store/create
          if (isClubInfoComplete(newValues)) {
            // Clear local storage after successful save
            clearLocalStorage()
            toast({
              variant: "success",
              description: "บันทึกข้อมูลสำเร็จ กำลังดำเนินการต่อ...",
            })
            router.push("/store/create")
            return
          }
        }

        // กรณีข้อมูลยังไม่ครบ / ไม่มีไฟล์แนบ → แค่แจ้งว่าบันทึกแล้ว แต่ไม่เด้งหน้า
        // Clear local storage after successful save (even if incomplete)
        clearLocalStorage()
        const msg = "บันทึกข้อมูลองค์กรเรียบร้อยแล้ว"
        setSuccessMessage(msg)
        toast({
          variant: "success",
          description: msg,
        })
      } catch (error) {
        console.error("Failed to save club information", error)
        const msg =
          error instanceof Error
            ? error.message
            : "ไม่สามารถบันทึกข้อมูลองค์กรได้"
        setGeneralError(msg)
        toast({
          variant: "error",
          description: msg,
        })
      } finally {
        setSubmitting(false)
      }
    },
    [uploadedFiles, isSubmitDisabled, savedValues, values, router]
  )

  const handleCancel = useCallback(() => {
    router.push("/home")
  }, [router])

  const goToWizard = useCallback(() => {
    router.push("/store/create")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-10 text-emerald-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 px-6 py-5 shadow-lg ring-1 ring-emerald-100 backdrop-blur">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={handleCancel}
            >
              <ArrowLeft />
            </Button>

            <div className="space-y-2">
              <h1 className="mt-1 text-2xl font-semibold text-emerald-900">
                ระบุข้อมูลองค์กร
              </h1>
              <p className="mt-1 text-sm text-emerald-700">
                กรุณากรอกข้อมูลในขั้นตอนนี้เพื่อให้เราทราบว่าใครเป็นตัวแทนชมรมนักศึกษาของคุณ คุณสามารถกลับมาแก้ไขรายละเอียดได้ก่อนที่จะส่งร้านค้าของคุณ
              </p>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="space-y-4">
          {successMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800">
              {successMessage}
            </div>
          )}

          <Card className="border-emerald-100 bg-white/95 shadow-xl">
            <CardHeader>
              <CardTitle className="text-emerald-900">ข้อมูลองค์กรนิสิต</CardTitle>
              <p className="text-sm text-emerald-700">
                กรอกข้อมูลขององค์กรและประธานสโมสรให้ครบถ้วน จากนั้นแนบไฟล์คำขอรับรองล่าสุด
              </p>
            </CardHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <CardContent className="space-y-6">
                {generalError && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {generalError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="clubName">ชื่อองค์กรกิจกรรมนิสิต (ชมรม/กลุ่ม/ชุมนุม)</Label>
                  <Input
                    id="clubName"
                    value={values.clubName}
                    onChange={(event) =>
                      handleChange("clubName", event.target.value)
                    }
                    placeholder="ตัวอย่าง: สโมสรนิสิตคณะเกษตร"
                    required
                  />
                  {resolveError("clubName") && (
                    <p className="text-sm text-red-600">
                      {resolveError("clubName")}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="leaderFirstName">ชื่อประธาน</Label>
                    <Input
                      id="leaderFirstName"
                      value={values.leaderFirstName}
                      onChange={(event) =>
                        handleChange("leaderFirstName", event.target.value)
                      }
                      placeholder="ชื่อ"
                      required
                    />
                    {resolveError("leaderFirstName") && (
                      <p className="text-sm text-red-600">
                        {resolveError("leaderFirstName")}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leaderLastName">นามสกุลประธาน</Label>
                    <Input
                      id="leaderLastName"
                      value={values.leaderLastName}
                      onChange={(event) =>
                        handleChange("leaderLastName", event.target.value)
                      }
                      placeholder="นามสกุล"
                      required
                    />
                    {resolveError("leaderLastName") && (
                      <p className="text-sm text-red-600">
                        {resolveError("leaderLastName")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="leaderNisitId">รหัสนิสิตของประธาน</Label>
                    <Input
                      id="leaderNisitId"
                      value={values.leaderNisitId}
                      onChange={(event) =>
                        handleChange("leaderNisitId", event.target.value)
                      }
                      placeholder="65XXXXXXXX"
                      inputMode="numeric"
                      required
                    />
                    {resolveError("leaderNisitId") && (
                      <p className="text-sm text-red-600">
                        {resolveError("leaderNisitId")}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leaderEmail">อีเมลประธาน (KU Mail)</Label>
                    <Input
                      id="leaderEmail"
                      type="email"
                      value={values.leaderEmail}
                      onChange={(event) =>
                        handleChange("leaderEmail", event.target.value)
                      }
                      placeholder="president@ku.th"
                      required
                    />
                    {resolveError("leaderEmail") && (
                      <p className="text-sm text-red-600">
                        {resolveError("leaderEmail")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leaderPhone">เบอร์โทรศัพท์ประธาน</Label>
                  <Input
                    id="leaderPhone"
                    value={values.leaderPhone}
                    onChange={(event) =>
                      handleChange("leaderPhone", event.target.value)
                    }
                    placeholder="0812345678"
                    inputMode="tel"
                    required
                  />
                  {resolveError("leaderPhone") && (
                    <p className="text-sm text-red-600">
                      {resolveError("leaderPhone")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>ไฟล์คำขอรับรององค์กร (PDF / PNG / JPG)</Label>
                  <GoogleFileUpload
                    maxFiles={1}
                    accept="application/pdf,image/png,image/jpeg,image/jpg"
                    maxSize={10 * 1024 * 1024}
                    onFilesChange={handleFilesChange}
                    initialFiles={initialUploadedFiles}
                  />
                  <p className="text-xs text-emerald-600">
                    ใช้ไฟล์ที่ลงนามเรียบร้อยแล้ว เพื่อให้ทีมตรวจสอบได้โดยรวดเร็ว
                  </p>
                  {resolveError("clubApplicationMediaId") && (
                    <p className="text-sm text-red-600">
                      {resolveError("clubApplicationMediaId")}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-3 border-t border-emerald-100 bg-emerald-50/40 px-6 py-4">
                <Button
                  type="submit"
                  className="min-w-[180px] bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={isSubmitDisabled}
                >
                  {submitting ? "กำลังบันทึก..." : "บันทึกและไปขั้นถัดไป"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
