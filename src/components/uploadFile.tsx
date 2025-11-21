"use client"

import type React from "react"

import { useCallback, useEffect, useState } from "react"
import { Upload, X, File as FileIcom, ImageIcon, FileText, FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type UploadedFile = {
  id: string
  file: File
  preview?: string
}

type GoogleFileUploadProps = {
  maxFiles?: number
  accept?: string
  maxSize?: number // in bytes
  onFilesChange?: (files: File[]) => void
  disabled?: boolean
  className?: string
  initialFiles?: Array<{
    id: string
    name: string
    url: string
    size?: number
    type?: string
  }>
}

export function GoogleFileUpload({
  maxFiles = 1,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  onFilesChange,
  disabled = false,
  className,
  initialFiles = [],
}: GoogleFileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialFiles.length > 0) {
      const loadedFiles: UploadedFile[] = initialFiles.map((fileInfo) => {
        const mockFile = new File([], fileInfo.name, {
          type: fileInfo.type || "application/octet-stream",
        })

        Object.defineProperty(mockFile, "size", {
          value: fileInfo.size || 0,
          writable: false,
        })

        return {
          id: fileInfo.id,
          file: mockFile,
          preview: fileInfo.url,
        }
      })

      setUploadedFiles(loadedFiles)
    }
  }, [initialFiles])

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files || disabled) return

      setError(null)
      const fileArray = Array.from(files)

      const remainingSlots = maxFiles - uploadedFiles.length
      if (remainingSlots <= 0) {
        setError(`สามารถอัปโหลดได้สูงสุด ${maxFiles} ไฟล์`)
        return
      }

      const filesToAdd = fileArray.slice(0, remainingSlots)

      for (const file of filesToAdd) {
        if (maxSize && file.size > maxSize) {
          setError(`ไฟล์ "${file.name}" มีขนาดใหญ่เกินไป (สูงสุด ${Math.round(maxSize / 1024 / 1024)}MB)`)
          return
        }
      }

      const newFiles: UploadedFile[] = filesToAdd.map((file) => {
        const uploadedFile: UploadedFile = {
          id: `${Date.now()}-${Math.random()}`,
          file,
        }

        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = (e) => {
            uploadedFile.preview = e.target?.result as string
            setUploadedFiles((prev) => [...prev])
          }
          reader.readAsDataURL(file)
        }

        return uploadedFile
      })

      const updatedFiles = [...uploadedFiles, ...newFiles]
      setUploadedFiles(updatedFiles)

      if (onFilesChange) {
        onFilesChange(updatedFiles.map((f) => f.file))
      }
    },
    [uploadedFiles, maxFiles, maxSize, disabled, onFilesChange],
  )

  const handleOpenFile = useCallback((file: UploadedFile) => {
    // เอาไว้เผื่ออนาคตคุณอยากแยก preview กับ url จริง
    const url = file.preview
    if (!url) return

    window.open(url, "_blank", "noopener,noreferrer")
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled],
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const files = e.dataTransfer.files
      processFiles(files)
    },
    [disabled, processFiles],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files)
      e.target.value = ""
    },
    [processFiles],
  )

  const removeFile = useCallback(
    (id: string) => {
        const updatedFiles = uploadedFiles.filter((f) => f.id !== id)
        setUploadedFiles(updatedFiles)
        setError(null)

        if (onFilesChange) {
        const realFiles = updatedFiles.filter((f) => f.file.size > 0)
        onFilesChange(realFiles.map((f) => f.file))
        }
    },
    [uploadedFiles, onFilesChange],
  )

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-8 w-8" />
    if (fileType.includes("pdf")) return <FileText className="h-8 w-8" />
    return <FileIcon className="h-8 w-8" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const canUploadMore = uploadedFiles.length < maxFiles

  return (
    <div className={cn("space-y-4", className)}>
      {canUploadMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-lg border-2 border-dashed transition-all",
            isDragging
              ? "border-emerald-500 bg-emerald-50"
              : "border-emerald-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <label
            htmlFor="file-upload"
            className={cn(
              "flex flex-col items-center justify-center py-12 cursor-pointer",
              disabled && "cursor-not-allowed",
            )}
          >
            <div className="rounded-full bg-emerald-100 p-4 mb-4">
              <Upload className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-lg font-medium text-emerald-800 mb-1">วางไฟล์ที่นี่หรือคลิกเพื่อเลือก</p>
            <p className="text-sm text-emerald-600">
              อัปโหลดได้สูงสุด {maxFiles} ไฟล์
              {maxSize && ` (ไฟล์ละไม่เกิน ${Math.round(maxSize / 1024 / 1024)}MB)`}
            </p>
            {uploadedFiles.length > 0 && (
              <p className="text-xs text-emerald-500 mt-2">
                อัปโหลดแล้ว {uploadedFiles.length} จาก {maxFiles} ไฟล์
              </p>
            )}
          </label>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileInput}
            accept={accept}
            multiple={maxFiles > 1}
            disabled={disabled}
          />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-emerald-700">ไฟล์ที่อัปโหลด ({uploadedFiles.length})</p>
          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                onClick={() => handleOpenFile(uploadedFile)}
                className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-white p-3 hover:bg-emerald-50/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  {uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview || "/placeholder.svg"}
                      alt={uploadedFile.file.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded bg-emerald-100 flex items-center justify-center text-emerald-600">
                      {getFileIcon(uploadedFile.file.type)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-800 truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-emerald-600">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(uploadedFile.id)
                  }}
                  disabled={disabled}
                  className="flex-shrink-0 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">ลบไฟล์</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
