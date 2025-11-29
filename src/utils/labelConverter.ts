export const convertStateToLabel = (state: string): string => {
    if (!state) return "ไม่ระบุ"
    switch (state.toLowerCase()) {
        case "createstore": return "สร้างร้านค้า"
        case "storedetails": return "รายละเอียดร้านค้า"
        case "productdetails": return "รายละเอียดสินค้า"
        case "pending": return "รอการพิจารณา"
        default: return "ไม่ระบุ"
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
        case "Joined":
            return "เข้าร่วมร้านค้าแล้ว"
        default:
            return status
    }
}