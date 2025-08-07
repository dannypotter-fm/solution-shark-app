"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface ApprovalHistory {
  id: string
  workflowId: string
  workflowName: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: Date
  submittedBy: string
  processedAt?: Date
  processedBy?: string
  notes?: string
  currentStep?: string
  stepOrder?: number
}

import { Solution } from "@/types/solution"

export interface Approval {
  id: string
  solutionId: string
  solutionName: string
  workflowId: string
  workflowName: string
  requesterName: string
  requesterEmail: string
  submittedAt: Date
  status: 'pending' | 'approved' | 'rejected'
  currentStep: string
  stepOrder: number
  totalSteps: number
  assignedApprovers: string[]
  isAssignedToCurrentUser: boolean
  priority: 'low' | 'medium' | 'high'
  estimatedValue: number
  currency: string
  notes?: string
  processedAt?: Date
  processedBy?: string
}

interface ApprovalsContextType {
  approvals: Approval[]
  solutions: Solution[]
  approvalHistory: { [solutionId: string]: ApprovalHistory[] }
  processApproval: (approvalId: string, action: 'approved' | 'rejected', notes: string) => Promise<void>
  updateSolutionStage: (solutionId: string, stage: Solution['stage'], previousStage?: Solution['stage']) => void
  updateSolution: (solutionId: string, updates: Partial<Solution>) => void
  createSolution: (solutionData: Partial<Solution>) => string
  addApprovalHistory: (solutionId: string, history: ApprovalHistory) => void
  getSolutionApprovalHistory: (solutionId: string) => ApprovalHistory[]
  refreshApprovals: () => void
  clearSolutions: () => void
}

const ApprovalsContext = createContext<ApprovalsContextType | undefined>(undefined)

// Mock data
const mockSolutions: Solution[] = [
  {
    id: "1",
    name: "Enterprise Cloud Migration",
    opportunity: "Cloud Infrastructure Upgrade",
    customer: "TechCorp Inc.",
    stage: "review",
    owner: "user1",
    estimatedValue: 250000,
    amount: 250000,
    currency: "USD",
    status: "active",
    description: "Comprehensive cloud migration strategy for enterprise infrastructure.",
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
    stage: "approved",
    owner: "user2",
    estimatedValue: 500000,
    amount: 500000,
    currency: "GBP",
    status: "active",
    description: "End-to-end digital transformation solution for retail operations.",
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
    owner: "user3",
    estimatedValue: 150000,
    amount: 150000,
    currency: "EUR",
    status: "active",
    description: "Comprehensive cybersecurity framework implementation.",
    createdAt: new Date("2024-01-05"),
    createdBy: "mike.johnson@example.com",
    updatedAt: new Date("2024-01-15"),
    lastModifiedBy: "david.brown@example.com"
  },
  {
    id: "4",
    name: "Data Analytics Platform",
    opportunity: "Business Intelligence",
    customer: "DataFlow Solutions",
    stage: "draft",
    owner: "user4",
    estimatedValue: 300000,
    amount: 300000,
    currency: "USD",
    status: "archived",
    description: "Advanced analytics platform for business intelligence.",
    createdAt: new Date("2023-12-20"),
    createdBy: "sarah.wilson@example.com",
    updatedAt: new Date("2023-12-28"),
    lastModifiedBy: "john.doe@example.com"
  }
]

const mockApprovals: Approval[] = [
  {
    id: "approval_1",
    solutionId: "1",
    solutionName: "Enterprise Cloud Migration",
    workflowId: "workflow_1", 
    workflowName: "Technical Review",
    requesterName: "John Doe",
    requesterEmail: "john.doe@example.com",
    submittedAt: new Date(2024, 0, 20),
    status: 'pending',
    currentStep: "Technical Assessment",
    stepOrder: 1,
    totalSteps: 3,
    assignedApprovers: ["user3", "user4"],
    isAssignedToCurrentUser: true,
    priority: 'high',
    estimatedValue: 250000,
    currency: "USD"
  },
  {
    id: "approval_2",
    solutionId: "1", 
    solutionName: "Enterprise Cloud Migration",
    workflowId: "workflow_2",
    workflowName: "Business Review",
    requesterName: "John Doe",
    requesterEmail: "john.doe@example.com",
    submittedAt: new Date(2024, 0, 19),
    status: 'pending',
    currentStep: "Business Value Assessment", 
    stepOrder: 1,
    totalSteps: 2,
    assignedApprovers: ["user2", "user5"],
    isAssignedToCurrentUser: false,
    priority: 'high',
    estimatedValue: 250000,
    currency: "USD"
  },
  {
    id: "approval_3",
    solutionId: "2",
    solutionName: "Digital Transformation Platform", 
    workflowId: "workflow_3",
    workflowName: "Executive Sign-off",
    requesterName: "Jane Smith",
    requesterEmail: "jane.smith@example.com",
    submittedAt: new Date(2024, 0, 18),
    status: 'approved',
    currentStep: "Executive Review",
    stepOrder: 1,
    totalSteps: 1,
    assignedApprovers: ["user1"],
    isAssignedToCurrentUser: false,
    priority: 'medium',
    estimatedValue: 500000,
    currency: "GBP",
    notes: "Approved with budget increase recommendation",
    processedAt: new Date(2024, 0, 19),
    processedBy: "user1"
  }
]

