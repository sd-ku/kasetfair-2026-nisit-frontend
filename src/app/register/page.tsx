"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createNisitInfo } from "@/services/nisitService";

type FormState = {
  firstName: string;
  lastName: string;
  nisitId: string;
  phone: string;
  nisitCardLink: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { status, data, update } = useSession();
  const params = useSearchParams();

  const [formData, setFormData] = useState<FormState>({
    firstName: "",
    lastName: "",
    nisitId: "",
    phone: "",
    nisitCardLink: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // กัน redirect ซ้ำใน dev/StrictMode
  const hasRoutedRef = useRef(false);

  // Guard: อนุญาตเฉพาะคนที่ล็อกอินแล้ว และยังไม่ complete
  useEffect(() => {
    if (hasRoutedRef.current) return;
    if (status === "loading" || submitting) return;

    if (status === "unauthenticated") {
      hasRoutedRef.current = true;
      const callbackUrl = params.get("callbackUrl") ?? "/register";
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status, router, submitting, params]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "phone") {
      // อนุญาตเฉพาะตัวเลขสูงสุด 10 หลัก เริ่มด้วย 0
      const cleaned = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: cleaned }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // validate เบื้องต้น
    const phoneOk = /^0[0-9]{9}$/.test(formData.phone);
    if (!phoneOk) {
      setError("กรุณากรอกเบอร์โทร 10 หลัก และขึ้นต้นด้วย 0");
      return;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.nisitId.trim()) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setSubmitting(true);
    setIsLoading(true);
    setError(null);

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      nisitId: formData.nisitId.trim(),
      phone: formData.phone.trim(),
      nisitCardLink: formData.nisitCardLink.trim() || null,
    };

    try {
      const res = await createNisitInfo(payload);              // ฝั่ง API ควรอ่าน email จาก JWT/cookie เอง
      router.replace("/home");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  // Loading state หน้า
  if (status === "loading") {
    return <p className="text-center mt-10 text-gray-600">กำลังตรวจสอบสิทธิ์…</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-800 mb-2">Create Account</h1>
          <p className="text-emerald-600">Join the Kaset Fair</p>
        </div>

        <Card className="border-emerald-200 shadow-lg">
          <form className="flex flex-col gap-6" onSubmit={handleRegister} noValidate>
            <CardContent className="space-y-4">
              <Field
                id="firstName"
                name="firstName"
                label="ชื่อ"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={isLoading}
                autoComplete="given-name"
                required
              />

              <Field
                id="lastName"
                name="lastName"
                label="นามสกุล"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={isLoading}
                autoComplete="family-name"
                required
              />

              <Field
                id="nisitId"
                name="nisitId"
                label="รหัสนิสิต"
                value={formData.nisitId}
                onChange={handleInputChange}
                disabled={isLoading}
                autoComplete="student-id"
                required
              />

              <Field
                id="phone"
                name="phone"
                label="เบอร์โทร"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={isLoading}
                type="tel"
                inputMode="numeric"
                pattern="^0[0-9]{9}$"
                title="กรุณากรอกเบอร์โทรศัพท์ 10 หลัก เริ่มต้นด้วย 0"
                placeholder="08xxxxxxxx"
                required
              />

              {/* optional */}
              <Field
                id="nisitCardLink"
                name="nisitCardLink"
                label="ลิงก์บัตรนิสิต (ถ้ามี)"
                value={formData.nisitCardLink}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="https://..."
              />

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-emerald-400"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create account"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

/** ช่วยลดซ้ำของฟิลด์ */
function Field(props: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
  title?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const {
    id,
    name,
    label,
    value,
    onChange,
    disabled,
    required,
    type = "text",
    inputMode,
    pattern,
    title,
    placeholder,
    autoComplete,
  } = props;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        type={type}
        inputMode={inputMode}
        pattern={pattern}
        title={title}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
}
