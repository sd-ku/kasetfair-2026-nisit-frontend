import { http } from "@/lib/http"
import { AxiosError } from "axios";
import { MediaPurpose } from "@/services/dto/media.dto"
import { MediaRequestDto, MediaResponseDto } from "@/services/dto/media.dto"
import { MediaInfoDto } from "@/services/dto/media.dto"

const MEDIA_S3_SERVICE_API = `/api/media/s3`;
const MEDIA_SERVICE_API = `/api/media`;

function isAxiosError(err: unknown): err is AxiosError {
  return !!(err as AxiosError)?.isAxiosError;
}

export async function uploadMedia(
  payload: MediaRequestDto
): Promise<MediaResponseDto> {
  const formData = new FormData();
  formData.append("purpose", payload.purpose);
  formData.append("file", payload.file);

  const res = await http.post(`${MEDIA_SERVICE_API}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data
}

export function extractErrorMessage(
  error: unknown,
  fallback: string = "Unexpected error"
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function requestPresignUpload(params: {
  purpose: MediaPurpose
  file: File
}) {
  const { purpose, file } = params

  const body = {
    purpose,
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
  }

  const res = await http.post("/api/media/s3/presign", body)
  return res.data   // axios / wrapper มักจะห่อเป็น data
}

export async function uploadFileToS3(uploadUrl: string, file: File) {
  // PUT ตรงไป S3 ต้องส่ง binary
  // http.put() ของนายต้องรองรับ raw body (เช่น axios.put)
  await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  })
}

export async function confirmS3Upload(mediaId: string, file?: File) {
  const body = {
    mediaId,
    size: file?.size,
  }

  const res = await http.post("/api/media/s3/confirm", body)
  return res.data
}

export async function uploadMediaViaPresign(params: {
  purpose: MediaPurpose
  file: File
}) {
  const { purpose, file } = params

  // 1) ขอ presign
  const { mediaId, uploadUrl, key } = await requestPresignUpload({
    purpose,
    file,
  })

  // 2) PUT ขึ้น S3
  await uploadFileToS3(uploadUrl, file)

  // 3) confirm
  const media = await confirmS3Upload(mediaId, file)

  return { mediaId, media, key }
}

export async function listMediaFromS3(prefix?: string) {
  const url = prefix
    ? `/api/media/s3/list?prefix=${encodeURIComponent(prefix)}`
    : `/api/media/s3/list`

  const res = await http.get(url)
  return res.data
}

export async function deleteMediaFromS3(mediaId: string) {
  const res = await http.delete(`/api/media/s3/${mediaId}`)
  return res.data
}

export async function getMediaUrl(mediaId: string, options?: { skipRedirect?: boolean }): Promise<MediaInfoDto> {
  const res = await http.get(`/api/media/s3/${mediaId}`, {
    skipRedirect: options?.skipRedirect
  } as any)
  return res.data
}