import { http } from "@/lib/http";
import {
    BoothZone,
    BoothAssignmentStatus,
    ImportBoothRangeDto,
    ImportBoothListDto,
    CreateBoothAssignmentDto,
    VerifyBoothAssignmentDto,
    VerifyByStoreIdDto,
    ForfeitBoothAssignmentDto,
    BoothResponse,
    BoothAssignmentResponse,
    BoothStatsResponse,
    NextBoothInfoResponse,
    ImportResultResponse,
    DeleteResultResponse,
} from "./dto/booth.dto";

// Re-export types for convenience
export * from "./dto/booth.dto";

// ----- Booth Management -----

/**
 * Import booth แบบ range
 * POST /api/admin/booth/import-range
 */
export async function importBoothRange(dto: ImportBoothRangeDto): Promise<ImportResultResponse> {
    const res = await http.post('/api/admin/booth/import-range', dto);
    return res.data;
}

/**
 * Import booth แบบ list
 * POST /api/admin/booth/import-list
 */
export async function importBoothList(dto: ImportBoothListDto): Promise<ImportResultResponse> {
    const res = await http.post('/api/admin/booth/import-list', dto);
    return res.data;
}

/**
 * ดึงค่า priority (assignOrder) สูงสุด
 * GET /api/admin/booth/last-priority
 */
export async function getLastPriority(): Promise<{ lastPriority: number }> {
    const res = await http.get('/api/admin/booth/last-priority');
    return res.data;
}

/**
 * ดึง booth ทั้งหมด
 * GET /api/admin/booth
 */
export async function getAllBooths(zone?: BoothZone, isAssigned?: boolean): Promise<BoothResponse[]> {
    const params = new URLSearchParams();
    if (zone) params.append('zone', zone);
    if (isAssigned !== undefined) params.append('isAssigned', String(isAssigned));

    const res = await http.get(`/api/admin/booth?${params.toString()}`);
    return res.data;
}

/**
 * ลบ booth
 * DELETE /api/admin/booth/:id
 */
export async function deleteBooth(id: number): Promise<BoothResponse> {
    const res = await http.delete(`/api/admin/booth/${id}`);
    return res.data;
}

/**
 * ลบ booth ทั้งหมด
 * DELETE /api/admin/booth/all/reset
 */
export async function deleteAllBooths(): Promise<DeleteResultResponse> {
    const res = await http.delete('/api/admin/booth/all/reset');
    return res.data;
}

/**
 * ปิดการใช้งาน booth หลายอันพร้อมกัน (Soft Delete / Disable)
 * PUT /api/admin/booth/bulk-disable
 */
export async function bulkDisableBooths(boothIds: number[]): Promise<{ message: string; disabled: number }> {
    const res = await http.put('/api/admin/booth/bulk-disable', { boothIds });
    return res.data;
}

/**
 * เปิดการใช้งาน booth หลายอันพร้อมกัน (Enable)
 * PUT /api/admin/booth/bulk-enable
 */
export async function bulkEnableBooths(boothIds: number[]): Promise<{ message: string; enabled: number }> {
    const res = await http.put('/api/admin/booth/bulk-enable', { boothIds });
    return res.data;
}

/**
 * อัปเดตลำดับ booth (assignOrder)
 * PUT /api/admin/booth/update-order
 */
export async function updateBoothOrder(booths: Array<{ id: number; assignOrder: number }>): Promise<{ message: string; updated: number }> {
    const res = await http.put('/api/admin/booth/update-order', { booths });
    return res.data;
}

// ----- Stats -----

/**
 * ดึงสถิติ booth
 * GET /api/admin/booth/stats
 */
export async function getBoothStats(): Promise<BoothStatsResponse[]> {
    const res = await http.get('/api/admin/booth/stats');
    return res.data;
}

/**
 * ดึง booth ว่างถัดไปตาม zone
 * GET /api/admin/booth/next/:zone
 */
export async function getNextAvailableBooth(zone: BoothZone): Promise<NextBoothInfoResponse> {
    const res = await http.get(`/api/admin/booth/next/${zone}`);
    return res.data;
}

