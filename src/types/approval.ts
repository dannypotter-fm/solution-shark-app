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