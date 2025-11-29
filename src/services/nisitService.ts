import { http } from "@/lib/http"
import { NisitInfo } from "./dto/nisit-info.dto";
import { UpdateNisitInfoPayload } from "./dto/nisit-info.dto";
import { extractErrorMessage } from "./utils/extractErrorMsg";

const NISIT_SERVICE_API = `/api/nisit`;

export async function createNisitInfo(payload: NisitInfo) {
  try {
    const res = await http.post(`${NISIT_SERVICE_API}/register`, payload)

    if (res.status === 201 || res.status === 200) return res.data

  } catch (error) {
    const message = extractErrorMessage(error)
    throw new Error(message)
  }
}

export async function updateNisitInfo(payload: UpdateNisitInfoPayload) {
  try {
    const res = await http.patch(`${NISIT_SERVICE_API}/info`, payload)

    if (res.status === 201 || res.status === 200) return res.data

  } catch (error) {
    const message = extractErrorMessage(error)
    throw new Error(message)
  }

}

export async function getNisitInfo() {
  try {
    const res = await http.get(`${NISIT_SERVICE_API}/info`)

    if (res.status === 201 || res.status === 200) return res.data

  } catch (error) {
    const message = extractErrorMessage(error)
    throw new Error(message)
  }
}
