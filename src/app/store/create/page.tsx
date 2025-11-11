// page.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { StepIndicator } from "@/components/createStep/step-indicator"
import { StepOneForm } from "@/components/createStep/step-one-form"
import { StepClubInfoForm } from "@/components/createStep/step-club-form"
import { StepTwoForm } from "@/components/createStep/step-two-form"
import { StepThreeForm } from "@/components/createStep/step-three-form"
import {
  useStoreWizardCore,
  useCreateStoreStep,
  useClubInfoStep,
  useStoreDetailsStep,
  useProductStep,
} from "@/hooks/store-wizard"
import { commitStoreForPending, extractErrorMessage } from "@/services/storeServices"
import type { StorePendingValidationResponseDto } from "@/services/dto/store-info.dto"
import { useRouter } from "next/navigation"

export default function StoreCreatePage() {
  const router = useRouter()
  const core = useStoreWizardCore()
  const createStep = useCreateStoreStep(core)
  const clubStep = useClubInfoStep(core)
  const storeDetailsStep = useStoreDetailsStep(core)
  const productStep = useProductStep(core)
  const clubInfo = clubStep.clubInfo

  const {
    storeType,
    storeStatus,
    loadingStatus,
    stepError,
    currentStep,
    layoutStepIndex,
    productStepIndex,
    steps,
    setStepError,
    reloadStatus,
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

  const allowCreateSubmit = !storeStatus || storeStatus.state === "CreateStore"
  const handleFinalSubmit = () =>
    productStep.submitAll({
      storeStatus,
      storeName: createStep.storeName,
      members: createStep.members,
      layoutDescription: storeDetailsStep.layoutDescription,
      layoutFile: storeDetailsStep.layoutFile,
      products: productStep.products,
      clubInfo: clubStep.clubInfo,
    })
  const isPendingStore = storeStatus?.state === "Pending"
  const canAttemptCommit = Boolean(storeStatus?.id && !isPendingStore)
  const commitSucceeded =
    pendingValidation?.state === "Pending" && pendingValidation.isValid
  const failedChecklistItems = computeInvalidChecklistItems(pendingValidation?.checklist)

  const handleCommitStore = async () => {
    if (!canAttemptCommit || isCommitting) return
    setIsCommitting(true)
    setStepError(null)
    setPendingValidation(null)

    try {
      const response = await commitStoreForPending()
      setPendingValidation(response)
      if (response.state === "Pending" && response.isValid) {
        await reloadStatus()
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800">
              Kaset Fair store registration
            </h1>
            <p className="mt-2 text-sm text-emerald-700">
              Complete the steps below. You can return later.
            </p>
            {storeStatus && (
              <p className="mt-2 text-xs uppercase tracking-wide text-emerald-600">
                Current state: {storeStatus.state}
              </p>
            )}
            {stepError && (
              <p className="mt-2 text-xs text-red-600">
                {stepError}
              </p>
            )}
          </div>
          <StepIndicator steps={steps} />
        </header>

        {currentStep === 1 && (
          <StepOneForm
            storeName={createStep.storeName}
            members={createStep.members}
            memberEmailStatuses={createStep.memberEmailStatuses}
            onStoreNameChange={createStep.setStoreName}
            onMemberChange={createStep.handleMemberChange}
            onAddMember={createStep.addMember}
            onRemoveMember={createStep.removeMember}
            onNext={createStep.submitCreateStore}
            saving={createStep.isSubmitting}
            canSubmit={allowCreateSubmit}
            errorMessage={stepError ?? undefined}
          />
        )}

        {storeType === "Club" && currentStep === 2 && (
          <StepClubInfoForm
            organizationName={clubInfo.organizationName}
            presidentFirstName={clubInfo.presidentFirstName}
            presidentLastName={clubInfo.presidentLastName}
            presidentNisitId={clubInfo.presidentNisitId}
            presidentEmail={clubInfo.presidentEmail}
            presidentPhone={clubInfo.presidentPhone}
            applicationFileName={clubInfo.applicationFileName}
            onOrganizationNameChange={(value) => clubStep.updateField("organizationName", value)}
            onPresidentFirstNameChange={(value) => clubStep.updateField("presidentFirstName", value)}
            onPresidentLastNameChange={(value) => clubStep.updateField("presidentLastName", value)}
            onpresidentNisitIdChange={(value) => clubStep.updateField("presidentNisitId", value)}
            onPresidentEmailChange={(value) => clubStep.updateField("presidentEmail", value)}
            onPresidentPhoneChange={(value) => clubStep.updateField("presidentPhone", value)}
            onApplicationFileChange={clubStep.updateApplicationFile}
            onBack={() => core.goToStep(currentStep - 1)}
            onNext={clubStep.submitClubInfo}
            saving={clubStep.isSubmitting}
          />
        )}

        {currentStep === layoutStepIndex && (
          <StepTwoForm
            layoutDescription={storeDetailsStep.layoutDescription}
            layoutFileName={storeDetailsStep.layoutFileName}
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
              onProductChange={productStep.handleProductChange}
              onProductFileChange={productStep.handleProductFileChange}
              onAddProduct={productStep.addProduct}
              onRemoveProduct={productStep.removeProduct}
              onBack={() => core.goToStep(currentStep - 1)}
              onSubmitAll={handleFinalSubmit}
              saving={productStep.isSubmitting}
            />

            {storeStatus?.id && (
              <div className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-lg">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-900">
                      Commit store for review
                    </h3>
                    <p className="text-sm text-emerald-700">
                      {isPendingStore
                        ? "Your store is already pending approval. You will be notified when the review is finished."
                        : "Run the validation checklist to move your store into the pending queue."}
                    </p>
                  </div>
                  {!isPendingStore ? (
                    <Button
                      className="min-w-[11rem] bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={handleCommitStore}
                      disabled={!canAttemptCommit || isCommitting}
                    >
                      {isCommitting ? "Validating..." : "Commit store"}
                    </Button>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                      Pending review
                    </span>
                  )}
                </div>

                {pendingValidation && (
                  <div className="mt-5 space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">
                          Validation result
                        </p>
                        <p className="text-xs text-emerald-700">
                          Store state: {pendingValidation.state} · Checklist status:{" "}
                          {pendingValidation.isValid ? "Passed" : "Needs attention"}
                        </p>
                      </div>
                      {commitSucceeded && (
                        <span className="rounded-full bg-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-900">
                          Successfully committed
                        </span>
                      )}
                    </div>

                    {failedChecklistItems.length > 0 && (
                      <ul className="space-y-2 text-sm">
                        {failedChecklistItems.map((item, index) => {
                          const key = item.key || item.label || `item-${index}`
                          const description = item.message || item.description || null
                          return (
                            <li
                              key={key}
                              className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-white/70 p-3"
                            >
                              <span
                                className={`mt-1 h-2.5 w-2.5 rounded-full ${
                                  item.isValid ? "bg-emerald-500" : "bg-red-500"
                                }`}
                              />
                              <div>
                                <p className="font-medium text-emerald-900">
                                  {item.label || item.key || `Checklist item ${index + 1}`}
                                </p>
                                {description && (
                                  <p className="text-xs text-emerald-700">{description}</p>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
