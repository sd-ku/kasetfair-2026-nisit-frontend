// ----- Enums -----
export type BoothZone = 'FOOD' | 'NON_FOOD' | 'UNDEFINED';
export type BoothAssignmentStatus = 'PENDING' | 'CONFIRMED' | 'FORFEITED';

// ----- Import Booth DTOs -----
export interface BoothRangeDto {
    prefix: string;
    start: number;
    end: number;
    zone?: BoothZone; // Optional: จะถูกกำหนดอัตโนมัติเมื่อ assign ร้านตาม goodType
    priorityStart?: number; // ลำดับ priority เริ่มต้น (assignOrder)
}

export interface BoothListDto {
    boothNumbers: string[];
    zone: BoothZone;
}

export interface ImportBoothRangeDto {
    ranges: BoothRangeDto[];
}

export interface ImportBoothListDto {
    lists: BoothListDto[];
}

// ----- Create Assignment DTO -----
export interface CreateBoothAssignmentDto {
    storeId: number;
    luckyDrawEntryId?: number;
}

// ----- Verify Assignment DTO -----
export interface VerifyBoothAssignmentDto {
    barcode: string;
    assignmentId: number;
}

export interface VerifyByStoreIdDto {
    barcode: string;
    storeId: number;
}

// ----- Forfeit Assignment DTO -----
export interface ForfeitBoothAssignmentDto {
    assignmentId: number;
    reason?: string;
}

// ----- Response DTOs -----
export interface BoothResponse {
    id: number;
    boothNumber: string;
    zone: BoothZone;
    assignOrder: number;
    isAssigned: boolean;
    isActive: boolean; // false = ปิดการใช้งาน (soft delete)
    createdAt: string;
    updatedAt: string;
    assignment?: BoothAssignmentResponse;
}

export interface BoothAssignmentResponse {
    id: number;
    boothId: number;
    booth: BoothResponse;
    storeId: number;
    storeName?: string;
    drawOrder: number;
    status: BoothAssignmentStatus;
    verifiedByNisitId?: string;
    verifiedAt?: string;
    forfeitedAt?: string;
    forfeitReason?: string;
    createdAt: string;
    updatedAt: string;
    store?: {
        id: number;
        storeName: string;
        storeAdminNisitId?: string;
        goodType?: string;
    };
    luckyDrawEntry?: {
        id: number;
        storeId: number;
        storeName: string;
    };
}

export interface BoothStatsResponse {
    zone: BoothZone;
    total: number;
    assigned: number;
    pending: number;
    confirmed: number;
    forfeited: number;
    available: number;
    undefined: number; // จำนวน booth ที่อยู่ใน UNDEFINED zone และยังไม่ได้ assign
}

export interface NextBoothInfoResponse {
    zone: BoothZone;
    nextBooth: BoothResponse | null;
    currentDrawOrder: number;
}

export interface ImportResultResponse {
    message: string;
    created: number;
    attempted: number;
}

export interface DeleteResultResponse {
    message: string;
    deleted: number;
}
