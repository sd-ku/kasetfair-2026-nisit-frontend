"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2, RefreshCcw, Save } from "lucide-react"

import { toast } from "@/lib/toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  StoreQuestionAnswer,
  getStoreQuestions,
  upsertStoreAnswers,
} from "@/services/storeQuestionService"
import { cn } from "@/lib/utils"

type AnswerState = Record<number, { text?: string; value?: string; values?: string[] }>

type StoreQuestionsFormProps = {
  canEdit?: boolean
}

export function StoreQuestionsForm(props: StoreQuestionsFormProps) {
  return (
    <Suspense fallback={<div className="p-4 text-center text-emerald-600">Loading form...</div>}>
      <StoreQuestionsFormContent {...props} />
    </Suspense>
  )
}

function StoreQuestionsFormContent({ canEdit = true }: StoreQuestionsFormProps) {
  const searchParams = useSearchParams()
  const storeIdParam = searchParams.get("storeId")
  const storeId = useMemo(() => Number(storeIdParam), [storeIdParam])
  const hasValidStoreId = Number.isInteger(storeId) && !Number.isNaN(storeId)

  const [questions, setQuestions] = useState<StoreQuestionAnswer[]>([])
  const [answers, setAnswers] = useState<AnswerState>({})
  const [loading, setLoading] = useState(true)
  // const [saving, setSaving] = useState(false) // Removed global saving state
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set()) // Track saving state per question
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const buildInitialAnswers = useCallback((items: StoreQuestionAnswer[]) => {
    const next: AnswerState = {}
    items.forEach((item) => {
      next[item.template.id] = {
        text: item.answer?.value.text ?? "",
        value: item.answer?.value.value ?? "",
        values: item.answer?.value.values ?? [],
      }
    })
    return next
  }, [])

  const loadQuestions = useCallback(async () => {
    if (!hasValidStoreId) {
      setError("ไม่พบ store id กรุณาตรวจสอบและลองใหม่อีกครั้ง")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const data = await getStoreQuestions()
      setQuestions(data)
      setAnswers(buildInitialAnswers(data))
    } catch (err) {
      console.error("ไม่สามารถโหลดคำถามได้ กรุณาลองใหม่อีกครั้ง", err)
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดคำถามได้ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setLoading(false)
    }
  }, [buildInitialAnswers, hasValidStoreId, storeId])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const handleTextChange = (id: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: { ...prev[id], text },
    }))
  }

  const handleSingleSelectChange = (id: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: { ...prev[id], value },
    }))
  }

  const handleMultiSelectToggle = (id: number, optionValue: string) => {
    setAnswers((prev) => {
      const current = prev[id]?.values ?? []
      const exists = current.includes(optionValue)
      const values = exists ? current.filter((v) => v !== optionValue) : [...current, optionValue]
      return {
        ...prev,
        [id]: { ...prev[id], values },
      }
    })
  }

  const handleSaveSingleAnswer = async (questionId: number) => {
    if (!hasValidStoreId) return

    setSavingIds((prev) => new Set(prev).add(questionId))
    setError(null)
    setSuccess(null)

    try {
      const current = answers[questionId] ?? {}
      const question = questions.find((q) => q.template.id === questionId)
      if (!question) return

      let answerPayload
      if (question.template.type === "TEXT") {
        answerPayload = { id: questionId, text: current.text ?? "" }
      } else if (question.template.type === "SINGLE_SELECT") {
        answerPayload = { id: questionId, value: current.value ?? "" }
      } else {
        answerPayload = { id: questionId, values: current.values ?? [] }
      }

      const payload = {
        answers: [answerPayload],
      }

      const updated = await upsertStoreAnswers(storeId, payload)
      setQuestions(updated)
      setAnswers(buildInitialAnswers(updated))

      const successMsg = "บันทึกคำตอบเรียบร้อยแล้ว"
      setSuccess(successMsg)

      toast({
        variant: "success",
        title: "บันทึกสำเร็จ",
        description: successMsg,
      })
    } catch (err) {
      console.error("ไม่สามารถบันทึกคำตอบได้ กรุณาลองใหม่อีกครั้ง", err)

      let errorMsg = "ไม่สามารถบันทึกคำตอบได้ กรุณาลองใหม่อีกครั้ง"

      if (err instanceof Error) {
        // Try to extract meaningful error message
        if (err.message.includes("network") || err.message.includes("fetch")) {
          errorMsg = "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ต"
        } else if (err.message.includes("401") || err.message.includes("unauthorized")) {
          errorMsg = "คุณไม่มีสิทธิ์ในการบันทึกคำตอบ กรุณาเข้าสู่ระบบใหม่"
        } else if (err.message.includes("403") || err.message.includes("forbidden")) {
          errorMsg = "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้"
        } else if (err.message.includes("404")) {
          errorMsg = "ไม่พบข้อมูลที่ต้องการบันทึก"
        } else if (err.message.includes("500")) {
          errorMsg = "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ กรุณาลองใหม่ภายหลัง"
        }
      }

      setError(errorMsg)

      toast({
        variant: "error",
        title: "เกิดข้อผิดพลาด",
        description: errorMsg,
      })
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    }
  }

  const renderQuestionInput = (question: StoreQuestionAnswer) => {
    const { template } = question
    const answer = answers[template.id] ?? question.answer
    const isSaving = savingIds.has(template.id)

    let inputElement = null

    if (template.type === "TEXT") {
      const isLong = (template.description || "").length > 80
      inputElement = isLong ? (
        <Textarea
          value={answer?.text ?? ""}
          onChange={(event) => handleTextChange(template.id, event.target.value)}
          placeholder="Type your answer"
          disabled={!canEdit || isSaving}
        />
      ) : (
        <Input
          value={answer?.text ?? ""}
          onChange={(event) => handleTextChange(template.id, event.target.value)}
          placeholder="Type your answer"
          disabled={!canEdit || isSaving}
        />
      )
    } else if (template.type === "SINGLE_SELECT") {
      inputElement = (
        <Select
          value={answer?.value ?? ""}
          onValueChange={(value) => handleSingleSelectChange(template.id, value)}
          disabled={!canEdit || isSaving}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {template.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    } else if (template.type === "MULTI_SELECT") {
      inputElement = (
        <div className="flex flex-col gap-2">
          {template.options?.map((option) => {
            const checked = answer?.values?.includes(option.value) ?? false
            return (
              <label
                key={option.value}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                  checked ? "border-emerald-300 bg-emerald-50" : "border-gray-200"
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-600"
                  checked={checked}
                  onChange={() => handleMultiSelectToggle(template.id, option.value)}
                  disabled={!canEdit || isSaving}
                />
                <span className="text-gray-800">{option.label}</span>
              </label>
            )
          })}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-3">
        {inputElement}
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={() => handleSaveSingleAnswer(template.id)}
            disabled={!canEdit || isSaving || !hasValidStoreId}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="mr-2 h-3 w-3" />
                บันมึก
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-emerald-100 bg-white/90 shadow-md">
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-emerald-800">
            คำถามเกี่ยวกับสภาพแวดล้อมของร้านค้า
          </CardTitle>
          <CardDescription>
            ตอบคำถามเพียงไม่กี่ข้อเกี่ยวกับสถานที่ตั้งของร้านค้า คำตอบจะถูกบันทึกตามร้านค้า
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasValidStoreId && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <span>{error ?? "Store id is missing"}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-emerald-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>กำลังโหลดคำถาม...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-rose-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && questions.length === 0 && (
          <p className="text-sm text-gray-600">ไม่พบคำถามสำหรับร้านค้านี้</p>
        )}

        {!loading &&
          !error &&
          questions.map((question) => (
            <div
              key={question.template.id}
              className={cn(
                "rounded-xl border border-emerald-100 bg-emerald-50/30 p-4",
                !question.answer && "ring-2 ring-amber-400 ring-offset-2"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-start gap-2">
                    <Label className="text-base font-semibold text-emerald-900">
                      {question.template.label}
                    </Label>
                  </div>
                  {/* <Badge tone="muted" className="text-xs text-emerald-800">
                    {question.template.type}
                  </Badge> */}
                  {question.template.description && (
                    <p className="text-sm text-emerald-800/80">
                      {question.template.description}
                    </p>
                  )}
                </div>

                {!question.answer && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
              </div>

              <div className="mt-3">{renderQuestionInput(question)}</div>
            </div>

          ))}

        {!canEdit && (
          <p className="text-xs text-amber-700">
            คุณไม่มีสิทธิ์ในการแก้ไขคำตอบนี้ กำลังดูเพียงอย่างเดียว
          </p>
        )}
      </CardContent>
    </Card>
  )
}

const Badge = ({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode
  tone?: "muted" | "info"
  className?: string
}) => {
  const color =
    tone === "info"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-slate-100 text-slate-700 border-slate-200"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        color,
        className
      )}
    >
      {children}
    </span>
  )
}
