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
import { uploadMedia } from "@/services/mediaService"
import { MediaPurpose } from "@/services/dto/media.dto"
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
  UploadCloud,
} from "lucide-react"
import { ClubInfoResponseDto } from "@/services/dto/club-info.dto"

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

export type ClubInfoFormSubmitPayload = ClubInfoFormValues & {
  applicationFile: File | null
}

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
    !!values.leaderPhone.trim() &&
    !!values.clubApplicationMediaId // ต้องมีไฟล์คำขอรับรองด้วย
  )
}

export default function ClubInfoPage() {
  const router = useRouter()

  // ใช้ savedValues แค่ไว้เช็คว่า "กรอกครบแล้วจนผ่าน save อย่างน้อย 1 ครั้งหรือยัง"
  const [savedValues, setSavedValues] = useState<ClubInfoFormValues | null>(null)

  // state ฟอร์มจริง ๆ
  const [values, setValues] = useState<ClubInfoFormValues>(emptyValues)
  const [applicationFile, setApplicationFile] = useState<File | null>(null)

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
      if (clubInfo) {
        const filled = buildFormValues(clubInfo)
        setSavedValues(filled)
        setValues(filled)
      } else {
        setSavedValues(null)
        setValues(emptyValues)
      }
    } catch (error) {
      console.error("Failed to load club information", error)
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load organization information."
      )
    } finally {
      setLoading(false)
      setApplicationFile(null)
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
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }))
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

      const payload: ClubInfoFormSubmitPayload = {
        ...values,
        applicationFile,
      }

      try {
        const trimmed = {
          clubName: payload.clubName.trim(),
          leaderFirstName: payload.leaderFirstName.trim(),
          leaderLastName: payload.leaderLastName.trim(),
          leaderNisitId: payload.leaderNisitId.trim(),
          leaderEmail: payload.leaderEmail.trim(),
          leaderPhone: payload.leaderPhone.trim(),
        }

        const applicationFileName =
          payload.applicationFile?.name ??
          payload.applicationFileName ??
          null

        let clubApplicationMediaId = payload.clubApplicationMediaId ?? null
        if (payload.applicationFile) {
          const media = await uploadMedia({
            purpose: MediaPurpose.CLUB_APPLICATION,
            file: payload.applicationFile,
          })
          clubApplicationMediaId = media.id
        }

        if (savedValues) {
          const result = await updateClubInfo({
            ...trimmed,
            clubApplicationMediaId,
          })

          if (result.errors?.length) {
            const nextErrors = translateFieldErrors(result.errors)
            setFieldErrors(nextErrors)
            setGeneralError("Please fix the highlighted fields and try again.")
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
          setApplicationFile(null)

          // ✅ ถ้า response ที่กลับมาครบแล้ว → ไปหน้า /store/create
          if (isClubInfoComplete(newValues)) {
            router.push("/store/create?type=Club")
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
          setApplicationFile(null)

          // ✅ ถ้า response ที่กลับมาครบแล้ว → ไปหน้า /store/create
          if (isClubInfoComplete(newValues)) {
            router.push("/store/create?type=Club")
            return
          }
        }

        // กรณีข้อมูลยังไม่ครบ / ไม่มีไฟล์แนบ → แค่แจ้งว่าบันทึกแล้ว แต่ไม่เด้งหน้า
        setSuccessMessage(
          "Organization information saved. You can continue to the store wizard."
        )
      } catch (error) {
        console.error("Failed to save club information", error)
        setGeneralError(
          error instanceof Error
            ? error.message
            : "Unable to save organization information."
        )
      } finally {
        setSubmitting(false)
      }
    },
    [applicationFile, isSubmitDisabled, savedValues, values, router]
  )

  const handleCancel = useCallback(() => {
    router.push("/home")
  }, [router])

  const goToWizard = useCallback(() => {
    router.push("/store/create?type=Club")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-10 text-emerald-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        {/* Header + action หลัก */}
        <section className="rounded-3xl bg-white/80 p-6 shadow-xl ring-1 ring-emerald-100">
          <p className="text-sm uppercase tracking-wide text-emerald-600">
            Club store onboarding
          </p>
          <h1 className="mt-2 text-3xl font-bold text-emerald-900">
            Provide organization information
          </h1>
          <p className="mt-2 text-sm text-emerald-700">
            Complete this step so we know who represents your student club. You can
            return and edit the details before submitting your store.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={handleCancel}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Button>
            <Button
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300"
              onClick={goToWizard}
              disabled={!canContinue}
              title={
                canContinue
                  ? undefined
                  : "Fill in the club information before continuing."
              }
            >
              Continue to store wizard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>

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
                    <Label htmlFor="clubName">ชื่อองค์กรนิสิต</Label>
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
                    <label
                      className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-dashed border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-100"
                    >
                      <span className="truncate">
                        {applicationFile?.name ??
                          values.applicationFileName ??
                          "เลือกไฟล์ ไม่เกิน 10 MB"}
                      </span>
                      <UploadCloud className="h-4 w-4" />
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null
                          setApplicationFile(file)
                          if (!file) return
                          setValues((prev) => ({
                            ...prev,
                            applicationFileName: file.name,
                          }))
                        }}
                      />
                    </label>
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
