export const convertStateToLabel = (state: string): string => {
    if (!state) return "ไม่ระบุ"
    switch (state.toLowerCase()) {
        case "createstore": return "สร้างร้านค้า"
        case "storedetails": return "รายละเอียดร้านค้า"
        case "productdetails": return "รายละเอียดสินค้า"
        case "pending": return "รอการพิจารณา"
        case "validated": return "อนุมัติ"
        case "rejected": return "ไม่อนุมัติ"
        default: return "ไม่ระบุ"
    }
}

export const getStatusColor = (state: string) => {
    if (!state) return "border-slate-200 bg-slate-100 text-slate-700"
    switch (state.toLowerCase()) {
        case "validated":
            return "border-emerald-300 bg-emerald-200 text-emerald-800"
        case "pending":
            return "border-teal-200 bg-teal-100 text-teal-700"
        case "rejected":
            return "border-red-200 bg-red-100 text-red-700"
        case "storedetails":
        case "productdetails":
            return "border-blue-200 bg-blue-100 text-blue-700"
        default:
            return "border-slate-200 bg-slate-100 text-slate-700"
    }
}

export const convertStoreTypeToLabel = (type: string): string => {
    if (!type) return "ไม่ระบุ"
    switch (type.toLowerCase()) {
        case "nisit": return "ร้านค้านิสิต"
        case "club": return "ร้านค้าองค์กร"
        default: return "ไม่ระบุ"
    }
}

export const getEmailStatusToText = (status: string) => {
    switch (status) {
        case "NotFound":
            return "ไม่พบ email นี้ในระบบ กรุณาลงทะเบียนก่อน"
        case "DuplicateStore":
            return "email นี้ถูกใช้แล้ว"
        case "Joined":
            return "เข้าร่วมร้านค้าแล้ว"
        case "ProfileNotCompleted":
            return "ข้อมูลส่วนตัวไม่ครบ"
        default:
            return status
    }
}