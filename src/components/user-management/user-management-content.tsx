"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { UserTable } from "@/components/user-management/user-table"
import { UserForm } from "@/components/user-management/user-form"
import { User, CreateUserData, UpdateUserData, UserFilters } from "@/types/user"
import { Plus } from "lucide-react"

// Mock data for demonstration
const mockUsers: User[] = [
  {
    id: "1",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "admin",
    avatar: "/avatars/01.png",
    isActive: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    lastLoginAt: new Date("2024-01-20")
  },
  {
    id: "2",
    email: "jane.smith@example.com",
    firstName: "Jane",
    lastName: "Smith",
    role: "approval_manager",
    avatar: "/avatars/02.png",
    isActive: true,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
    lastLoginAt: new Date("2024-01-19")
  },
  {
    id: "3",
    email: "bob.wilson@example.com",
    firstName: "Bob",
    lastName: "Wilson",
    role: "user",
    isActive: true,
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
    lastLoginAt: new Date("2024-01-18")
  },
  {
    id: "4",
    email: "alice.johnson@example.com",
    firstName: "Alice",
    lastName: "Johnson",
    role: "user",
    isActive: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
    lastLoginAt: new Date("2024-01-10")
  }
]

export function UserManagementContent() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'archived'>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize with mock data on client side to avoid hydration issues
  useEffect(() => {
    setUsers(mockUsers)
    setFilteredUsers(mockUsers)
    setIsInitialized(true)
  }, [])

  const handleCreateUser = async (data: CreateUserData) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newUser: User = {
      id: Date.now().toString(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setUsers(prev => [newUser, ...prev])
    setFilteredUsers(prev => [newUser, ...prev])
    setIsFormOpen(false)
    setIsLoading(false)
  }

  const handleUpdateUser = async (data: UpdateUserData) => {
    if (!editingUser) return
    
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const updatedUsers = users.map(user => 
      user.id === editingUser.id 
        ? { ...user, ...data, updatedAt: new Date() }
        : user
    )
    
    setUsers(updatedUsers)
    setFilteredUsers(updatedUsers)
    setEditingUser(undefined)
    setIsFormOpen(false)
    setIsLoading(false)
  }

  const handleArchiveUser = async (userId: string) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const updatedUsers = users.map(user => 
      user.id === userId 
        ? { ...user, isActive: false, updatedAt: new Date() }
        : user
    )
    
    setUsers(updatedUsers)
    setFilteredUsers(updatedUsers)
    setIsLoading(false)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsFormOpen(true)
  }

  const handleFilterChange = (filters: UserFilters) => {
    let filtered = users

    // Apply tab filter first
    if (activeTab === 'active') {
      filtered = filtered.filter(user => user.isActive === true)
    } else if (activeTab === 'archived') {
      filtered = filtered.filter(user => user.isActive === false)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      )
    }

    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role)
    }

    if (filters.isActive !== undefined) {
      filtered = filtered.filter(user => user.isActive === filters.isActive)
    }

    setFilteredUsers(filtered)
  }

  const handleTabChange = (tab: 'all' | 'active' | 'archived') => {
    setActiveTab(tab)
    // Re-apply current filters with new tab
    handleFilterChange({ role: undefined, isActive: undefined, search: "" })
  }

  const handleFormSubmit = (data: CreateUserData | UpdateUserData) => {
    if (editingUser) {
      handleUpdateUser(data as UpdateUserData)
    } else {
      handleCreateUser(data as CreateUserData)
    }
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions for your organization.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="space-y-4">
        <UserTable
          users={filteredUsers}
          onEditUser={handleEditUser}
          onArchiveUser={handleArchiveUser}
          onFilterChange={handleFilterChange}
          isLoading={isLoading}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      <UserForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        user={editingUser}
        isLoading={isLoading}
      />
    </>
  )
} 