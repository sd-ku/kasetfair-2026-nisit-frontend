"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export function useAuthGate(forPage: "register" | "home") {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const go = async () => {
      try {
        const r = await fetch(`${API_URL}/auth/status`, {
          credentials: "include",
          mode: "cors",
        });
        if (!r.ok) {
          router.replace("/login");
          return;
        }
        const data = await r.json().catch(() => ({}));

        // register: อนุญาตเฉพาะคนที่ "ยังไม่ครบ"
        if (forPage === "register") {
          router.replace("/home");
          return;
        }
        // home: อนุญาตเฉพาะคนที่ "ครบแล้ว"
        if (forPage === "home") {
          router.replace("/register");
          return;
        }

        setReady(true);
      } catch {
        router.replace("/login");
      }
    };
    go();
  }, [forPage, router]);

  return ready;
}
