"use client"

import { useCallback, useEffect, useState } from "react"
import { MediaPurpose } from "@/services/dto/media.dto"
import { CreateGoodRequestDto, GoodsResponseDto, GoodsType } from "@/services/dto/goods.dto"
import { uploadMedia } from "@/services/mediaService"
import {
  createGood,
  deleteGood,
  extractErrorMessage,
  listGoods,
  updateGood,
} from "@/services/storeServices"
import type { StoreState } from "@/services/dto/store-info.dto"
import type { StoreWizardCore } from "./store-wizard.core"

export type ProductFormState = {
  id: string
  serverId: string | null
  name: string
  price: string
  type: GoodsType
  file: File | null
  fileName: string | null
  goodMediaId: string | null
  isDirty: boolean
  isNew: boolean
}

const PRODUCT_PLACEHOLDER_COUNT = 3
const DEFAULT_GOODS_TYPE: GoodsType = "Food"
const STORED_FILE_PLACEHOLDER = "Uploaded image"
const PRODUCT_READY_STATES: StoreState[] = ["StoreDetails", "ProductDetails", "Submitted"]

const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `product-${Math.random().toString(16).slice(2)}`

const createProduct = (overrides: Partial<ProductFormState> = {}): ProductFormState => ({
  id: generateId(),
  serverId: null,
  name: "",
  price: "",
  type: DEFAULT_GOODS_TYPE,
  file: null,
  fileName: null,
  goodMediaId: null,
  isDirty: true,
  isNew: true,
  ...overrides,
})

const formatPrice = (value?: string | number | null): string => {
  if (value == null) return ""
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    return typeof value === "string" ? value : ""
  }
  if (Number.isInteger(numeric)) return String(numeric)
  return numeric.toFixed(2)
}

const parsePrice = (value: string): number | null => {
  const normalized = value.replace(/,/g, "").trim()
  if (!normalized) return null
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed * 100) / 100
}

const mapGoodToProduct = (good: GoodsResponseDto): ProductFormState =>
  createProduct({
    id: good.id,
    serverId: good.id,
    name: good.name,
    price: formatPrice(good.price),
    type: good.type,
    fileName: good.goodMediaId ? STORED_FILE_PLACEHOLDER : null,
    goodMediaId: good.goodMediaId,
    file: null,
    isDirty: false,
    isNew: false,
  })

const canManageProducts = (state?: StoreState | null): boolean =>
  Boolean(state && PRODUCT_READY_STATES.includes(state))

export type UseProductStepResult = {
  products: ProductFormState[]
  isSubmitting: boolean
  handleProductChange: (id: string, field: "name" | "price", value: string) => void
  handleProductFileChange: (id: string, file: File | null) => void
  addProduct: () => void
  removeProduct: (id: string) => void
  submitAll: (context?: Record<string, unknown>) => Promise<boolean>
}

