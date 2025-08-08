export type ApprovalStepType = 
  | "review"
  | "approve"
  | "sign_off"
  | "technical_review"
  | "business_review"
  | "legal_review"
  | "finance_review"

export type ApprovalRuleType = 
  | "sequential"
  | "parallel"
  | "any_one"
  | "all_required"
  | "majority"

export type NotificationType = 
  | "email"
  | "slack"
  | "sms"
  | "in_app"

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type ApprovalPriority = 'low' | 'medium' | 'high'

export interface ApprovalStep {
  id: string
  name: string
  type: ApprovalStepType
  description: string
  order: number
  isRequired: boolean
  assignedApprovers: string[]
  requireAllApprovers: boolean
}

export interface ApprovalRule {
  id: string
  name: string
  type: ApprovalRuleType
  description: string
  minApprovals?: number
  maxApprovals?: number
}

export interface WorkflowConditionRule {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: string
  order: number
}

export interface ApprovalWorkflow {
  id: string
  name: string
  description: string
  isActive: boolean
  isArchived: boolean
  isRequired: boolean
  steps: ApprovalStep[]
  rules: ApprovalRule[]
  conditionRules: WorkflowConditionRule[]
  notifications: NotificationType[]
  createdBy: string
  createdDate: Date
  updatedDate: Date
}

export interface ApprovalWorkflowFilters {
  search?: string
  isActive?: boolean
  isArchived?: boolean
  isRequired?: boolean
  createdBy?: string
}

export interface Approval {
  id: string
  solutionId: string
  solutionName: string
  workflowId: string
  workflowName: string
  requesterName: string
  requesterEmail: string
  submittedAt: Date
  status: ApprovalStatus
  currentStep: string
  stepOrder: number
  totalSteps: number
  assignedApprovers: string[]
  isAssignedToCurrentUser: boolean
  priority: ApprovalPriority
  estimatedValue: number
  currency: string
  notes?: string
  processedAt?: Date
  processedBy?: string
}

export interface ApprovalHistory {
  id: string
  workflowId: string
  workflowName: string
  status: ApprovalStatus
  submittedAt: Date
  submittedBy: string
  processedAt?: Date
  processedBy?: string
  notes?: string
  currentStep?: string
  stepOrder?: number
} 