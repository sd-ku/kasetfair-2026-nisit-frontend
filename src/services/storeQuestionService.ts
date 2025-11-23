import { http } from "@/lib/http"

export type StoreQuestionType = "TEXT" | "SINGLE_SELECT" | "MULTI_SELECT"

const STORE_SERVICE_API = "/api/store"

export type StoreQuestionOption = {
  value: string
  label: string
}

export type StoreQuestionAnswer = {
  template: {
    id: number
    key: string
    label: string
    description?: string | null
    type: StoreQuestionType
    options?: StoreQuestionOption[] | null
  },
  answer:
  | {
    value: {
      text?: string
      value?: string
      values?: string[]
    }
  }
  | null
}

export type UpsertStoreAnswersRequest = {
  answers: {
    id: number
    text?: string
    value?: string
    values?: string[]
  }[]
}

export async function getStoreQuestions(): Promise<StoreQuestionAnswer[]> {
  const res = await http.get<StoreQuestionAnswer[]>(`${STORE_SERVICE_API}/questions/mine`)
  return res.data
}

export async function upsertStoreAnswers(
  storeId: number,
  payload: UpsertStoreAnswersRequest
): Promise<StoreQuestionAnswer[]> {
  try {
    const res = await http.patch(`${STORE_SERVICE_API}/questions/mine`, payload)
    return res.data
  } catch (err) {
    console.error(err)
    throw err
  }
}
