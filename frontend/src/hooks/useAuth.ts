import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"
import { STORAGE_KEY } from "../context/AuthContext"
import { loginUser, registerUser } from "../services/api"
import { RegisterUserPayload } from "../types"

export const useLogin = () => {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: loginUser,

    onSuccess: (data: { access_token: string }) => {
      toast.success("Welcome")
      localStorage.setItem(STORAGE_KEY, data.access_token)
      navigate("/app")
    },

    onError: (err: any) => {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong"

      console.log("Login error:", err)
      toast.error(message)
    },
  })
}

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
