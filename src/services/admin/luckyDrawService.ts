
import { http } from "@/lib/http";

export interface LuckyDrawResponse {
    id: number;
    winner: string;
    createdAt: string;
}

export interface LuckyDrawEntryResponse {
    id: number;
    storeId: number;
    storeName: string;
    isDrawn: boolean;
    drawnAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface GenerateWheelRequest {
    state?: 'Validated' | 'Pending' | 'Rejected' | 'CreateStore' | 'ClubInfo' | 'StoreDetails' | 'ProductDetails' | 'Submitted' | 'Success' | 'deleted';
}

export interface GenerateWheelResponse {
    wheelPath: string;
    totalStores: number;
    entries: string[];  // รายชื่อร้านทั้งหมด
}

export async function createLuckyDrawWinner(winner: string): Promise<LuckyDrawResponse> {
    const res = await http.post('/api/admin/lucky-draw/winner', { winner });
    return res.data;
}

export async function getLuckyDrawWinners(): Promise<LuckyDrawResponse[]> {
    const res = await http.get('/api/admin/lucky-draw/winners');
    return res.data;
}

export async function getLuckyDrawEntries(): Promise<LuckyDrawEntryResponse[]> {
    const res = await http.get('/api/admin/lucky-draw/entries');
    return res.data;
}

export async function generateWheel(request: GenerateWheelRequest): Promise<GenerateWheelResponse> {
    const res = await http.post('/api/admin/lucky-draw/generate-wheel', request);
    return res.data;
}

export async function getActiveEntries(): Promise<string[]> {
    const res = await http.get('/api/admin/lucky-draw/active-entries');
    return res.data;
}

export async function resetWheel(): Promise<{ message: string }> {
    const res = await http.post('/api/admin/lucky-draw/reset');
    return res.data;
}

export interface BoothAvailabilityResponse {
    hasAvailableBooths: boolean;
    foodBooths: number;
    nonFoodBooths: number;
    message: string;
}

export async function checkBoothAvailability(): Promise<BoothAvailabilityResponse> {
    const res = await http.get('/api/admin/lucky-draw/check-booth-availability');
    return res.data;
}
