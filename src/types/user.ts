export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  avatar?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

export type UserRole = 'admin' | 'user' | 'approval_manager'

export interface CreateUserData {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  password: string
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  role?: UserRole
  isActive?: boolean
}

export interface UserProfileData {
  firstName: string
  lastName: string
  avatar?: string
}

export interface UserFilters {
  role?: UserRole
  isActive?: boolean
  search?: string
} 