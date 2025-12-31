
import { http } from "@/lib/http";

export interface LuckyDrawResponse {
    id: number;
    winner: string;
    createdAt: string;
}

export async function createLuckyDrawWinner(winner: string): Promise<LuckyDrawResponse> {
    const res = await http.post('/api/admin/lucky-draw/winner', { winner });
    return res.data;
}

export async function getLuckyDrawWinners(): Promise<LuckyDrawResponse[]> {
    const res = await http.get('/api/admin/lucky-draw/winners');
    return res.data;
}
