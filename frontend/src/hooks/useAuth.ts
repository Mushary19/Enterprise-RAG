import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { registerUser } from "../services/api"
import { RegisterUserPayload } from "../types"

export const useRegisterUser = () => {
  return useMutation({
    mutationFn: (data: RegisterUserPayload) => registerUser(data),
    onSuccess: () => {
      alert("User registered successfully")
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong"

      console.log("Register error:", err)
      toast.error(message)
    },
  })
}
