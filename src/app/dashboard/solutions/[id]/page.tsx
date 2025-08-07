"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Edit, FileText, Users, CheckCircle, Clock, AlertCircle, ChevronRight, Save, X, Plus, ChevronLeft, Shield } from "lucide-react"
import { Solution } from "@/types/solution"
import { ApprovalSelectionModal } from "@/components/solutions/approval-selection-modal"
import { ApprovalWorkflow } from "@/types/approval"
import { useApprovals } from "@/contexts/approvals-context"

// Mock data
const mockUsers = [
  { id: "1", name: "John Doe", email: "john.doe@example.com", role: "admin" },
  { id: "2", name: "Jane Smith", email: "jane.smith@example.com", role: "user" },
  { id: "3", name: "Mike Johnson", email: "mike.johnson@example.com", role: "approver" },
  { id: "4", name: "Sarah Wilson", email: "sarah.wilson@example.com", role: "user" },
  { id: "5", name: "David Brown", email: "david.brown@example.com", role: "admin" }
]

const mockSolutions: Solution[] = [
  {
    id: "1",
    name: "Enterprise Cloud Migration",
    opportunity: "Cloud Infrastructure Upgrade",
    customer: "TechCorp Inc.",
    stage: "draft",
    owner: "1",
    estimatedValue: 250000,
    amount: 250000,
    currency: "USD",
    status: "active",
    description: "Comprehensive cloud migration strategy for enterprise infrastructure.",
    resourceBreakdown: "https://docs.google.com/spreadsheets/d/example1",
    scopeOfWorksUrl: "https://docs.google.com/document/d/example1",
    additionalInformation: "This project involves migrating legacy on-premise systems to AWS cloud infrastructure. Key considerations include data security, compliance requirements, and minimal downtime during migration.",
    createdAt: new Date("2024-01-15"),
    createdBy: "john.doe@example.com",
    updatedAt: new Date("2024-01-20"),
    lastModifiedBy: "sarah.wilson@example.com"
  },
  {
    id: "2",
    name: "Digital Transformation Platform",
    opportunity: "Digital Innovation Initiative",
    customer: "Global Retail Ltd.",
    stage: "review",
    owner: "2",
    estimatedValue: 500000,
    amount: 500000,
    currency: "GBP",
    status: "active",
    description: "End-to-end digital transformation solution for retail operations.",
    resourceBreakdown: "https://docs.google.com/spreadsheets/d/example2",
    scopeOfWorksUrl: "https://docs.google.com/document/d/example2",
    additionalInformation: "Comprehensive digital transformation for retail operations including e-commerce platform, inventory management, and customer analytics. Focus on scalability and user experience.",
    createdAt: new Date("2024-01-10"),
    createdBy: "jane.smith@example.com",
    updatedAt: new Date("2024-01-18"),
    lastModifiedBy: "mike.johnson@example.com"
  },
  {
    id: "3",
    name: "Cybersecurity Framework",
    opportunity: "Security Enhancement",
    customer: "SecureBank",
    stage: "approved",
    owner: "3",
    estimatedValue: 150000,
    amount: 150000,
    currency: "EUR",
    status: "active",
    description: "Comprehensive cybersecurity framework implementation.",
    resourceBreakdown: "https://docs.google.com/spreadsheets/d/example3",
    scopeOfWorksUrl: "https://docs.google.com/document/d/example3",
    additionalInformation: "Implementation of comprehensive cybersecurity framework including threat detection, incident response, and compliance monitoring. Emphasis on zero-trust architecture and continuous monitoring.",
    createdAt: new Date("2024-01-05"),
    createdBy: "mike.johnson@example.com",
    updatedAt: new Date("2024-01-15"),
    lastModifiedBy: "david.brown@example.com"
  }
]

const stages = [
  { key: "draft", label: "Draft", icon: FileText },
  { key: "review", label: "Review", icon: Clock },
  { key: "approved", label: "Approved", icon: CheckCircle },
  { key: "rejected", label: "Rejected", icon: AlertCircle }
]

