"use client"

import { toast as sonnerToast } from "sonner"

type ToastVariant = "default" | "success" | "error" | "warning" | "destructive"

type ToastOptions = {
  title?: string
  description?: string
  variant?: ToastVariant
}

export function toast(options: ToastOptions) {
  const { title, description, variant = "default" } = options

  const msg = description || title || ""
  if (!msg) return

  switch (variant) {
    case "success":
      sonnerToast.success(msg)
      break
    case "destructive":
    case "error":
      sonnerToast.error(msg)
      break
    case "warning":
      sonnerToast.warning(msg)
      break
    default:
      sonnerToast(msg)
      break
  }
}
