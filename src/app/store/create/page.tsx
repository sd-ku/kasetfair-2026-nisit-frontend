// page.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StepIndicator } from "@/components/createStep/step-indicator"
import { StepOneForm } from "@/components/createStep/step-one-form"
import { StepTwoForm } from "@/components/createStep/step-two-form"
import { StepThreeForm } from "@/components/createStep/step-three-form"
import { StepSuccess } from "@/components/createStep/step-success"
import { ArrowLeft } from "lucide-react"
import {
  useStoreWizardCore,
  useCreateStoreStep,
  useStoreDetailsStep,
  useProductStep,
} from "@/hooks/store-wizard"
import { commitStoreForPending } from "@/services/storeDraftService"
import { extractErrorMessage } from "@/services/storeServices"
import type { StorePendingValidationResponseDto } from "@/services/dto/store-info.dto"
import { useRouter } from "next/navigation"
import { Plus, Trash2, UploadCloud, CheckCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function StoreCreatePage() {
  const router = useRouter()
  const core = useStoreWizardCore()
  const createStep = useCreateStoreStep(core)
  const storeDetailsStep = useStoreDetailsStep(core)
  const productStep = useProductStep(core)

  const {
    storeType,
    storeStatus,
    storeAdminNisitId,
    isStoreAdmin,
    loadingStatus,
    stepError,
    currentStep,
    layoutStepIndex,
    productStepIndex,
    goNextStep,
    steps,
    setStepError,
    reloadStatus,
    applyStoreSnapshot,
  } = core
  const [pendingValidation, setPendingValidation] = useState<StorePendingValidationResponseDto | null>(
    null
  )
  const [isCommitting, setIsCommitting] = useState(false)
  const computeInvalidChecklistItems = (
    checklist?: StorePendingValidationResponseDto["checklist"]
  ) =>
    (checklist ?? []).filter((item) => {
      if (typeof item.ok === "boolean") {
        return item.ok === false
      }
      if (typeof item.isValid === "boolean") {
        return item.isValid === false
      }
      return false
    })

  if (!storeType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-12">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-3xl bg-white/80 p-10 text-center shadow-xl ring-1 ring-emerald-100">
          <h1 className="text-2xl font-semibold text-emerald-900">
            Choose a store type before starting
          </h1>
          {loadingStatus ? (
            <p className="text-sm text-emerald-700">
              Loading your latest store progress...
            </p>
          ) : (
            <>
              <p className="text-sm text-emerald-700">
                Pick the store type so we can show the correct steps.
              </p>
              <div className="grid w-full gap-3 sm:grid-cols-2">
                <Button
                  className="w-full justify-start gap-3 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => createStep.selectStoreType("Nisit")}
                >
                  Student store
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => createStep.selectStoreType("Club")}
                >
                  Organization store
                </Button>
              </div>
              <Button
                variant="ghost"
                className="text-emerald-700 hover:bg-emerald-50"
                onClick={() => router.push("/home")}
              >
                Back to home
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  const canEditStore = !storeStatus || isStoreAdmin
  const allowCreateSubmit =
    canEditStore && (!storeStatus || (storeStatus.state !== "Pending" && storeStatus.state !== "Submitted"))
  const commitStepIndex = steps[steps.length - 1]?.id ?? productStepIndex
  const handleFinalSubmit = async (): Promise<void> => {
    if (storeStatus && !isStoreAdmin) {
      setStepError("Only the store admin can submit updates.")
      return
    }
    const submitSucceeded = await productStep.submitAll({
      storeStatus,
      storeName: createStep.storeName,
      members: createStep.members,
      layoutDescription: storeDetailsStep.layoutDescription,
      layoutFile: storeDetailsStep.layoutFile,
      products: productStep.products,
    })

    if (!submitSucceeded) {
      return
    }

    const commitSucceeded = await handleCommitStore()
    if (commitSucceeded) {
      core.goToStep(commitStepIndex, { clamp: true })
    }
  }
  const isPendingStore = storeStatus?.state === "Pending"
  const canAttemptCommit = Boolean(storeStatus?.id && !isPendingStore)
  const commitSucceeded =
    pendingValidation?.state === "Pending" && pendingValidation.isValid
  const failedChecklistItems = computeInvalidChecklistItems(pendingValidation?.checklist)

  const handleCommitStore = async (): Promise<boolean> => {
    if (!canAttemptCommit || isCommitting) return false
    if (storeStatus && !isStoreAdmin) {
      setStepError("Only the store admin can commit store updates.")
      return false
    }
    setIsCommitting(true)
    setStepError(null)
    setPendingValidation(null)

    let succeeded = false

    try {
      const response = await commitStoreForPending()
      setPendingValidation(response)
      if (response.state === "Pending" && response.isValid) {
        if (storeStatus) {
          applyStoreSnapshot(
            { ...storeStatus, state: response.state },
            { clampStep: false }
          )
        }
        await reloadStatus({ syncStep: false, preventRegression: true })
        succeeded = true
      } else {
        const invalidItems = computeInvalidChecklistItems(response.checklist)
        if (invalidItems.length) {
          setStepError(
            `Please fix ${invalidItems.length} checklist item${invalidItems.length > 1 ? "s" : ""} before committing.`
          )
        } else {
          setStepError("Store is not ready for pending review.")
        }
      }
    } catch (error) {
      setStepError(extractErrorMessage(error, "Unable to commit store"))
    } finally {
      setIsCommitting(false)
    }

    return succeeded
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        {currentStep !== commitStepIndex && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

            <CardHeader className="space-y-1 pb-0">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => router.back()}
                  className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-900"
                  aria-label="กลับ"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <div className="flex-1 space-y-2">
                  <CardTitle className="text-2xl font-bold tracking-tight text-emerald-900">
                    ลงทะเบียนร้านสำหรับงาน Kaset Fair
                  </CardTitle>
                  <CardDescription className="text-base text-emerald-700/80">
                    กรุณากรอกขั้นตอนด้านล่างให้ครบ คุณสามารถกลับมาแก้ไขภายหลังได้
                  </CardDescription>
                </div>
              </div>

              {storeStatus?.storeAdminNisitId && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50/50 px-4 py-3 border border-emerald-100">
                  <Badge variant="outline" className="border-emerald-300 bg-white text-emerald-700 font-medium">
                    Store Admin
                  </Badge>
                  <span className="text-sm font-medium text-emerald-800">{storeStatus.storeAdminNisitId}</span>
                  {isStoreAdmin && (
                    <Badge variant="secondary" className="bg-emerald-600 text-white hover:bg-emerald-700">
                      You
                    </Badge>
                  )}
                </div>
              )}

              {stepError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm font-medium text-red-700">{stepError}</p>
                </div>
              )}
            </CardHeader>
          </Card>
        )}
          <StepIndicator steps={steps} />
          {/* <CardContent className="pt-0"> */}
          {/* </CardContent> */}

        {currentStep === 1 && (
          <StepOneForm
            storeName={createStep.storeName}
            members={createStep.members}
            memberEmailStatuses={createStep.memberEmailStatuses}
            isStoreAdmin={canEditStore}
            storeAdminNisitId={storeStatus?.storeAdminNisitId ?? storeAdminNisitId}
            onStoreNameChange={createStep.setStoreName}
            onMemberChange={createStep.handleMemberChange}
            onAddMember={createStep.addMember}
            onRemoveMember={createStep.removeMember}
            onNext={createStep.submitCreateStore}
            onViewOnlyNext={() => core.goNextStep()}
            saving={createStep.isSubmitting}
            canSubmit={allowCreateSubmit}
            errorMessage={stepError ?? undefined}
          />
        )}

        {currentStep === layoutStepIndex && (
          <StepTwoForm
            layoutDescription={storeDetailsStep.layoutDescription}
            layoutFileName={storeDetailsStep.layoutFileName}
            isStoreAdmin={isStoreAdmin}
            storeAdminNisitId={storeStatus?.storeAdminNisitId ?? storeAdminNisitId}
            onDescriptionChange={storeDetailsStep.setLayoutDescription}
            onFileChange={storeDetailsStep.setLayoutFile}
            onBack={() => core.goToStep(currentStep - 1)}
            onNext={storeDetailsStep.saveAndContinue}
            saving={storeDetailsStep.isSaving}
          />
        )}

        {currentStep === productStepIndex && (
          <>
            <StepThreeForm
              products={productStep.products.map(({ id, name, price, fileName }) => ({
                id,
                name,
                price,
                fileName,
              }))}
              isStoreAdmin={isStoreAdmin}
              storeAdminNisitId={storeStatus?.storeAdminNisitId ?? storeAdminNisitId}
              onProductChange={productStep.handleProductChange}
              onProductFileChange={productStep.handleProductFileChange}
              onAddProduct={productStep.addProduct}
              onRemoveProduct={productStep.removeProduct}
              onBack={() => core.goToStep(currentStep - 1)}
              onNext={handleFinalSubmit}
              saving={productStep.isSubmitting || isCommitting}
            />
          </>
        )}
        {storeStatus?.id && currentStep === commitStepIndex && (
          <StepSuccess
            isPendingStore={isPendingStore}
            storeStatus={storeStatus}
            pendingValidation={pendingValidation}
            failedChecklistItems={failedChecklistItems}
            onReviewProducts={() => core.goToStep(productStepIndex)}
            onGoHome={() => router.push("/home")}
          />
        )}
      </div>
    </div>
  )
}
