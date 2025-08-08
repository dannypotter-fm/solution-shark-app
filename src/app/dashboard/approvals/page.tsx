"use client"

import { useState, useEffect, useMemo } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  User,
  Calendar,
  Filter
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApprovals } from "@/contexts/approvals-context"
import { ApprovalActionModal } from "@/components/approvals/approval-action-modal"

// Mock current user
const currentUser = {
  id: "user3",
  role: "approval_manager" // Change to "admin" to see all approvals
}

function ApprovalsContent() {
  const { approvals } = useApprovals()
  const [filteredApprovals, setFilteredApprovals] = useState<typeof approvals>([])
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("pending")
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<typeof approvals[0] | null>(null)
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null)

  // Filter approvals based on user role - use useMemo to prevent recreating on every render
  const userApprovals = useMemo(() => {
    return currentUser.role === "admin" 
      ? approvals 
      : approvals.filter(approval => approval.isAssignedToCurrentUser)
  }, [approvals, currentUser.role])

  useEffect(() => {
    let filtered = userApprovals

    // Filter by status based on active tab
    if (activeTab === "pending") {
      filtered = filtered.filter(approval => approval.status === 'pending')
    } else if (activeTab === "approved") {
      filtered = filtered.filter(approval => approval.status === 'approved')
    } else if (activeTab === "rejected") {
      filtered = filtered.filter(approval => approval.status === 'rejected')
    }

    // Filter by priority
    if (filterPriority !== "all") {
      filtered = filtered.filter(approval => approval.priority === filterPriority)
    }
    setFilteredApprovals(filtered)
  }, [userApprovals, activeTab, filterPriority])

  const handleApprovalAction = (approval: typeof approvals[0], action: 'approve' | 'reject') => {
    setSelectedApproval(approval)
    setModalAction(action)
    setModalOpen(true)
  }

  const handleConfirmAction = async (action: 'approved' | 'rejected', notes: string) => {
    if (selectedApproval) {
      // TODO: Implement approval processing when backend is ready
      console.log('Processing approval:', selectedApproval.id, action, notes)
      setModalOpen(false)
      setSelectedApproval(null)
      setModalAction(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "destructive",
      medium: "default",
      low: "secondary"
    } as const

    return (
      <Badge variant={variants[priority as keyof typeof variants] || "secondary"}>
        {priority?.charAt(0)?.toUpperCase() + priority?.slice(1) || priority}
      </Badge>
    )
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      "USD": "$",
      "GBP": "£",
      "EUR": "€"
    }
    return `${symbols[currency] || "$"}${amount.toLocaleString()}`
  }

  const pendingCount = userApprovals.filter(a => a.status === 'pending').length
  const approvedCount = userApprovals.filter(a => a.status === 'approved').length
  const rejectedCount = userApprovals.filter(a => a.status === 'rejected').length

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
        <header className="flex h-[68px] shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Approvals</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
              <p className="text-muted-foreground">
                {currentUser.role === "admin" 
                  ? "Manage all approval requests across the organization" 
                  : "View and action approval requests assigned to you"
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Approved ({approvedCount})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Rejected ({rejectedCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(activeTab)}
                    {activeTab?.charAt(0)?.toUpperCase() + activeTab?.slice(1) || activeTab} Approvals
                  </CardTitle>
                  <CardDescription>
                    {filteredApprovals.length} approval{filteredApprovals.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredApprovals.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No approvals found</h3>
                      <p className="text-muted-foreground">
                        {activeTab === "pending" 
                          ? "You have no pending approvals to review."
                          : `No ${activeTab} approvals found with the current filters.`
                        }
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Solution</TableHead>
                          <TableHead>Workflow</TableHead>
                          <TableHead>Step</TableHead>
                          <TableHead>Requester</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Status</TableHead>
                          {activeTab === "pending" && (
                            <TableHead className="text-right">Actions</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApprovals.map((approval) => (
                          <TableRow key={approval.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{approval.solutionName}</div>
                                <div className="text-sm text-muted-foreground">ID: {approval.solutionId}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{approval.workflowName}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{approval.currentStep}</div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span className="font-medium">{approval.requesterName}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">{approval.requesterEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getPriorityBadge(approval.priority)}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {formatCurrency(approval.estimatedValue, approval.currency)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">
                                  {approval.submittedAt.toLocaleDateString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(approval.status)}
                                <span className="capitalize">{approval.status}</span>
                              </div>
                            </TableCell>
                            {activeTab === "pending" && (
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApprovalAction(approval, 'approve')}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApprovalAction(approval, 'reject')}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        </SidebarInset>
      </SidebarProvider>

      <ApprovalActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmAction}
        action={modalAction}
        approval={selectedApproval ? {
          id: selectedApproval.id,
          solutionName: selectedApproval.solutionName,
          workflowName: selectedApproval.workflowName,
          currentStep: selectedApproval.currentStep,
          requesterName: selectedApproval.requesterName
        } : null}
      />
    </>
  )
}

export default function ApprovalsPage() {
  return <ApprovalsContent />
}