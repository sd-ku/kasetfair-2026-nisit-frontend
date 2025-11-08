// page.tsx
"use client"

import { Button } from "@/components/ui/button"
import { StepIndicator } from "@/components/createStep/step-indicator"
import { StepOneForm } from "@/components/createStep/step-one-form"
import { StepClubInfoForm } from "@/components/createStep/step-club-form"
import { StepTwoForm } from "@/components/createStep/step-two-form"
import { StepThreeForm } from "@/components/createStep/step-three-form"
import { useStoreWizard } from "./useStoreWizard"
import { useRouter } from "next/navigation"
import type { Step } from "@/components/createStep/step-indicator"

export default function StoreCreatePage() {
  const router = useRouter()
  const wizard = useStoreWizard()
  const {
    storeType,
    storeStatus,
    loadingStatus,
    saving,
    stepError,
    currentStep,
    layoutStepIndex,
    productStepIndex,
    steps,

    // fields
    storeName,
    members,
    memberEmailStatuses,
    layoutDescription,
    layoutFile,
    clubInfo,
    products,

    // handlers
    handleSelectStoreType,
    handleCreateStore,
    handleClubInfoFieldChange,
    handleClubApplicationFileChange,
    handleSimulatedSave,
    handleFinalSubmit,
    updateStepParam,
    handleMemberChange,
    handleAddMember,
    handleRemoveMember,
    handleProductChange,
    handleProductFileChange,
    handleAddProduct,
    handleRemoveProduct,
  } = wizard

  const stepIndicatorSteps: Step[] = steps.map((step): Step => ({
    id: step.id,
    label: step.label,
    status:
      step.id < currentStep
        ? "completed"
        : step.id === currentStep
        ? "current"
        : "upcoming",
  }))

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
                  onClick={() => handleSelectStoreType("Nisit")}
                >
                  Student store
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => handleSelectStoreType("Club")}
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
          <StepIndicator steps={stepIndicatorSteps} />
        </header>

        {currentStep === 1 && (
          <StepOneForm
            storeName={storeName}
            members={members}
            memberEmailStatuses={memberEmailStatuses}
            onStoreNameChange={(v) => wizard.setStoreName(v)}
            onMemberChange={handleMemberChange}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onNext={handleCreateStore}
            saving={saving}
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
            onOrganizationNameChange={(v) => handleClubInfoFieldChange("organizationName", v)}
            onPresidentFirstNameChange={(v) => handleClubInfoFieldChange("presidentFirstName", v)}
            onPresidentLastNameChange={(v) => handleClubInfoFieldChange("presidentLastName", v)}
            onpresidentNisitIdChange={(v) => handleClubInfoFieldChange("presidentNisitId", v)}
            onPresidentEmailChange={(v) => handleClubInfoFieldChange("presidentEmail", v)}
            onPresidentPhoneChange={(v) => handleClubInfoFieldChange("presidentPhone", v)}
            onApplicationFileChange={handleClubApplicationFileChange}
            onBack={() => updateStepParam(currentStep - 1)}
            onNext={() => handleSimulatedSave(currentStep + 1)}
            saving={saving}
          />
        )}

        {currentStep === layoutStepIndex && (
          <StepTwoForm
            layoutDescription={layoutDescription}
            layoutFileName={layoutFile?.name ?? null}
            onDescriptionChange={wizard.setLayoutDescription}
            onFileChange={wizard.setLayoutFile}
            onBack={() => updateStepParam(currentStep - 1)}
            onNext={() => handleSimulatedSave(currentStep + 1)}
            saving={saving}
          />
        )}

        {currentStep === productStepIndex && (
          <StepThreeForm
            products={products.map(({ id, name, price, fileName }) => ({
              id,
              name,
              price,
              fileName,
            }))}
            onProductChange={handleProductChange}
            onProductFileChange={handleProductFileChange}
            onAddProduct={handleAddProduct}
            onRemoveProduct={handleRemoveProduct}
            onBack={() => updateStepParam(currentStep - 1)}
            onSubmitAll={handleFinalSubmit}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}
