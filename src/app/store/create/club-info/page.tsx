"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ClubInfoForm, type ClubInfoFormErrors, type ClubInfoFormSubmitPayload } from "@/components/store/ClubInfoForm"
import { Button } from "@/components/ui/button"
import { MediaPurpose } from "@/services/dto/media.dto"
import { uploadMedia } from "@/services/mediaService"
import {
  getClubInfoDraft,
  mapClubInfoErrors,
  updateClubInfo,
  type StoreDraftData,
} from "@/services/clubInfoService"
import { extractErrorMessage } from "@/services/storeServices"

export default function ClubInfoPage() {
  const router = useRouter()
  const [draft, setDraft] = useState<StoreDraftData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ClubInfoFormErrors>()
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadDraft = useCallback(async () => {
    setLoading(true)
    setPageError(null)
    try {
      const data = await getClubInfoDraft()
      setDraft(data)
    } catch (error) {
      setPageError(extractErrorMessage(error, "Unable to load organization information"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDraft()
  }, [loadDraft])

  const handleSubmit = useCallback(
    async (payload: ClubInfoFormSubmitPayload) => {
      if (!draft?.type) {
        setFormError("Please create a store before submitting organization information.")
        return
      }

      if (draft.type !== "Club") {
        setFormError("Organization details are only required for club stores.")
        return
      }

      setSubmitting(true)
      setFieldErrors(undefined)
      setFormError(null)
      setSuccessMessage(null)

      try {
        let nextMediaId = payload.clubApplicationMediaId ?? null
        let applicationFileName = payload.applicationFileName ?? null

        if (payload.applicationFile) {
          const media = await uploadMedia({
            purpose: MediaPurpose.CLUB_APPLICATION,
            file: payload.applicationFile,
          })
          nextMediaId = media.id
          applicationFileName = payload.applicationFile.name
        }

        const payloadToSubmit = {
          clubName: payload.clubName.trim(),
          leaderFirstName: payload.leaderFirstName.trim(),
          leaderLastName: payload.leaderLastName.trim(),
          leaderNisitId: payload.leaderNisitId.trim(),
          leaderEmail: payload.leaderEmail.trim(),
          leaderPhone: payload.leaderPhone.trim(),
          clubApplicationMediaId: nextMediaId,
          applicationFileName,
        }

        const result = await updateClubInfo(payloadToSubmit)

        if (result.errors?.length) {
          setFieldErrors(mapClubInfoErrors(result.errors))
          setFormError("Please review the highlighted fields.")
          return
        }

        setDraft((prev) =>
          prev
            ? {
                ...prev,
                clubInfo:
                  result.clubInfo ?? {
                    clubName: payloadToSubmit.clubName,
                    leaderFirstName: payloadToSubmit.leaderFirstName,
                    leaderLastName: payloadToSubmit.leaderLastName,
                    leaderNisitId: payloadToSubmit.leaderNisitId,
                    leaderEmail: payloadToSubmit.leaderEmail,
                    leaderPhone: payloadToSubmit.leaderPhone,
                    clubApplicationMediaId: payloadToSubmit.clubApplicationMediaId ?? null,
                    applicationFileName: payloadToSubmit.applicationFileName ?? null,
                  },
              }
            : prev
        )

        setSuccessMessage("Organization information saved successfully.")
      } catch (error) {
        setFormError(extractErrorMessage(error, "Failed to save organization information"))
      } finally {
        setSubmitting(false)
      }
    },
    [draft]
  )

  const initialValues = useMemo(() => draft?.clubInfo ?? undefined, [draft])
  const isClubStore = draft?.type === "Club"

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-12">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="text-center sm:text-left">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Club store onboarding
          </p>
          <h1 className="text-3xl font-bold text-emerald-900">
            Organization information
          </h1>
          <p className="mt-2 text-sm text-emerald-700">
            Provide the latest details about your club and upload the approval letter before proceeding with the rest of the store setup.
          </p>
          {draft?.storeName && (
            <p className="mt-3 text-sm text-emerald-800">
              Store: <span className="font-semibold">{draft.storeName}</span>
            </p>
          )}
        </header>

        {pageError && (
          <div className="rounded-2xl border border-red-100 bg-red-50/80 p-6 text-sm text-red-700 shadow">
            <p>{pageError}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-100" onClick={() => loadDraft()}>
                Try again
              </Button>
              <Button variant="ghost" className="text-red-700 hover:bg-red-100" onClick={() => router.push("/store/create")}>
                Back to store wizard
              </Button>
            </div>
          </div>
        )}

        {!pageError && loading && (
          <div className="rounded-2xl border border-emerald-100 bg-white/90 p-8 text-center text-emerald-800 shadow">
            Loading organization information...
          </div>
        )}

        {!pageError && !loading && !draft && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-6 text-amber-800 shadow">
            <p>No draft store was found. Please create a store before submitting organization details.</p>
            <Button
              className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => router.push("/store/create")}
            >
              Go to store creation
            </Button>
          </div>
        )}

        {!pageError && !loading && draft && draft.type !== "Club" && (
          <div className="rounded-2xl border border-emerald-100 bg-white/90 p-6 text-emerald-800 shadow">
            <p>This page is only required for organization stores.</p>
            <Button variant="outline" className="mt-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => router.push("/store/create")}>
              Back to store wizard
            </Button>
          </div>
        )}

        {!pageError && !loading && isClubStore && draft && (
          <>
            {successMessage && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800">
                {successMessage}
              </div>
            )}
            <ClubInfoForm
              initialValues={initialValues}
              fieldErrors={fieldErrors}
              generalError={formError}
              submitting={submitting}
              onSubmit={handleSubmit}
              onCancel={() => router.push("/store/create?type=Club")}
            />
          </>
        )}
      </div>
    </div>
  )
}
