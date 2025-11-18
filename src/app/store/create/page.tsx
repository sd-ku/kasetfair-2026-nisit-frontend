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
          <Card className="border-emerald-100 shadow-md bg-white/90">
            <CardHeader>
              <CardTitle className="text-emerald-800 text-2xl font-bold">
                ลงทะเบียนร้านสำหรับงาน Kaset Fair
              </CardTitle>
              <CardDescription className="text-emerald-700">
                กรุณากรอกขั้นตอนด้านล่างให้ครบ คุณสามารถกลับมาแก้ไขภายหลังได้
              </CardDescription>

              {/* {storeStatus?.storeAdminNisitId && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-emerald-700">
                  <Badge variant="outline">Store Admin</Badge>
                  <span>{storeStatus.storeAdminNisitId}</span>
                  {isStoreAdmin && <Badge variant="secondary">You</Badge>}
                </div>
              )} */}
              {!canEditStore && (
                  <p className="mt-2 text-xs text-amber-700">
                    คุณสามารถดูข้อมูลนี้ได้ แต่มีเพียงผู้ดูแลร้านเท่านั้นที่สามารถแก้ไขได้
                  </p>
              )}

              {/* {storeStatus && (
                <p className="mt-2 text-xs uppercase tracking-wide text-emerald-600">
                  สถานะปัจจุบัน: {storeStatus.state}
                </p>
              )} */}

              {stepError && (
                <p className="mt-2 text-xs text-red-600">
                  {stepError}
                </p>
              )}
            </CardHeader>

            <CardContent>
              <StepIndicator steps={steps} />
            </CardContent>
          </Card>
        )}

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
