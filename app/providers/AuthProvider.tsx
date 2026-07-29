"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { ApiError } from "@/lib/api"
import {
  changePasswordRequest,
  forgotPasswordRequest,
  getMeRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  resetPasswordRequest,
  updateMeRequest,
} from "@/lib/auth/auth-api"
import { authKeys } from "@/lib/auth/query-keys"
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "@/lib/auth/storage"
import type {
  AuthUser,
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateMeInput,
} from "@/lib/auth/types"

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isFetchingUser: boolean
  login: (input: LoginInput, persist?: boolean) => Promise<AuthUser>
  register: (input: RegisterInput, persist?: boolean) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshUser: () => Promise<AuthUser | null>
  updateProfile: (input: UpdateMeInput) => Promise<AuthUser>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (input: ResetPasswordInput) => Promise<void>
  changePassword: (input: ChangePasswordInput) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => getStoredToken())

  const meQuery = useQuery({
    queryKey: authKeys.me(),
    queryFn: () => getMeRequest(token),
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
  })

  const applySession = useCallback(
    (nextToken: string, user: AuthUser, persist: boolean) => {
      setStoredToken(nextToken, persist)
      setToken(nextToken)
      queryClient.setQueryData(authKeys.me(), user)
    },
    [queryClient]
  )

  const clearSession = useCallback(() => {
    clearStoredToken()
    setToken(null)
    queryClient.removeQueries({ queryKey: authKeys.all })
  }, [queryClient])

  useEffect(() => {
    if (!token || !meQuery.isError) return
    const err = meQuery.error
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      clearSession()
    }
  }, [token, meQuery.isError, meQuery.error, clearSession])

  const loginMutation = useMutation({
    mutationFn: async ({
      input,
      persist,
    }: {
      input: LoginInput
      persist: boolean
    }) => {
      const payload = await loginRequest(input)
      applySession(payload.token, payload.user, persist)
      return payload.user
    },
  })

  const registerMutation = useMutation({
    mutationFn: async ({
      input,
      persist,
    }: {
      input: RegisterInput
      persist: boolean
    }) => {
      const payload = await registerRequest(input)
      applySession(payload.token, payload.user, persist)
      return payload.user
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logoutRequest(token)
    },
    onSettled: () => {
      clearSession()
    },
  })

  const updateMeMutation = useMutation({
    mutationFn: (input: UpdateMeInput) => updateMeRequest(input, token),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me(), user)
    },
  })

  const forgotMutation = useMutation({
    mutationFn: (email: string) => forgotPasswordRequest(email),
  })

  const resetMutation = useMutation({
    mutationFn: (input: ResetPasswordInput) => resetPasswordRequest(input),
  })

  const changePasswordMutation = useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      changePasswordRequest(input, token),
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      token,
      isAuthenticated: Boolean(token && meQuery.data),
      isLoading: Boolean(token) && (meQuery.isLoading || meQuery.isPending),
      isFetchingUser: meQuery.isFetching,
      login: (input, persist = true) =>
        loginMutation.mutateAsync({ input, persist }),
      register: (input, persist = true) =>
        registerMutation.mutateAsync({ input, persist }),
      logout: () => logoutMutation.mutateAsync().then(() => undefined),
      refreshUser: async () => {
        if (!token) return null
        return queryClient.fetchQuery({
          queryKey: authKeys.me(),
          queryFn: () => getMeRequest(token),
        })
      },
      updateProfile: (input) => updateMeMutation.mutateAsync(input),
      forgotPassword: async (email) => {
        await forgotMutation.mutateAsync(email)
      },
      resetPassword: async (input) => {
        await resetMutation.mutateAsync(input)
      },
      changePassword: async (input) => {
        await changePasswordMutation.mutateAsync(input)
      },
    }),
    [
      meQuery.data,
      meQuery.isLoading,
      meQuery.isPending,
      meQuery.isFetching,
      token,
      loginMutation,
      registerMutation,
      logoutMutation,
      updateMeMutation,
      forgotMutation,
      resetMutation,
      changePasswordMutation,
      queryClient,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
