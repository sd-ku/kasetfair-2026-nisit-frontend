
import axios from "axios"

export const http = axios.create({
  baseURL:
    typeof window === "undefined"
      ? process.env.API_URL
      : process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    // ถ้าเป็น error จาก backend ที่ต้องให้ login ใหม่
    const status = error?.response?.status;
    const errorCode = error?.response?.data?.code;

    // Allow skipping redirect for specific requests
    if (error.config?.skipRedirect) {
      return Promise.reject(error);
    }

    // Handle 403 errors
    if (error.status === 403 || status === 403) {
      // ถ้าเป็น registration lock error ให้ปล่อยให้ UI จัดการเอง (ไม่ redirect)
      // Registration lock จะมี error code เป็น 'REGISTRATION_LOCKED'
      if (errorCode === 'REGISTRATION_LOCKED') {
        return Promise.reject(error);
      }

      // ถ้าเป็น 403 อื่นๆ (authentication/authorization) ให้ redirect ไป login
      // ป้องกัน redirect ฝั่ง server
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);