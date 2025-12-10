export type NisitTrainingParticipant = {
    nisitId: string;
    firstName: string | null;
    lastName: string | null;
}

export type UpsertNisitTrainingParticipantDto = {
    nisitId: string;
}

export type FindAllParticipantsParams = {
    page?: number;
    limit?: number;
    nisitId?: string;
}

export type FindAllParticipantsResponse = {
    data: NisitTrainingParticipant[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
