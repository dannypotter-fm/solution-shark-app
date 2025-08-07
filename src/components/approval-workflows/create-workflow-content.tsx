"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  GripVertical,
  Eye,
  EyeOff
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect } from "@/components/ui/multi-select"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ApprovalStep, ApprovalRule, ApprovalWorkflow, ApprovalStepType, ApprovalRuleType, NotificationType, WorkflowConditionRule } from "@/types/approval"
import { useWorkflows } from "@/contexts/workflows-context"

const approvalStepTypes: { value: ApprovalStepType; label: string; description: string }[] = [
  { value: "review", label: "Review", description: "General review step" },
  { value: "approve", label: "Approve", description: "Final approval step" },
  { value: "sign_off", label: "Sign Off", description: "Executive sign-off" },
  { value: "technical_review", label: "Technical Review", description: "Technical feasibility assessment" },
  { value: "business_review", label: "Business Review", description: "Business value assessment" },
  { value: "legal_review", label: "Legal Review", description: "Legal and compliance review" },
  { value: "finance_review", label: "Finance Review", description: "Financial impact review" }
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
  { id: "user1", name: "John Doe", email: "john.doe@example.com", role: "approval_manager" },
  { id: "user2", name: "Jane Smith", email: "jane.smith@example.com", role: "approval_manager" },
  { id: "user3", name: "Bob Wilson", email: "bob.wilson@example.com", role: "approval_manager" },
  { id: "user4", name: "Sarah Johnson", email: "sarah.johnson@example.com", role: "approval_manager" },
  { id: "user5", name: "Mike Chen", email: "mike.chen@example.com", role: "user" }
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

// Sortable Step Component
function SortableStep({ step, onRemove }: { step: ApprovalStep; onRemove: (stepId: string) => void }) {
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
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(step.id)
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function CreateWorkflowContent() {
  const router = useRouter()
  const { addWorkflow } = useWorkflows()
  
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
  
  const [workflow, setWorkflow] = useState<Partial<ApprovalWorkflow>>({
    name: "",
    description: "",
    isActive: true,
    isRequired: false,
    steps: [],
    rules: [],
    conditionRules: [],
    notifications: []
  })

  const [currentStep, setCurrentStep] = useState<Partial<ApprovalStep>>({
    name: "",
    type: "review",
    description: "",
    isRequired: true,
    assignedApprovers: [],
    requireAllApprovers: false
  })

  const [currentRule, setCurrentRule] = useState<Partial<ApprovalRule>>({
    name: "",
    type: "sequential",
    description: ""
  })

  const [newConditionRule, setNewConditionRule] = useState<Partial<WorkflowConditionRule>>({
    field: "",
    operator: "equals",
    value: ""
  })

  const [showAddConditionRule, setShowAddConditionRule] = useState(false)

  const handleAddStep = () => {
    if (!currentStep.name || !currentStep.type) {
      alert("Please fill in all required fields")
      return
    }
    
    const newStep: ApprovalStep = {
      id: `step_${Date.now()}`,
      name: currentStep.name,
      type: currentStep.type as ApprovalStepType,
      description: currentStep.description || "",
      order: (workflow.steps?.length || 0) + 1,
      isRequired: currentStep.isRequired || true,
      assignedApprovers: currentStep.assignedApprovers || [],
      requireAllApprovers: currentStep.requireAllApprovers || false
    }
    
    setWorkflow(prev => ({
      ...prev,
      steps: [...(prev.steps || []), newStep]
    }))
    
    setCurrentStep({
      name: "",
      type: "review",
      description: "",
      isRequired: true,
      assignedApprovers: [],
      requireAllApprovers: false
    })
  }

  const handleRemoveStep = (stepId: string) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps?.filter(step => step.id !== stepId) || []
    }))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id && workflow.steps) {
      const oldIndex = workflow.steps.findIndex(step => step.id === active.id)
      const newIndex = workflow.steps.findIndex(step => step.id === over?.id)

      setWorkflow(prev => ({
        ...prev,
        steps: arrayMove(prev.steps || [], oldIndex, newIndex)
      }))
    }
  }

  const handleAddRule = () => {
    if (!currentRule.name || !currentRule.type) {
      alert("Please fill in all required fields")
      return
    }
    
    const newRule: ApprovalRule = {
      id: `rule_${Date.now()}`,
      name: currentRule.name,
      type: currentRule.type as ApprovalRuleType,
      description: currentRule.description || "",
      order: (workflow.rules?.length || 0) + 1
    }
    
    setWorkflow(prev => ({
      ...prev,
      rules: [...(prev.rules || []), newRule]
    }))
    
    setCurrentRule({
      name: "",
      type: "sequential",
      description: ""
    })
  }

  const handleRemoveRule = (ruleId: string) => {
    setWorkflow(prev => ({
      ...prev,
      rules: prev.rules?.filter(rule => rule.id !== ruleId) || []
    }))
  }

  const handleNotificationToggle = (notificationType: NotificationType) => {
    setWorkflow(prev => ({
      ...prev,
      notifications: prev.notifications?.includes(notificationType)
        ? prev.notifications.filter(n => n !== notificationType)
        : [...(prev.notifications || []), notificationType]
    }))
  }

  const handleAddConditionRule = () => {
    if (!newConditionRule.field || !newConditionRule.operator || !newConditionRule.value) {
      alert("Please fill in all required fields")
      return
    }
    
    const newRule: WorkflowConditionRule = {
      id: `condition_${Date.now()}`,
      field: newConditionRule.field,
      operator: newConditionRule.operator as 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than',
      value: newConditionRule.value
    }
    
    setWorkflow(prev => ({
      ...prev,
      conditionRules: [...(prev.conditionRules || []), newRule]
    }))
    
    setNewConditionRule({
      field: "",
      operator: "equals",
      value: ""
    })
    setShowAddConditionRule(false)
  }

  const handleRemoveConditionRule = (ruleId: string) => {
    setWorkflow(prev => ({
      ...prev,
      conditionRules: prev.conditionRules?.filter(rule => rule.id !== ruleId) || []
    }))
  }

  const handleSave = () => {
    if (!workflow.name || !workflow.description) {
      alert("Please fill in all required fields")
      return
    }
    const newWorkflow: ApprovalWorkflow = {
      id: `workflow_${Date.now()}`,
      name: workflow.name,
      description: workflow.description || "",
      isActive: workflow.isActive || true,
      isArchived: false,
      isRequired: workflow.isRequired || false,
      steps: workflow.steps || [],
      rules: workflow.rules || [],
      conditionRules: workflow.conditionRules || [],
      notifications: workflow.notifications || [],
      createdBy: "John Doe", // In a real app, this would come from auth
      createdDate: new Date(),
      updatedDate: new Date()
    }
    addWorkflow(newWorkflow)
    router.push("/dashboard/approval-workflows")
  }

  if (!canManageWorkflows) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to create approval workflows.
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
            <h1 className="text-2xl font-bold tracking-tight">Create Approval Workflow</h1>
            <p className="text-muted-foreground">
              Define a new approval workflow for solution documents.
            </p>
          </div>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Workflow
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
                Define the basic details of your approval workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Workflow Name *</Label>
                  <Input
                    id="name"
                    value={workflow.name}
                    onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter workflow name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={workflow.description}
                    onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the workflow purpose"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={workflow.isActive}
                  onCheckedChange={(checked) => setWorkflow(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isRequired"
                  checked={workflow.isRequired}
                  onCheckedChange={(checked) => setWorkflow(prev => ({ ...prev, isRequired: checked }))}
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
                Define the rules that govern how approvals are processed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ruleName">Rule Name *</Label>
                  <Input
                    id="ruleName"
                    value={currentRule.name}
                    onChange={(e) => setCurrentRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter rule name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ruleType">Rule Type *</Label>
                  <Select
                    value={currentRule.type}
                    onValueChange={(value) => setCurrentRule(prev => ({ ...prev, type: value as ApprovalRuleType }))}
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
                <div className="space-y-2">
                  <Label htmlFor="ruleDescription">Description</Label>
                  <Input
                    id="ruleDescription"
                    value={currentRule.description}
                    onChange={(e) => setCurrentRule(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter rule description"
                  />
                </div>
              </div>
              <Button onClick={handleAddRule} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
              
              {workflow.rules && workflow.rules.length > 0 && (
                <div className="space-y-2">
                  <Label>Added Rules</Label>
                  {workflow.rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-muted-foreground">{rule.description}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Condition Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Condition Rules</CardTitle>
              <CardDescription>
                Define conditions that determine when this workflow applies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showAddConditionRule ? (
                <Button 
                  onClick={() => setShowAddConditionRule(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Condition Rule
                </Button>
              ) : (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Field</Label>
                      <Select
                        value={newConditionRule.field}
                        onValueChange={(value) => setNewConditionRule(prev => ({ ...prev, field: value }))}
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
                        value={newConditionRule.operator}
                        onValueChange={(value) => setNewConditionRule(prev => ({ ...prev, operator: value as any }))}
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
                        value={newConditionRule.value}
                        onChange={(e) => setNewConditionRule(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="Enter value"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddConditionRule}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Rule
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowAddConditionRule(false)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              {workflow.conditionRules && workflow.conditionRules.length > 0 && (
                <div className="space-y-2">
                  <Label>Added Conditions</Label>
                  {workflow.conditionRules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{rule.field} {rule.operator} {rule.value}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveConditionRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Steps</CardTitle>
              <CardDescription>
                Define the steps in your approval workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stepName">Step Name *</Label>
                  <Input
                    id="stepName"
                    value={currentStep.name}
                    onChange={(e) => setCurrentStep(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter step name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stepType">Step Type *</Label>
                  <Select
                    value={currentStep.type}
                    onValueChange={(value) => setCurrentStep(prev => ({ ...prev, type: value as ApprovalStepType }))}
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
                  value={currentStep.description}
                  onChange={(e) => setCurrentStep(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the step"
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned Approvers</Label>
                <MultiSelect
                  options={mockUsers.map(user => ({ value: user.id, label: user.name }))}
                  selectedValues={currentStep.assignedApprovers || []}
                  onSelectionChange={(selected) => setCurrentStep(prev => ({ ...prev, assignedApprovers: selected }))}
                  placeholder="Select approvers"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireAllApprovers"
                  checked={currentStep.requireAllApprovers}
                  onCheckedChange={(checked) => setCurrentStep(prev => ({ ...prev, requireAllApprovers: checked as boolean }))}
                />
                <Label htmlFor="requireAllApprovers">Require all approvers to approve</Label>
              </div>
              <Button onClick={handleAddStep} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
              
              {workflow.steps && workflow.steps.length > 0 && (
                <div className="space-y-2">
                  <Label>Added Steps</Label>
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
                          onRemove={handleRemoveStep}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
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
                  <span className="font-medium">{workflow.steps?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rules</span>
                  <span className="font-medium">{workflow.rules?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Conditions</span>
                  <span className="font-medium">{workflow.conditionRules?.length || 0}</span>
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
                    checked={workflow.notifications?.includes(notification.value)}
                    onCheckedChange={() => handleNotificationToggle(notification.value)}
                  />
                  <Label htmlFor={notification.value}>{notification.label}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 