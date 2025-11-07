import { MediaRequestDto, MediaResponseDto } from "./dto/media.dto";
import { http } from "@/lib/http";

const MEDIA_SERVICE_API = `/api/media`;

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

//   try {
//     const res = await http.post(`${MEDIA_SERVICE_API}/upload`, formData, {
//     headers: {
//         "Content-Type": "multipart/form-data",
//     },
//     });

//     return res.data as MediaResponseDto;
//   } catch (error: any) {
//     console.error("Upload media failed:", error);
//     throw new Error(
//       error?.response?.data?.message || "Upload failed. Please try again."
//     );
//   }
}