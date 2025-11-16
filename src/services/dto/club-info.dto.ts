import { StoreType, StoreState } from "./store-info.dto"

export type ClubApplicationDto = {
  organizationName: string
  presidentFirstName: string
  presidentLastName: string
  presidentNisitId: string
  applicationFileName?: string | null
}

export type ClubInfoResponseDto = {
  id: string
  clubName: string;
  clubApplicationMediaId: string | null;
  storeId: number;
  leaderNisitId: string | null;
  leaderFirstName: string | null;
  leaderLastName: string | null;
  leaderEmail: string | null;
  leaderPhone: string | null;
}

export type CreateClubInfoRequestDto = {
  clubName: string;
  clubApplicationMediaId?: string;
  leaderNisitId?: string;
  leaderFirstName?: string;
  leaderLastName?: string;
  leaderEmail?: string;
  leaderPhone?: string;
}

export type UpdateClubInfoRequestDto = {
  clubName?: string
  clubApplicationMediaId?: string | null
  leaderNisitId?: string
  leaderFirstName?: string
  leaderLastName?: string
  leaderEmail?: string
  leaderPhone?: string
  applicationFileName?: string | null
}

// export type UpdateClubInfoResponseDto = {
//   storeId: string
//   storeName: string
//   type: StoreType
//   state: StoreState
//   clubInfo: UpdateClubInfoRequestDto
// }
