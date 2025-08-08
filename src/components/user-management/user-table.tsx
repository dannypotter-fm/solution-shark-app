"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, UserRole, UserFilters } from "@/types/user"
import { Edit, Archive, Search, Users, Check, Clock, Shield, Crown, Users as UsersIcon, Archive as ArchiveIcon } from "lucide-react"

interface UserTableProps {
  users: User[]
  onEditUser: (user: User) => void
  onArchiveUser: (userId: string) => void
  onFilterChange: (filters: UserFilters) => void
  isLoading?: boolean
  activeTab: 'all' | 'active' | 'archived'
  onTabChange: (tab: 'all' | 'active' | 'archived') => void
}

export function UserTable({ users, onEditUser, onArchiveUser, onFilterChange, isLoading = false, activeTab, onTabChange }: UserTableProps) {
  const [filters, setFilters] = useState<UserFilters>({
    role: undefined,
    isActive: undefined,
    search: ""
  })

  const handleFilterChange = (key: keyof UserFilters, value: string | boolean | undefined) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }



  const getRoleBadgeStyle = (role: UserRole) => {
    return "bg-white border border-gray-200 text-gray-700"
  }

  const getStatusBadgeStyle = (isActive: boolean) => {
    return "bg-white border border-gray-200 text-gray-700"
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <Crown className="h-3 w-3 text-gray-500" />
      case "approval_manager":
        return <Shield className="h-3 w-3 text-gray-500" />
      case "user":
        return <UsersIcon className="h-3 w-3 text-gray-500" />
      default:
        return <UsersIcon className="h-3 w-3 text-gray-500" />
    }
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <Check className="h-3 w-3 text-green-500" />
    ) : (
      <Clock className="h-3 w-3 text-gray-400" />
    )
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filters.role} onValueChange={(value: UserRole) => handleFilterChange("role", value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="approval_manager">Approval Manager</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.isActive?.toString()} onValueChange={(value) => handleFilterChange("isActive", value === "true")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'all' | 'active' | 'archived')}>
        <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="all" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
            <UsersIcon className="h-4 w-4 mr-2" />
            All Users
          </TabsTrigger>
          <TabsTrigger value="active" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
            <Check className="h-4 w-4 mr-2" />
            Active
          </TabsTrigger>
          <TabsTrigger value="archived" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
            <ArchiveIcon className="h-4 w-4 mr-2" />
            Archived
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                        <AvatarFallback>
                          {user.firstName?.charAt(0) || ''}{user.lastName?.charAt(0) || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeStyle(user.role)}`}>
                      {getRoleIcon(user.role)}
                      {user.role === "approval_manager" ? "Approval Manager" : user.role?.charAt(0)?.toUpperCase() + user.role?.slice(1) || user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeStyle(user.isActive)}`}>
                      {getStatusIcon(user.isActive)}
                      {user.isActive ? "Active" : "Archived"}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditUser(user)}
                        disabled={!user.isActive}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onArchiveUser(user.id)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 