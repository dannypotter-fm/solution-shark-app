"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  X,
  Users,
  Bell,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Shield,
  Filter,
  ChevronDown,
  ChevronUp,
  UserPlus,
  GripVertical
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect } from "@/components/ui/multi-select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ApprovalStep, ApprovalRule, ApprovalWorkflow, ApprovalStepType, ApprovalRuleType, NotificationType, WorkflowConditionRule } from "@/types/approval"
import { useWorkflows } from "@/contexts/workflows-context"

const approvalStepTypes: { value: ApprovalStepType; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "review", label: "Review", description: "General review step", icon: Eye },
  { value: "approve", label: "Approve", description: "Final approval step", icon: CheckCircle },
  { value: "sign_off", label: "Sign Off", description: "Executive sign-off", icon: Shield },
  { value: "technical_review", label: "Technical Review", description: "Technical feasibility assessment", icon: Settings },
  { value: "business_review", label: "Business Review", description: "Business value assessment", icon: Users },
  { value: "legal_review", label: "Legal Review", description: "Legal and compliance review", icon: Shield },
  { value: "finance_review", label: "Finance Review", description: "Financial impact review", icon: CheckCircle }
]

const approvalRuleTypes: { value: ApprovalRuleType; label: string; description: string }[] = [
  { value: "sequential", label: "Sequential", description: "Approvals must be completed in order" },
  { value: "parallel", label: "Parallel", description: "Approvals can happen simultaneously" },
  { value: "any_one", label: "Any One", description: "Any one approver can approve" },
  { value: "all_required", label: "All Required", description: "All approvers must approve" },
  { value: "majority", label: "Majority", description: "Majority of approvers must approve" }
]

const notificationTypes: { value: NotificationType; label: string; description: string }[] = [
  { value: "email", label: "Email", description: "Email notifications" },
  { value: "slack", label: "Slack", description: "Slack channel notifications" },
  { value: "sms", label: "SMS", description: "SMS text notifications" },
  { value: "in_app", label: "In-App", description: "In-app notifications" }
]

const mockUsers = [
  { id: "user1", name: "John Doe", email: "john.doe@example.com", role: "approval_manager", avatar: "JD" },
  { id: "user2", name: "Jane Smith", email: "jane.smith@example.com", role: "approval_manager", avatar: "JS" },
  { id: "user3", name: "Bob Wilson", email: "bob.wilson@example.com", role: "approval_manager", avatar: "BW" },
  { id: "user4", name: "Sarah Johnson", email: "sarah.johnson@example.com", role: "approval_manager", avatar: "SJ" },
  { id: "user5", name: "Mike Chen", email: "mike.chen@example.com", role: "user", avatar: "MC" },
  { id: "user6", name: "Lisa Brown", email: "lisa.brown@example.com", role: "approval_manager", avatar: "LB" },
  { id: "user7", name: "David Lee", email: "david.lee@example.com", role: "user", avatar: "DL" }
]

const availableFields = [
  { value: "projectType", label: "Project Type" },
  { value: "budget", label: "Budget" },
  { value: "priority", label: "Priority" },
  { value: "department", label: "Department" },
  { value: "category", label: "Category" },
  { value: "status", label: "Status" }
]

const projectTypeValues = [
  { value: "Consulting", label: "Consulting" },
  { value: "Managed Service", label: "Managed Service" },
  { value: "Implementation", label: "Implementation" },
  { value: "Support", label: "Support" },
  { value: "Training", label: "Training" }
]

const availableOperators = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "greater_than_or_equal", label: "Greater Than or Equal" },
  { value: "less_than_or_equal", label: "Less Than or Equal" }
]

// Mock workflow data for demonstration
const mockWorkflow: ApprovalWorkflow = {
  id: "workflow_1",
  name: "Enterprise Solution Approval",
  description: "Multi-stage approval process for enterprise solutions",
  isActive: true,
  isArchived: false,
  isRequired: true,
  steps: [
    {
      id: "step_1",
      name: "Technical Review",
      type: "technical_review",
      description: "Technical feasibility assessment",
      order: 1,
      isRequired: true,
      assignedApprovers: ["user1", "user3"],
      requireAllApprovers: true
    },
    {
      id: "step_2",
      name: "Business Review",
      type: "business_review",
      description: "Business value assessment",
      order: 2,
      isRequired: true,
      assignedApprovers: ["user2", "user4"],
      requireAllApprovers: false
    },
    {
      id: "step_3",
      name: "Executive Approval",
      type: "sign_off",
      description: "Final executive sign-off",
      order: 3,
      isRequired: true,
      assignedApprovers: ["user6"],
      requireAllApprovers: true
    }
  ],
  rules: [
    {
      id: "rule_1",
      name: "Sequential Processing",
      type: "sequential",
      description: "Steps must be completed in order",
      order: 1
    },
    {
      id: "rule_2",
      name: "Parallel Reviews",
      type: "parallel",
      description: "Technical and business reviews can happen simultaneously",
      order: 2
    }
  ],
  conditionRules: [
    {
      id: "condition_1",
      field: "budget",
      operator: "greater_than",
      value: "100000"
    },
    {
      id: "condition_2",
      field: "solutionType",
      operator: "equals",
      value: "enterprise"
    }
  ],
  notifications: ["email", "in_app"],
  createdBy: "John Doe",
  createdDate: new Date("2024-01-15"),
  updatedDate: new Date("2024-01-20")
}

