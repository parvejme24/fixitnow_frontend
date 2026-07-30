"use client"

import { useSyncExternalStore } from "react"

import {
  ADMIN_CATEGORIES_SEED,
  ADMIN_USERS_SEED,
  type AdminCategory,
  type AdminUser,
} from "@/app/lib/admin-data"

function createStore<T>(seed: T) {
  let state = structuredClone(seed)
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set: (next: T | ((prev: T) => T)) => {
      state = typeof next === "function" ? (next as (p: T) => T)(state) : next
      listeners.forEach((l) => l())
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

const usersStore = createStore<AdminUser[]>(ADMIN_USERS_SEED)
const categoriesStore = createStore<AdminCategory[]>(ADMIN_CATEGORIES_SEED)

export function useAdminUsers() {
  const users = useSyncExternalStore(
    usersStore.subscribe,
    usersStore.get,
    usersStore.get
  )
  return {
    users,
    setUsers: (next: AdminUser[] | ((prev: AdminUser[]) => AdminUser[])) =>
      usersStore.set(next),
  }
}

export function useAdminCategories() {
  const categories = useSyncExternalStore(
    categoriesStore.subscribe,
    categoriesStore.get,
    categoriesStore.get
  )
  return {
    categories,
    setCategories: (
      next: AdminCategory[] | ((prev: AdminCategory[]) => AdminCategory[])
    ) => categoriesStore.set(next),
  }
}