export function ApprovalsProvider({ children }: { children: ReactNode }) {
  // Initialize approvals from localStorage or fall back to mock data
  const [approvals, setApprovals] = useState<Approval[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('solution-shark-approvals')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Convert date strings back to Date objects
          return parsed.map((approval: any) => ({
            ...approval,
            submittedAt: new Date(approval.submittedAt),
            processedAt: approval.processedAt ? new Date(approval.processedAt) : undefined
          }))
        } catch (error) {
          console.error('Error parsing stored approvals:', error)
        }
      }
    }
    return mockApprovals
  })
  
  // Initialize solutions from localStorage or fall back to mock data
  const [solutions, setSolutions] = useState<Solution[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('solution-shark-solutions')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Convert date strings back to Date objects
          return parsed.map((solution: any) => ({
            ...solution,
            createdAt: new Date(solution.createdAt),
            updatedAt: new Date(solution.updatedAt)
          }))
        } catch (error) {
          console.error('Error parsing stored solutions:', error)
        }
      }
    }
    return mockSolutions
  })
  
  const [approvalHistory, setApprovalHistory] = useState<{ [solutionId: string]: ApprovalHistory[] }>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('solution-shark-approval-history')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Convert date strings back to Date objects
          const history: { [solutionId: string]: ApprovalHistory[] } = {}
          Object.keys(parsed).forEach(solutionId => {
            history[solutionId] = parsed[solutionId].map((entry: any) => ({
              ...entry,
              submittedAt: new Date(entry.submittedAt),
              processedAt: entry.processedAt ? new Date(entry.processedAt) : undefined
            }))
          })
          return history
        } catch (error) {
          console.error('Error parsing stored approval history:', error)
        }
      }
    }
    return {}
  })
  
  // Debug logging for solutions state changes
  useEffect(() => {
    console.log("ApprovalsProvider - solutions state:", solutions)
  }, [solutions])
  
  // Persist solutions to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('solution-shark-solutions', JSON.stringify(solutions))
    }
  }, [solutions])
  
  // Persist approvals to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('solution-shark-approvals', JSON.stringify(approvals))
    }
  }, [approvals])
  
  // Persist approval history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('solution-shark-approval-history', JSON.stringify(approvalHistory))
    }
  }, [approvalHistory])
  
  // Initialize approval history from existing approvals (only once)
  useEffect(() => {
    const history: { [solutionId: string]: ApprovalHistory[] } = {}
    
    mockApprovals.forEach(approval => {
      if (!history[approval.solutionId]) {
        history[approval.solutionId] = []
      }
      
      history[approval.solutionId].push({
        id: approval.id,
        workflowId: approval.workflowId,
        workflowName: approval.workflowName,
        status: approval.status,
        submittedAt: approval.submittedAt,
        submittedBy: approval.requesterName,
        processedAt: approval.processedAt,
        processedBy: approval.processedBy,
        notes: approval.notes,
        currentStep: approval.currentStep,
        stepOrder: approval.stepOrder
      })
    })
    
    setApprovalHistory(history)
  }, [])

  const processApproval = async (approvalId: string, action: 'approved' | 'rejected', notes: string) => {
    const approval = approvals.find(a => a.id === approvalId)
    if (!approval) throw new Error('Approval not found')

    const currentUser = "user3" // In real app, get from auth context
    const processedAt = new Date()

    // Update the approval
    setApprovals(prev => prev.map(a => 
      a.id === approvalId 
        ? { 
            ...a, 
            status: action, 
            notes, 
            processedAt, 
            processedBy: currentUser 
          }
        : a
    ))

    // Add to approval history
    const historyEntry: ApprovalHistory = {
      id: approvalId,
      workflowId: approval.workflowId,
      workflowName: approval.workflowName,
      status: action,
      submittedAt: approval.submittedAt,
      submittedBy: approval.requesterName,
      processedAt,
      processedBy: currentUser,
      notes,
      currentStep: approval.currentStep,
      stepOrder: approval.stepOrder
    }

    addApprovalHistory(approval.solutionId, historyEntry)

    // Handle solution status updates
    if (action === 'rejected') {
      // Reset solution to previous stage (typically draft)
      updateSolutionStage(approval.solutionId, 'draft', 'review')
      
      // Mark all other pending approvals for this solution as cancelled
      setApprovals(prev => prev.map(a => 
        a.solutionId === approval.solutionId && a.status === 'pending'
          ? { ...a, status: 'rejected', notes: 'Cancelled due to rejection in parallel workflow', processedAt, processedBy: 'system' }
          : a
      ))
    } else {
      // Check if this completes all approvals for the solution
      const solutionApprovals = approvals.filter(a => a.solutionId === approval.solutionId)
      const remainingPending = solutionApprovals.filter(a => 
        a.id !== approvalId && a.status === 'pending'
      )

      if (remainingPending.length === 0) {
        // All approvals complete - mark solution as approved
        updateSolutionStage(approval.solutionId, 'approved', 'review')
      }
      // If there are still pending approvals, solution stays in review
    }
  }

  const updateSolutionStage = (solutionId: string, stage: Solution['stage'], previousStage?: Solution['stage']) => {
    setSolutions(prev => prev.map(s => 
      s.id === solutionId 
        ? { ...s, stage, previousStage: previousStage || s.stage }
        : s
    ))
  }

  const updateSolution = (solutionId: string, updates: Partial<Solution>) => {
    setSolutions(prev => prev.map(s => 
      s.id === solutionId 
        ? { ...s, ...updates }
        : s
    ))
  }

  const createSolution = (solutionData: Partial<Solution>): string => {
    console.log("createSolution called with:", solutionData)
    
    const newSolution: Solution = {
      id: Date.now().toString(),
      name: solutionData.name || "Untitled Solution",
      opportunity: solutionData.opportunity || solutionData.name || "Untitled Opportunity",
      customer: solutionData.customer || "Example Customer",
      stage: solutionData.stage || "draft",
      owner: solutionData.owner || "user1",
      estimatedValue: solutionData.estimatedValue || 0,
      amount: solutionData.amount || solutionData.estimatedValue || 0,
      currency: solutionData.currency || "USD",
      status: solutionData.status || "active",
      description: solutionData.description || "Solution description",
      createdAt: new Date(),
      createdBy: "user@example.com",
      updatedAt: new Date(),
      lastModifiedBy: "user@example.com",
      ...solutionData
    }
    
    console.log("Creating new solution:", newSolution)
    setSolutions(prev => {
      const updatedSolutions = [newSolution, ...prev]
      console.log("Updated solutions state:", updatedSolutions)
      return updatedSolutions
    })
    return newSolution.id
  }

  const addApprovalHistory = (solutionId: string, history: ApprovalHistory) => {
    setApprovalHistory(prev => ({
      ...prev,
      [solutionId]: [...(prev[solutionId] || []), history]
    }))
    
    // Also create a corresponding approval record
    const solution = solutions.find(s => s.id === solutionId)
    if (solution) {
      const newApproval: Approval = {
        id: history.id,
        solutionId: solutionId,
        solutionName: solution.name,
        workflowId: history.workflowId,
        workflowName: history.workflowName,
        requesterName: history.submittedBy,
        requesterEmail: 'user@example.com', // In real app, get from auth context
        submittedAt: history.submittedAt,
        status: history.status,
        currentStep: history.currentStep || 'Initial Review',
        stepOrder: history.stepOrder || 1,
        totalSteps: 1, // In real app, get from workflow
        assignedApprovers: ['user3'], // In real app, get from workflow
        isAssignedToCurrentUser: true, // In real app, check current user
        priority: 'medium', // In real app, determine based on solution value
        estimatedValue: solution.estimatedValue,
        currency: solution.currency || 'USD'
      }
      
      setApprovals(prev => [...prev, newApproval])
    }
  }

  const getSolutionApprovalHistory = (solutionId: string): ApprovalHistory[] => {
    return approvalHistory[solutionId] || []
  }

  const refreshApprovals = () => {
    // In real app, this would refetch from API
    setApprovals([...mockApprovals])
  }

  const clearSolutions = () => {
    setSolutions([])
    setApprovals([])
    setApprovalHistory({})
    localStorage.removeItem('solution-shark-solutions')
    localStorage.removeItem('solution-shark-approvals')
    localStorage.removeItem('solution-shark-approval-history')
  }

  return (
    <ApprovalsContext.Provider value={{
      approvals,
      solutions,
      approvalHistory,
      processApproval,
      updateSolutionStage,
      updateSolution,
      createSolution,
      addApprovalHistory,
      getSolutionApprovalHistory,
      refreshApprovals,
      clearSolutions
    }}>
      {children}
    </ApprovalsContext.Provider>
  )
}

export function useApprovals() {
  const context = useContext(ApprovalsContext)
  if (context === undefined) {
    throw new Error('useApprovals must be used within an ApprovalsProvider')
  }
  return context
}