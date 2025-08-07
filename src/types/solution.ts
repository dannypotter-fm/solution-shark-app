export interface Solution {
  id: string
  name: string
  opportunity: string
  customer: string
  stage: SolutionStage
  owner: string
  estimatedValue: number
  amount?: number
  currency?: string
  status: string
  description: string
  resourceBreakdown?: string
  scopeOfWorksUrl?: string
  additionalInformation?: string
  createdAt: Date
  createdBy: string
  updatedAt: Date
  lastModifiedBy: string
}

export type SolutionStage = 'draft' | 'review' | 'approved' | 'rejected'

export interface CreateSolutionData {
  name: string
  opportunity: string
  customer: string
  stage: SolutionStage
  owner: string
  estimatedValue: number
  status: string
  description: string
  lastModifiedBy: string
}

export interface UpdateSolutionData {
  name?: string
  opportunity?: string
  customer?: string
  stage?: SolutionStage
  owner?: string
  estimatedValue?: number
  status?: string
  description?: string
  lastModifiedBy?: string
}

export interface SolutionFilters {
  stage?: SolutionStage
  status?: string
  search?: string
} 