// ----- Assignment Management -----

/**
 * ดึง assignments ทั้งหมด
 * GET /api/admin/booth/assignments
 */
export async function getAllAssignments(zone?: BoothZone, status?: BoothAssignmentStatus): Promise<BoothAssignmentResponse[]> {
    const params = new URLSearchParams();
    if (zone) params.append('zone', zone);
    if (status) params.append('status', status);

    const res = await http.get(`/api/admin/booth/assignments?${params.toString()}`);
    return res.data;
}

/**
 * ดึง assignment ตาม ID
 * GET /api/admin/booth/assignments/:id
 */
export async function getAssignmentById(id: number): Promise<BoothAssignmentResponse> {
    const res = await http.get(`/api/admin/booth/assignments/${id}`);
    return res.data;
}

/**
 * ดึง pending assignment ล่าสุด
 * GET /api/admin/booth/assignments/pending/latest
 */
export async function getLatestPendingAssignment(zone?: BoothZone): Promise<BoothAssignmentResponse | null> {
    const params = new URLSearchParams();
    if (zone) params.append('zone', zone);

    const res = await http.get(`/api/admin/booth/assignments/pending/latest?${params.toString()}`);
    return res.data;
}

/**
 * สร้าง assignment ใหม่ (เมื่อสุ่มได้ร้าน)
 * POST /api/admin/booth/assignments
 */
export async function createAssignment(dto: CreateBoothAssignmentDto): Promise<BoothAssignmentResponse> {
    const res = await http.post('/api/admin/booth/assignments', dto);
    return res.data;
}

/**
 * ยืนยัน assignment ด้วย barcode
 * POST /api/admin/booth/assignments/verify
 */
export async function verifyAssignment(dto: VerifyBoothAssignmentDto): Promise<BoothAssignmentResponse> {
    const res = await http.post('/api/admin/booth/assignments/verify', dto);
    return res.data;
}

/**
 * ยืนยัน assignment ด้วย barcode โดยระบุ storeId
 * POST /api/admin/booth/assignments/verify-by-store
 */
export async function verifyByStoreId(dto: VerifyByStoreIdDto): Promise<BoothAssignmentResponse> {
    const res = await http.post('/api/admin/booth/assignments/verify-by-store', dto);
    return res.data;
}

/**
 * สละสิทธิ์ assignment
 * POST /api/admin/booth/assignments/forfeit
 */
export async function forfeitAssignment(dto: ForfeitBoothAssignmentDto): Promise<BoothAssignmentResponse> {
    const res = await http.post('/api/admin/booth/assignments/forfeit', dto);
    return res.data;
}

/**
 * สุ่มใหม่สำหรับร้านที่ยังไม่มี booth
 * POST /api/admin/booth/assignments/re-draw/:storeId
 */
export async function reDrawForStore(storeId: number): Promise<BoothAssignmentResponse> {
    const res = await http.post(`/api/admin/booth/assignments/re-draw/${storeId}`);
    return res.data;
}

/**
 * ค้นหาร้านจาก nisit barcode
 * POST /api/admin/booth/lookup-store
 */
export interface LookupStoreResponse {
    scannedBarcode: string; // Original barcode that was scanned
    nisit: {
        nisitId: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        role: 'admin' | 'member';
    };
    store: {
        id: number;
        storeName: string;
        goodType: string | null;
        boothNumber: string | null;
        state: string;
        storeAdmin: {
            nisitId: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string | null;
        } | null;
        members: Array<{
            nisitId: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string | null;
        }>;
    };
    assignment: {
        id: number;
        booth: {
            id: number;
            boothNumber: string;
            zone: BoothZone;
        };
        status: BoothAssignmentStatus;
        drawOrder: number;
        verifiedByNisitId: string | null;
        verifiedAt: string | null;
        createdAt: string;
    } | null;
}

export async function lookupStoreByBarcode(barcode: string): Promise<LookupStoreResponse> {
    const res = await http.post('/api/admin/booth/lookup-store', { barcode });
    return res.data;
}
