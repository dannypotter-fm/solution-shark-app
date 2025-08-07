"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ApprovalWorkflow, ApprovalWorkflowFilters } from "@/types/approval"
import { useWorkflows } from "@/contexts/workflows-context"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  Archive,
  Trash2,
  Copy,
  Eye,
  Settings,
  Users,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ApprovalWorkflowsPage() {
  const router = useRouter()
  const { workflows } = useWorkflows()
  
  // Mock current user - in a real app, this would come from auth context
  const currentUser = {
    id: "1",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "admin" as const,
    avatar: "/avatars/01.png",
    isActive: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    lastLoginAt: new Date("2024-01-20")
  }
  
  // Check if user has permission to manage approval workflows
  const canManageWorkflows = currentUser.role === "admin" || currentUser.role === "approval_manager"
  
  const [filters, setFilters] = useState<ApprovalWorkflowFilters>({
    search: "",
    isActive: undefined,
    isArchived: undefined,
    createdBy: undefined
  })
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'archived'>('all')

  const handleFilterChange = (key: keyof ApprovalWorkflowFilters, value: string | boolean | undefined) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const handleTabChange = (tab: 'all' | 'active' | 'archived') => {
    setActiveTab(tab)
  }

  const getStatusBadgeVariant = (isActive: boolean, isArchived: boolean) => {
    if (isArchived) return "secondary"
    return isActive ? "default" : "outline"
  }

  const getStatusIcon = (isActive: boolean, isArchived: boolean) => {
    if (isArchived) return <Archive className="h-3 w-3 text-gray-400" />
    return isActive ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3 text-yellow-500" />
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = !filters.search || workflow.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                        workflow.description.toLowerCase().includes(filters.search.toLowerCase())
    const matchesActive = filters.isActive === undefined ? true : workflow.isActive === filters.isActive
    const matchesArchived = filters.isArchived === undefined ? true : workflow.isArchived === filters.isArchived
    const matchesRequired = filters.isRequired === undefined ? true : workflow.isRequired === filters.isRequired
    const matchesCreator = filters.createdBy === undefined ? true : workflow.createdBy === filters.createdBy

    let matchesTab = true
    if (activeTab === 'active') matchesTab = workflow.isActive && !workflow.isArchived
    if (activeTab === 'archived') matchesTab = workflow.isArchived

    return matchesSearch && matchesActive && matchesArchived && matchesRequired && matchesCreator && matchesTab
  })

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-[68px] shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Approval Workflows</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Approval Workflows</h1>
              <p className="text-muted-foreground">
                Define and manage approval processes for solution documents
              </p>
            </div>
            <Button onClick={() => router.push('/dashboard/approval-workflows/create')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </div>

          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workflows..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filters.isActive?.toString()} onValueChange={(value) => handleFilterChange("isActive", value === "true")}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.isRequired?.toString()} onValueChange={(value) => handleFilterChange("isRequired", value === "true")}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All requirements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Required</SelectItem>
                  <SelectItem value="false">Optional</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.createdBy} onValueChange={(value) => handleFilterChange("createdBy", value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All creators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="John Doe">John Doe</SelectItem>
                  <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                  <SelectItem value="Bob Wilson">Bob Wilson</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as 'all' | 'active' | 'archived')}>
              <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                <TabsTrigger value="all" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
                  All Workflows
                </TabsTrigger>
                <TabsTrigger value="active" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Active
                </TabsTrigger>
                <TabsTrigger value="archived" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
                  <Archive className="h-4 w-4 mr-2" />
                  Archived
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Workflows Table */}
            <Card>
              <CardHeader>
                <CardTitle>Approval Workflows</CardTitle>
                <CardDescription>
                  Manage approval processes and workflows
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workflow</TableHead>
                      <TableHead>Steps</TableHead>
                      <TableHead>Rules</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkflows.map((workflow) => (
                      <TableRow key={workflow.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{workflow.name}</div>
                            <div className="text-sm text-muted-foreground">{workflow.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {workflow.steps.length} steps
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {workflow.rules.length} approval
                            </Badge>
                            {workflow.conditionRules && workflow.conditionRules.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {workflow.conditionRules.length} conditions
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {workflow.isRequired ? (
                              <Shield className="h-4 w-4 text-green-600" />
                            ) : (
                              <Shield className="h-4 w-4 text-gray-400" />
                            )}
                            <Badge variant={workflow.isRequired ? "default" : "secondary"}>
                              {workflow.isRequired ? "Required" : "Optional"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(workflow.isActive, workflow.isArchived)}
                            <Badge variant={getStatusBadgeVariant(workflow.isActive, workflow.isArchived)}>
                              {workflow.isArchived ? 'Archived' : workflow.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {workflow.createdBy.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{workflow.createdBy}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(workflow.updatedDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                                                             <DropdownMenuItem onClick={() => router.push(`/dashboard/approval-workflows/${workflow.id}/edit`)}>
                                 <Edit className="mr-2 h-4 w-4" />
                                 Edit Workflow
                               </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                Configure
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="mr-2 h-4 w-4" />
                                Manage Users
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Bell className="mr-2 h-4 w-4" />
                                Notifications
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {workflow.isActive ? (
                                <DropdownMenuItem className="text-yellow-600">
                                  <Clock className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-green-600">
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-orange-600">
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 