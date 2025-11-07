
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
      // // ดึง URL ปลายทางที่ error เกิดขึ้น
      // const requestUrl = error?.config?.url ?? "";
      
      // // ถ้าเป็น API endpoint (เช่น /api/... ) ให้ปล่อยให้ frontend handle เอง
      // if (requestUrl.startsWith("/api")) {
      //   return Promise.reject(error);
      // }

      // ถ้าเป็น error จาก backend ที่ต้องให้ login ใหม่
      const status = error?.response?.status;
      // if (error.status === 401 || error.status === 403) {
      if (error.status === 403) {
        // ป้องกัน redirect ฝั่ง server
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
);