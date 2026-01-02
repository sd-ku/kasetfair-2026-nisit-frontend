import { StoreState, StoreType, GoodsType } from "@/services/dto/store-info.dto";

// Nisit member information
export type NisitMemberDto = {
    nisitId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
};

// Club information
export type ClubInfoDto = {
    id: string;
    clubName: string;
    leaderFirstName: string;
    leaderLastName: string;
    leaderEmail: string;
    leaderPhone: string;
    leaderNisitId: string;
    clubApplicationMedia: MediaDto;
};

// Media information
export type MediaDto = {
    id: string;
    link: string;
    status: string;
};

// Goods/Product information
export type GoodsDto = {
    id: string;
    name: string;
    type: GoodsType;
    price: string;
    googleMedia: MediaDto;
};

// Member attempt email status
export type MemberAttemptEmailDto = {
    email: string;
    status: "NotFound" | "Pending" | "Joined";
    invitedAt: string;
    joinedAt: string | null;
    nisitId: string | null;
};

// Question answer information
export type QuestionAnswerDto = {
    id: number;
    value: {
        text?: string;
        values?: string[];
    };
    question: {
        id: number;
        key: string;
        label: string;
        type: "TEXT" | "MULTI_SELECT";
    };
};

// Review status enum
export type ReviewStatus = "NeedFix" | "Pending" | "Rejected" | "deleted";

// Admin role enum
export type AdminRole = "SUPER_ADMIN" | "ADMIN";

// Admin information
export type AdminDto = {
    id: number;
    email: string;
    name: string | null;
    role: AdminRole;
};

// Review draft information - ผลการตรวจสอบร้านค้าโดย admin
export type ReviewDraftDto = {
    id: number;
    status: ReviewStatus;        // สถานะการตรวจสอบ (NeedFix = ต้องแก้ไข, Pending = รอจับฉลาก, Rejected = ถูกปฏิเสธ, deleted = ถูกลบ)
    comment: string | null;      // ข้อความจาก admin อธิบายผลการตรวจสอบหรือสิ่งที่ต้องแก้ไข
    createdAt: string;           // วันที่สร้างผลการตรวจสอบ
    updatedAt: string;           // วันที่แก้ไขผลการตรวจสอบล่าสุด
    admin: AdminDto;             // ข้อมูล admin ที่ทำการตรวจสอบ
};

// Main store data for admin review
export type AdminStoreDto = {
    id: number;
    storeName: string;
    boothNumber: string | null;
    type: StoreType;
    state: StoreState;
    goodType: GoodsType | null;
    storeAdminNisitId: string;
    boothMediaId: string | null;
    createdAt: string;
    updatedAt: string;
    storeAdmin: NisitMemberDto;
    clubInfo: ClubInfoDto | null;
    members: NisitMemberDto[];
    memberAttemptEmails: MemberAttemptEmailDto[];
    goods: GoodsDto[];
    boothMedia: MediaDto | null;
    questionAnswers: QuestionAnswerDto[];
    reviewDrafts: ReviewDraftDto[];
};

// Pagination metadata
export type PaginationMetaDto = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

// Find all stores response
export type FindAllStoresResponse = {
    data: AdminStoreDto[];
    meta: PaginationMetaDto;
};

// Find all stores query parameters
export type FindAllStoresParams = {
    status?: StoreState;
    type?: StoreType;
    reviewStatus?: ReviewStatus;
    page?: number;
    limit?: number;
    search?: string; // store name, store id, booth number
    sort?: 'id' | 'name'; // sort by id or name
};

// Update store status DTO
export type UpdateStoreStatusDto = {
    targetState: StoreState;
};

// Update store status response
export type UpdateStoreStatusResponse = AdminStoreDto;

// Validate all stores response
export type ValidateAllStoresResponse = {
    message: string;
    totalStores: number;
    validatedStores: number;
    createdDrafts: number;
};

// Validate single store response
export type ValidateSingleStoreResponse = {
    message: string;
    store: AdminStoreDto;
    reviewDraft: ReviewDraftDto;
};