export function useProductStep(core: StoreWizardCore): UseProductStepResult {
  const {
    storeStatus,
    resetSignal,
    setStepError,
    goToStep,
    layoutStepIndex,
    reloadStatus,
  } = core

  const storeId = storeStatus?.id ?? null
  const storeState = storeStatus?.state ?? null

  const [products, setProducts] = useState<ProductFormState[]>(() =>
    Array.from({ length: PRODUCT_PLACEHOLDER_COUNT }, () => createProduct())
  )
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  const resetProducts = useCallback(() => {
    setProducts(Array.from({ length: PRODUCT_PLACEHOLDER_COUNT }, () => createProduct()))
    setPendingDeleteIds([])
    setIsSubmitting(false)
  }, [])

  useEffect(() => {
    resetProducts()
  }, [resetProducts, resetSignal])

  const loadProducts = useCallback(async () => {
    if (!storeId || !canManageProducts(storeState)) {
      return
    }
    setIsLoadingProducts(true)
    try {
      const goods = await listGoods()
      if (!goods.length) {
        setProducts(Array.from({ length: PRODUCT_PLACEHOLDER_COUNT }, () => createProduct()))
      } else {
        setProducts(goods.map(mapGoodToProduct))
      }
      setPendingDeleteIds([])
    } catch (error) {
      setStepError(extractErrorMessage(error, "Failed to load goods"))
    } finally {
      setIsLoadingProducts(false)
    }
  }, [setStepError, storeId, storeState])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const handleProductChange = useCallback(
    (id: string, field: "name" | "price", value: string) => {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id
            ? {
                ...product,
                [field]: value,
                isDirty: true,
              }
            : product
        )
      )
    },
    []
  )

  const handleProductFileChange = useCallback((id: string, file: File | null) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              file,
              fileName: file ? file.name : product.fileName,
              isDirty: true,
            }
          : product
      )
    )
  }, [])

  const addProduct = useCallback(() => {
    setProducts((prev) => [...prev, createProduct()])
  }, [])

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => {
      if (prev.length === 1) return prev
      const target = prev.find((product) => product.id === id)
      if (target?.serverId) {
        setPendingDeleteIds((pending) =>
          pending.includes(target.serverId!)
            ? pending
            : [...pending, target.serverId!]
        )
      }
      const next = prev.filter((product) => product.id !== id)
      return next.length ? next : [createProduct()]
    })
  }, [])

  const ensureStoreIsReady = useCallback((): boolean => {
    if (!storeId) {
      setStepError("Please create a store before adding products.")
      goToStep(1, { clamp: false })
      return false
    }
    if (storeState === "Pending") {
      setStepError("This store is already pending review and cannot be edited.")
      return false
    }
    if (!canManageProducts(storeState)) {
      setStepError("Complete the previous steps before managing products.")
      goToStep(layoutStepIndex, { clamp: false })
      return false
    }
    return true
  }, [goToStep, layoutStepIndex, setStepError, storeId, storeState])

  const resolveMediaId = useCallback(async (product: ProductFormState): Promise<string | null> => {
    if (product.file) {
      const media = await uploadMedia({
        purpose: MediaPurpose.STORE_GOODS,
        file: product.file,
      })
      return media.id
    }

    return product.goodMediaId ?? null
  }, [])

  const buildPayload = useCallback(
    async (product: ProductFormState): Promise<CreateGoodRequestDto> => {
      const trimmedName = product.name.trim()
      const priceValue = parsePrice(product.price)

      if (!trimmedName || priceValue == null) {
        throw new Error("Please provide both name and price for each product.")
      }

      const payload: CreateGoodRequestDto = {
        name: trimmedName,
        price: priceValue,
        type: product.type ?? DEFAULT_GOODS_TYPE,
        goodMediaId: await resolveMediaId(product),
      }

      return payload
    },
    [resolveMediaId]
  )

  const submitAll = useCallback(
    async (_context?: Record<string, unknown>) => {
      if (!ensureStoreIsReady()) return false

      setIsSubmitting(true)
      setStepError(null)

      try {
        const deletions = Array.from(new Set(pendingDeleteIds))
        for (const deleteId of deletions) {
          await deleteGood(deleteId)
        }

        const creations: CreateGoodRequestDto[] = []
        const updates: Array<{ id: string; payload: CreateGoodRequestDto }> = []

        for (const product of products) {
          const payload = await buildPayload(product)
          if (!product.serverId) {
            creations.push(payload)
          } else if (product.isDirty || product.file) {
            updates.push({ id: product.serverId, payload })
          }
        }

        if (!creations.length && !updates.length && !deletions.length) {
          return true
        }

        for (const payload of creations) {
          await createGood(payload)
        }

        for (const updateItem of updates) {
          await updateGood(updateItem.id, updateItem.payload)
        }

        setPendingDeleteIds([])
        await loadProducts()
        // await reloadStatus({ syncStep: false, preventRegression: true })
        return true
      } catch (error) {
        setStepError(extractErrorMessage(error, "Failed to save product information"))
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      buildPayload,
      ensureStoreIsReady,
      loadProducts,
      pendingDeleteIds,
      products,
      reloadStatus,
      setStepError,
    ]
  )

  return {
    products,
    isSubmitting: isSubmitting || isLoadingProducts,
    handleProductChange,
    handleProductFileChange,
    addProduct,
    removeProduct,
    submitAll,
  }
}
