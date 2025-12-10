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

// Review draft information (if needed)
export type ReviewDraftDto = {
    id: number;
    // Add other fields as needed
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
    page?: number;
    limit?: number;
};

// Update store status DTO
export type UpdateStoreStatusDto = {
    targetState: StoreState;
};

// Update store status response
export type UpdateStoreStatusResponse = AdminStoreDto;