// Sortable Step Component
function SortableStep({ step, onEdit }: { step: ApprovalStep; onEdit: (step: ApprovalStep) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border rounded-lg bg-background"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
        <div>
          <div className="font-medium">{step.name}</div>
          <div className="text-sm text-muted-foreground">{step.description}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline">{step.type}</Badge>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(step)
          }}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function EditWorkflowContent() {
  const router = useRouter()
  const params = useParams()
  const { getWorkflow, updateWorkflow } = useWorkflows()
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
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
  
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Edit states
  const [editingStep, setEditingStep] = useState<ApprovalStep | null>(null)
  const [editingRule, setEditingRule] = useState<ApprovalRule | null>(null)
  const [editingConditionRule, setEditingConditionRule] = useState<WorkflowConditionRule | null>(null)

  useEffect(() => {
    try {
      // In a real app, this would fetch from API based on params.id
      // For now, use mock data
      setWorkflow(mockWorkflow)
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading workflow:', error)
      setIsLoading(false)
    }
  }, [params?.id])

  const handleSave = () => {
    if (!workflow) return
    
    // In a real app, this would call API
    updateWorkflow(workflow.id, workflow)
    router.push("/dashboard/approval-workflows")
  }

  const handleEditStep = (step: ApprovalStep) => {
    setEditingStep(step)
  }

  const handleEditRule = (rule: ApprovalRule) => {
    setEditingRule(rule)
  }

  const handleEditConditionRule = (rule: WorkflowConditionRule) => {
    setEditingConditionRule(rule)
  }

  const handleUpdateStep = (updatedStep: ApprovalStep) => {
    if (!workflow) return
    
    setWorkflow(prev => prev ? {
      ...prev,
      steps: prev.steps.map(step => 
        step.id === updatedStep.id ? updatedStep : step
      )
    } : null)
    setEditingStep(null)
  }

  const handleUpdateRule = (updatedRule: ApprovalRule) => {
    if (!workflow) return
    
    setWorkflow(prev => prev ? {
      ...prev,
      rules: prev.rules.map(rule => 
        rule.id === updatedRule.id ? updatedRule : rule
      )
    } : null)
    setEditingRule(null)
  }

  const handleUpdateConditionRule = (updatedRule: WorkflowConditionRule) => {
    if (!workflow) return
    
    setWorkflow(prev => prev ? {
      ...prev,
      conditionRules: prev.conditionRules.map(rule => 
        rule.id === updatedRule.id ? updatedRule : rule
      )
    } : null)
    setEditingConditionRule(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id && workflow) {
      const oldIndex = workflow.steps.findIndex(step => step.id === active.id)
      const newIndex = workflow.steps.findIndex(step => step.id === over?.id)

      setWorkflow(prev => prev ? {
        ...prev,
        steps: arrayMove(prev.steps, oldIndex, newIndex)
      } : null)
    }
  }

  if (!canManageWorkflows) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to edit approval workflows.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Workflow Not Found</h2>
          <p className="text-muted-foreground">
            The requested workflow could not be found.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Approval Workflow</h1>
            <p className="text-muted-foreground">
              Modify the approval workflow settings and steps.
            </p>
          </div>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the basic details of your approval workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Workflow Name *</Label>
                  <Input
                    id="name"
                    value={workflow.name}
                    onChange={(e) => setWorkflow(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter workflow name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={workflow.description}
                    onChange={(e) => setWorkflow(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Describe the workflow purpose"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={workflow.isActive}
                  onCheckedChange={(checked) => setWorkflow(prev => prev ? { ...prev, isActive: checked } : null)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isRequired"
                  checked={workflow.isRequired}
                  onCheckedChange={(checked) => setWorkflow(prev => prev ? { ...prev, isRequired: checked } : null)}
                />
                <Label htmlFor="isRequired">Required for all solutions</Label>
              </div>
            </CardContent>
          </Card>

          {/* Approval Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Rules</CardTitle>
              <CardDescription>
                Manage the rules that govern how approvals are processed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflow.rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-sm text-muted-foreground">{rule.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{rule.type}</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditRule(rule)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Condition Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Condition Rules</CardTitle>
              <CardDescription>
                Manage conditions that determine when this workflow applies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflow.conditionRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{rule.field} {rule.operator} {rule.value}</div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditConditionRule(rule)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Approval Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Steps</CardTitle>
              <CardDescription>
                Manage the steps in your approval workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={workflow.steps.map(step => step.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {workflow.steps.map((step, index) => (
                    <SortableStep
                      key={step.id}
                      step={step}
                      onEdit={handleEditStep}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workflow Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Steps</span>
                  <span className="font-medium">{workflow.steps.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rules</span>
                  <span className="font-medium">{workflow.rules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Conditions</span>
                  <span className="font-medium">{workflow.conditionRules.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Choose how to notify users about workflow events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationTypes.map((notification) => (
                <div key={notification.value} className="flex items-center space-x-2">
                  <Switch
                    id={notification.value}
                    checked={workflow.notifications.includes(notification.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setWorkflow(prev => prev ? { ...prev, notifications: [...prev.notifications, notification.value] } : null)
                      } else {
                        setWorkflow(prev => prev ? { ...prev, notifications: prev.notifications.filter(n => n !== notification.value) } : null)
                      }
                    }}
                  />
                  <Label htmlFor={notification.value}>{notification.label}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Step Dialog */}
      {editingStep && (
        <Dialog open={!!editingStep} onOpenChange={() => setEditingStep(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Approval Step</DialogTitle>
              <DialogDescription>
                Modify the approval step settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stepName">Step Name *</Label>
                  <Input
                    id="stepName"
                    value={editingStep.name}
                    onChange={(e) => setEditingStep(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter step name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stepType">Step Type *</Label>
                  <Select
                    value={editingStep.type}
                    onValueChange={(value) => setEditingStep(prev => prev ? { ...prev, type: value as ApprovalStepType } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select step type" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvalStepTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stepDescription">Description</Label>
                <Textarea
                  id="stepDescription"
                  value={editingStep.description}
                  onChange={(e) => setEditingStep(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Describe the step"
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned Approvers</Label>
                <MultiSelect
                  options={mockUsers.map(user => ({ value: user.id, label: user.name }))}
                  selectedValues={editingStep.assignedApprovers || []}
                  onSelectionChange={(selected) => setEditingStep(prev => prev ? { ...prev, assignedApprovers: selected } : null)}
                  placeholder="Select approvers"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireAllApprovers"
                  checked={editingStep.requireAllApprovers}
                  onCheckedChange={(checked) => setEditingStep(prev => prev ? { ...prev, requireAllApprovers: checked as boolean } : null)}
                />
                <Label htmlFor="requireAllApprovers">Require all approvers to approve</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingStep(null)}>
                Cancel
              </Button>
              <Button onClick={() => editingStep && handleUpdateStep(editingStep)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Rule Dialog */}
      {editingRule && (
        <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Approval Rule</DialogTitle>
              <DialogDescription>
                Modify the approval rule settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ruleName">Rule Name *</Label>
                  <Input
                    id="ruleName"
                    value={editingRule.name}
                    onChange={(e) => setEditingRule(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter rule name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ruleType">Rule Type *</Label>
                  <Select
                    value={editingRule.type}
                    onValueChange={(value) => setEditingRule(prev => prev ? { ...prev, type: value as ApprovalRuleType } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rule type" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvalRuleTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ruleDescription">Description</Label>
                <Input
                  id="ruleDescription"
                  value={editingRule.description}
                  onChange={(e) => setEditingRule(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Enter rule description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRule(null)}>
                Cancel
              </Button>
              <Button onClick={() => editingRule && handleUpdateRule(editingRule)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Condition Rule Dialog */}
      {editingConditionRule && (
        <Dialog open={!!editingConditionRule} onOpenChange={() => setEditingConditionRule(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Condition Rule</DialogTitle>
              <DialogDescription>
                Modify the condition rule settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Field</Label>
                  <Select
                    value={editingConditionRule.field}
                    onValueChange={(value) => setEditingConditionRule(prev => prev ? { ...prev, field: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Operator</Label>
                  <Select
                    value={editingConditionRule.operator}
                    onValueChange={(value) => setEditingConditionRule(prev => prev ? { ...prev, operator: value as any } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOperators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    value={editingConditionRule.value}
                    onChange={(e) => setEditingConditionRule(prev => prev ? { ...prev, value: e.target.value } : null)}
                    placeholder="Enter value"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingConditionRule(null)}>
                Cancel
              </Button>
              <Button onClick={() => editingConditionRule && handleUpdateConditionRule(editingConditionRule)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 