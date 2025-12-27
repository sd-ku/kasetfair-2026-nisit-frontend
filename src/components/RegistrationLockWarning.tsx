import { Card, CardContent } from "@/components/ui/card";

interface RegistrationLockWarningProps {
    message?: string;
    title?: string;
}

export function RegistrationLockWarning({
    message = "ขณะนี้ปิดรับการแก้ไขข้อมูลชั่วคราว กรุณาลองใหม่อีกครั้งในภายหลัง",
    title = "ปิดรับการแก้ไขข้อมูล"
}: RegistrationLockWarningProps) {
    return (
        <Card className="border-red-200 bg-red-50 shadow-lg mb-6">
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-red-100">
                        <svg
                            className="h-6 w-6 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-red-800 mb-2">
                            {title}
                        </h3>
                        <p className="text-sm text-red-700 whitespace-pre-wrap">
                            {message}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