function SolutionPage() {
  const params = useParams()
  const router = useRouter()
  const { solutions, getSolutionApprovalHistory, addApprovalHistory, updateSolutionStage, updateSolution } = useApprovals()
  const [solution, setSolution] = useState<Solution | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>(["Product"])
  const [isProjectTypeSelectorOpen, setIsProjectTypeSelectorOpen] = useState(false)

  // Get approval history from context
  const approvalHistory = solution ? getSolutionApprovalHistory(solution.id) : []


  useEffect(() => {
    // Find solution from global context instead of local mock data
    const foundSolution = solutions.find(s => s.id === params.id)
    if (foundSolution) {
      setSolution(foundSolution)
    }
    setIsInitialized(true)
  }, [params.id, solutions])

  // Separate effect to sync solution stage with context
  useEffect(() => {
    const contextSolution = solutions.find(s => s.id === params.id)
    if (contextSolution && solution) {
      // Only update if the stage actually changed to avoid infinite loops
      if (solution.stage !== contextSolution.stage) {
        setSolution(prev => prev ? { ...prev, stage: contextSolution.stage } : null)
      }
    }
  }, [solutions, params.id])

  const handleEditField = (field: string, currentValue: string) => {
    if (!isEditing) return
    setEditingField(field)
    setEditValue(currentValue)
  }

  const handleSaveField = () => {
    if (solution && editingField) {
      const updatedSolution = { ...solution, [editingField]: editValue }
      setSolution(updatedSolution)
      
      // Persist changes to the context
      updateSolution(solution.id, { [editingField]: editValue })
      
      setEditingField(null)
      setEditValue("")
    }
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setEditValue("")
  }

  const handleAddProjectType = (projectType: string) => {
    if (!selectedProjectTypes.includes(projectType)) {
      const newProjectTypes = [...selectedProjectTypes, projectType]
      setSelectedProjectTypes(newProjectTypes)
      
      // Persist changes to the context
      if (solution) {
        updateSolution(solution.id, { projectType: newProjectTypes.join(', ') })
      }
    }
  }

  const handleRemoveProjectType = (projectType: string) => {
    const newProjectTypes = selectedProjectTypes.filter(type => type !== projectType)
    setSelectedProjectTypes(newProjectTypes)
    
    // Persist changes to the context
    if (solution) {
      updateSolution(solution.id, { projectType: newProjectTypes.join(', ') })
    }
  }

  const handleApprovalSubmit = (selectedWorkflows: ApprovalWorkflow[]) => {
    if (!solution) return
    
    console.log('Submitting approvals for solution:', solution.id)
    console.log('Selected workflows:', selectedWorkflows)
    
    // Add new approval entries to history through context
    selectedWorkflows.forEach(workflow => {
      const historyEntry = {
        id: `approval_${Date.now()}_${workflow.id}`,
        workflowId: workflow.id,
        workflowName: workflow.name,
        status: 'pending' as const,
        submittedAt: new Date(),
        submittedBy: 'Current User', // In real app, get from auth context
        currentStep: workflow.steps?.[0]?.name || 'Initial Review',
        stepOrder: 1
      }
      console.log('Creating approval history entry:', historyEntry)
      addApprovalHistory(solution.id, historyEntry)
    })
    
    // Update solution stage to 'review' when submitting for approval
    updateSolutionStage(solution.id, 'review', solution.stage)
    
    console.log('Approval submission complete')
  }



  // Mock current user - in real app, this would come from auth context
  const currentUser = {
    id: "1",
    email: "john.doe@example.com",
    role: "admin" // This would come from auth context
  }

  // Check if user can edit the solution
  const canEditSolution = () => {
    if (!solution) return false
    
    // Admins can always edit
    if (currentUser.role === 'admin') return true
    
    // If solution is approved, only admins can edit
    if (solution.stage === 'approved') return false
    
    // For other stages, check if user is the owner or has appropriate permissions
    return solution.owner === currentUser.id || currentUser.role === 'approval_manager'
  }

  // Note: Approval updates are now handled through the ApprovalsContext
  // via the processApproval function in the ApprovalActionModal



  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!solution) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Solution not found</h1>
          <p className="text-muted-foreground">The solution you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push("/dashboard/solutions")} className="mt-4">
            Back to Solutions
          </Button>
        </div>
      </div>
    )
  }

  const currentStageIndex = stages.findIndex(s => s.key === solution.stage)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/dashboard/solutions")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{solution.name}</h1>
                                  <div className="flex items-center gap-2">
                    <p className="text-muted-foreground">{solution.customer}</p>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="outline">{(() => {
                      const currencySymbols: { [key: string]: string } = {
                        "USD": "$",
                        "GBP": "£",
                        "EUR": "€"
                      }
                      const symbol = currencySymbols[solution.currency || "USD"] || "$"
                      return `${symbol}${solution.amount?.toLocaleString() || "0"}`
                    })()}</Badge>
                  </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                {/* Progress Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Progress</CardTitle>
                    <CardDescription>Current stage and progress through the approval process</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-center w-full">
                        <div className="flex items-center gap-3 w-full justify-center">
                          {stages.map((stage, index) => {
                            const isCompleted = index <= currentStageIndex
                            const isCurrent = stage.key === solution.stage
                            
                            return (
                              <div key={stage.key} className="flex items-center">
                                <div className={`flex items-center px-16 py-4 rounded-lg border flex-1 ${
                                  isCompleted 
                                    ? 'bg-primary text-primary-foreground border-primary' 
                                    : isCurrent 
                                      ? 'bg-primary/10 border-primary text-primary' 
                                      : 'bg-gray-50 border-gray-200 text-gray-400'
                                }`}>
                                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mr-3 ${
                                    isCompleted 
                                      ? 'bg-white text-primary' 
                                      : isCurrent 
                                        ? 'bg-primary text-white' 
                                        : 'bg-gray-200 text-gray-500'
                                  }`}>
                                    {isCompleted ? (
                                      <CheckCircle className="h-3 w-3" />
                                    ) : (
                                      String(index + 1).padStart(2, '0')
                                    )}
                                  </div>
                                  <span className="text-sm font-medium">
                                    {stage.label}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                          {/* Solution Details Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Solution Details</CardTitle>
                <CardDescription>Created on {solution.createdAt.toLocaleDateString()}</CardDescription>
              </div>
              <Button 
                variant={isEditing ? "default" : "outline"} 
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </>
                )}
              </Button>
            </CardHeader>
                  <CardContent>
                    {/* Salesforce API Fields - Read Only */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Salesforce Data</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm font-medium text-gray-600">Customer</span>
                          <span className="text-sm text-gray-900">{solution.customer}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm font-medium text-gray-600">Opportunity</span>
                          <span className="text-sm text-gray-900">{solution.opportunity}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm font-medium text-gray-600">Amount</span>
                          <span className="text-sm text-gray-900">{(() => {
                            const currencySymbols: { [key: string]: string } = {
                              "USD": "$",
                              "GBP": "£",
                              "EUR": "€"
                            }
                            const symbol = currencySymbols[solution.currency || "USD"] || "$"
                            return `${symbol}${solution.amount?.toLocaleString() || "0.00"}`
                          })()}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm font-medium text-gray-600">Currency</span>
                          <span className="text-sm text-gray-900">{solution.currency || "USD"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">SOW ID</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">SOW-{solution.id.padStart(4, '0')}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">SoW Name</span>
                            <span className="text-gray-400">ⓘ</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingField === 'name' ? (
                              <>
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-6 text-sm w-32"
                                  autoFocus
                                />
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleSaveField}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCancelEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="text-sm text-gray-400">{solution?.name || "-"}</span>
                                {isEditing && canEditSolution() && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleEditField('name', solution?.name || "")}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Project Type</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingField === 'projectType' ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {selectedProjectTypes.map((type) => (
                                      <div key={type} className="flex items-center gap-1">
                                        <span className="text-sm">{type}</span>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-4 w-4 p-0"
                                          onClick={() => handleRemoveProjectType(type)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={() => setIsProjectTypeSelectorOpen(true)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleSaveField}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCancelEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="text-sm">{selectedProjectTypes.join(", ")}</span>
                                {isEditing && canEditSolution() && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleEditField('projectType', 'Product')}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Column */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Owner</span>
                            <span className="text-gray-400">↗</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingField === 'owner' ? (
                              <>
                                <Select value={editValue} onValueChange={setEditValue}>
                                  <SelectTrigger className="h-6 text-sm w-48">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {mockUsers.map((user) => (
                                      <SelectItem key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleSaveField}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCancelEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="text-sm">
                                  {(() => {
                                    const owner = mockUsers.find(u => u.id === solution.owner) || mockUsers[0]
                                    return `${owner.name} (${owner.email})`
                                  })()}
                                </span>
                                {isEditing && canEditSolution() && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleEditField('owner', solution.owner || mockUsers[0].id)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Stage</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingField === 'stage' ? (
                              <>
                                <Select value={editValue} onValueChange={setEditValue}>
                                  <SelectTrigger className="h-6 text-sm w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {stages.map((stage) => (
                                      <SelectItem key={stage.key} value={stage.key}>
                                        <div className="flex items-center gap-2">
                                          {stage.icon && <stage.icon className="h-4 w-4" />}
                                          {stage.label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleSaveField}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCancelEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="text-sm">
                                  {(() => {
                                    const currentStage = stages.find(s => s.key === solution.stage)
                                    return currentStage ? currentStage.label : solution.stage
                                  })()}
                                </span>
                                {isEditing && canEditSolution() && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleEditField('stage', solution.stage)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Resource Breakdown</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingField === 'resourceBreakdown' ? (
                              <>
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-6 text-sm w-64"
                                  placeholder="https://..."
                                  autoFocus
                                />
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleSaveField}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCancelEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="text-sm text-blue-600 underline decoration-dotted">
                                  {solution.resourceBreakdown || "No URL set"}
                                </span>
                                {isEditing && canEditSolution() && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleEditField('resourceBreakdown', solution.resourceBreakdown || "")}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Scope of Works URL</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingField === 'scopeOfWorksUrl' ? (
                              <>
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-6 text-sm w-64"
                                  placeholder="https://..."
                                  autoFocus
                                />
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleSaveField}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCancelEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="text-sm text-blue-600 underline decoration-dotted">
                                  {solution.scopeOfWorksUrl || "No URL set"}
                                </span>
                                {isEditing && canEditSolution() && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleEditField('scopeOfWorksUrl', solution.scopeOfWorksUrl || "")}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        
                      </div>
                    </div>
                    
                    {/* Additional Information - Full Width */}
                    <div className="col-span-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">Additional Information</span>
                        <span className="text-gray-400">ⓘ</span>
                      </div>
                      {editingField === 'additionalInformation' ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="Enter additional information..."
                            className="min-h-[100px]"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={handleSaveField}>
                              <Save className="mr-2 h-4 w-4" />
                              Save
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="p-3 bg-gray-50 rounded-lg min-h-[100px] text-sm">
                            {solution.additionalInformation || "No additional information provided."}
                          </div>
                          {isEditing && canEditSolution() && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditField('additionalInformation', solution.additionalInformation || "")}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <div className="border-t bg-gray-50 px-6 py-3">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span>Created by:</span>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs">👤</span>
                            </div>
                            <span className="text-blue-600 underline decoration-dotted">
                              {(() => {
                                const creator = mockUsers.find(u => u.email === solution.createdBy)
                                return creator ? `${creator.name} (${creator.email})` : solution.createdBy
                              })()}
                            </span>
                          </div>
                          <span>on {solution.createdAt.toLocaleDateString()} at {solution.createdAt.toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span>Last modified by:</span>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs">👤</span>
                            </div>
                            <span className="text-blue-600 underline decoration-dotted">
                              {(() => {
                                const modifier = mockUsers.find(u => u.email === solution.lastModifiedBy)
                                return modifier ? `${modifier.name} (${modifier.email})` : solution.lastModifiedBy
                              })()}
                            </span>
                          </div>
                          <span>on {solution.updatedAt.toLocaleDateString()} at {solution.updatedAt.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column - 1/3 width */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Approval Panel</CardTitle>
                    <CardDescription>Manage approvals and track decisions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Submit for Approval */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm">Submit for Approval</h3>
                      <Button 
                        className="w-full" 
                        onClick={() => setIsApprovalModalOpen(true)}
                        disabled={solution.stage === 'approved'}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {solution.stage === 'approved' ? 'Already Approved' : 'Submit for Approval'}
                      </Button>
                    </div>

                    {/* Approval Status */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm">Current Status</h3>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        {solution.stage === 'approved' && (
                          <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                            <div className="flex items-center gap-2 text-yellow-800">
                              <Shield className="h-4 w-4" />
                              <span className="text-sm font-medium">Solution Locked</span>
                            </div>
                            <p className="text-xs text-yellow-700 mt-1">
                              This solution is approved and locked. Only administrators can make changes.
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {approvalHistory.length === 0 ? (
                            <>
                              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                              <span className="text-sm font-medium">Draft</span>
                            </>
                          ) : approvalHistory.some(a => a.status === 'rejected') ? (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm font-medium">Rejected</span>
                            </>
                          ) : approvalHistory.every(a => a.status === 'approved') ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium">Approved</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-sm font-medium">Pending Review</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {approvalHistory.length === 0 
                            ? "Ready to submit for approval"
                            : approvalHistory.some(a => a.status === 'rejected')
                            ? "One or more approvals were rejected"
                            : approvalHistory.every(a => a.status === 'approved')
                            ? "All approvals completed"
                            : `${approvalHistory.filter(a => a.status === 'pending').length} approval(s) pending`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Approval History */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm">Approval History</h3>
                      <div className="space-y-2">
                        {/* Demo Controls */}
                        {approvalHistory.length > 0 && (
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-xs text-blue-800 mb-2">Demo: Simulate approval updates</p>
                            <div className="space-y-1">
                              {approvalHistory.map((approval) => (
                                <div key={approval.id} className="flex items-center gap-2">
                                  <span className="text-xs text-blue-700">{approval.workflowName}:</span>
                                  <span className="text-xs text-gray-500 capitalize">{approval.status}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {approvalHistory.length === 0 ? (
                          <div className="text-center text-muted-foreground py-4">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No approval history yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {approvalHistory.map((approval) => (
                              <div key={approval.id} className="p-2 border rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs font-medium">{approval.workflowName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {approval.submittedAt.toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {approval.status === 'pending' && (
                                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    )}
                                    {approval.status === 'approved' && (
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    )}
                                    {approval.status === 'rejected' && (
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    )}
                                    <span className="text-xs capitalize">{approval.status}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm">Quick Actions</h3>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Solution
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <FileText className="mr-2 h-4 w-4" />
                          Export PDF
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Users className="mr-2 h-4 w-4" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Project Type Selector Dialog */}
      {isProjectTypeSelectorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Project Types</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsProjectTypeSelectorOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-4">
              {/* Available Project Types */}
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-2">Available</h4>
                <div className="border rounded-lg p-2 h-48 overflow-y-auto">
                  {["Consulting", "Managed Service", "Implementation", "Support", "Training"].map((type) => (
                    <div 
                      key={type}
                      className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${
                        selectedProjectTypes.includes(type) ? 'bg-gray-100' : ''
                      }`}
                      onClick={() => handleAddProjectType(type)}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col justify-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const availableTypes = ["Consulting", "Managed Service", "Implementation", "Support", "Training"]
                    const firstAvailable = availableTypes.find(type => !selectedProjectTypes.includes(type))
                    if (firstAvailable) {
                      handleAddProjectType(firstAvailable)
                    }
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (selectedProjectTypes.length > 0) {
                      handleRemoveProjectType(selectedProjectTypes[selectedProjectTypes.length - 1])
                    }
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Chosen Project Types */}
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-2">Chosen</h4>
                <div className="border rounded-lg p-2 h-48 overflow-y-auto">
                  {selectedProjectTypes.map((type) => (
                    <div 
                      key={type}
                      className="p-2 rounded bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200"
                      onClick={() => handleRemoveProjectType(type)}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsProjectTypeSelectorOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setIsProjectTypeSelectorOpen(false)
                  handleSaveField()
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Selection Modal */}
      {solution && (
        <ApprovalSelectionModal
          isOpen={isApprovalModalOpen}
          onClose={() => setIsApprovalModalOpen(false)}
          solution={solution}
          onApprovalSubmit={handleApprovalSubmit}
        />
      )}
    </SidebarProvider>
  )
}

// Wrapper component with provider
export default function SolutionPageWithProvider() {
  return <SolutionPage />
} 