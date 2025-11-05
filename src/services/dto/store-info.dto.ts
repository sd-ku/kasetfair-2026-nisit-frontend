export type StoreType = "Nisit" | "Club"

export type ClubApplicationDto = {
  organizationName: string
  presidentFirstName: string
  presidentLastName: string
  presidentStudentId: string
  applicationFileName?: string | null
}

type storeState = {
  // ขั้นตอนการสร้างร้าน
  "CreateStore":    string
  "ClubDetails":    string
  "StoreDetails":   string
  "ProductDetails": string
  "Submitted":      string

  // หลังจากส่งแล้ว เข้าสู่สถานะหลัก
  "Pending":        string // รอจับฉลาก
  "Success":        string // ได้รับเลือก
  "Rejected":       string // ไม่ได้รับเลือก (ถ้ามี)
}


export type CreateStoreRequestDto = {
  storeName: string;
  type: StoreType;
  memberGmails: string[];
  // clubApplication?: ClubApplicationDto;
}

export type StoreStatusResponseDto = {
  id: number;
  storeName: string;
  type: StoreType;
  state: storeState;
}
