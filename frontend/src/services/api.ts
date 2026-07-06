import { LoginRequest, RegisterUserPayload } from "../types"
import { apiClient } from "./apiClient"

export const loginUser = async (data: LoginRequest) => {
  const response = await apiClient.post("/auth/login", data)
  return response.data
}

export const registerUser = async (data: RegisterUserPayload) => {
  const response = await apiClient.post("/auth/register", data)
  return response.data
}
