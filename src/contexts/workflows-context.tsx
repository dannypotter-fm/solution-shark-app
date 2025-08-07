"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import { ApprovalWorkflow } from "@/types/approval"

interface WorkflowsContextType {
  workflows: ApprovalWorkflow[]
  addWorkflow: (workflow: ApprovalWorkflow) => void
  updateWorkflow: (id: string, workflow: ApprovalWorkflow) => void
  deleteWorkflow: (id: string) => void
  getWorkflow: (id: string) => ApprovalWorkflow | undefined
}

const WorkflowsContext = createContext<WorkflowsContextType | undefined>(undefined)

// Initial mock data
const initialWorkflows: ApprovalWorkflow[] = [
  {
    id: "1",
    name: "Enterprise Solution Approval",
    description: "Standard approval workflow for enterprise-level solutions",
    isActive: true,
    isArchived: false,
    isRequired: true,
    steps: [
      {
        id: "step1",
        name: "Technical Review",
        type: "technical_review",
        description: "Technical feasibility assessment",
        order: 1,
        isRequired: true,
        assignedApprovers: ["user1"],
        requireAllApprovers: true
      },
      {
        id: "step2",
        name: "Business Review",
        type: "business_review",
        description: "Business value and ROI assessment",
        order: 2,
        isRequired: true,
        assignedApprovers: ["user2"],
        requireAllApprovers: false
      },
      {
        id: "step3",
        name: "Legal Review",
        type: "legal_review",
        description: "Legal and compliance review",
        order: 3,
        isRequired: true,
        assignedApprovers: ["user3"],
        requireAllApprovers: true
      },
      {
        id: "step4",
        name: "Final Approval",
        type: "approve",
        description: "Final executive approval",
        order: 4,
        isRequired: true,
        assignedApprovers: ["user4"],
        requireAllApprovers: true
      }
    ],
    rules: [
      {
        id: "rule1",
        name: "Sequential Approval",
        type: "sequential",
        description: "Approvals must be completed in order"
      }
    ],
    conditionRules: [
      {
        id: "rule1",
        field: "projectType",
        operator: "equals",
        value: "Implementation",
        order: 1
      },
      {
        id: "rule2",
        field: "budget",
        operator: "greater_than",
        value: "10000",
        order: 2
      }
    ],
    notifications: ["email", "in_app"],
    createdBy: "John Doe",
    createdDate: new Date("2024-01-15"),
    updatedDate: new Date("2024-01-20")
  },
  {
    id: "2",
    name: "Quick Solution Approval",
    description: "Fast-track approval for simple solutions",
    isActive: true,
    isArchived: false,
    isRequired: false,
    steps: [
      {
        id: "step1",
        name: "Quick Review",
        type: "review",
        description: "Rapid technical and business review",
        order: 1,
        isRequired: true,
        assignedApprovers: ["user1"],
        requireAllApprovers: false
      },
      {
        id: "step2",
        name: "Manager Approval",
        type: "approve",
        description: "Manager sign-off",
        order: 2,
        isRequired: true,
        assignedApprovers: ["user2"],
        requireAllApprovers: true
      }
    ],
    rules: [
      {
        id: "rule1",
        name: "Parallel Review",
        type: "parallel",
        description: "Reviews can happen simultaneously"
      }
    ],
    conditionRules: [],
    notifications: ["email", "in_app"],
            createdBy: "John Doe",
    createdDate: new Date("2024-01-10"),
    updatedDate: new Date("2024-01-18")
  },
  {
    id: "3",
    name: "Legacy Approval Process",
    description: "Deprecated approval workflow",
    isActive: false,
    isArchived: true,
    isRequired: false,
    steps: [
      {
        id: "step1",
        name: "Initial Review",
        type: "review",
        description: "Initial assessment",
        order: 1,
        isRequired: true,
        assignedApprovers: ["user1"],
        requireAllApprovers: false
      }
    ],
    rules: [
      {
        id: "rule1",
        name: "Single Approval",
        type: "any_one",
        description: "Any one approver can approve"
      }
    ],
    conditionRules: [],
    notifications: ["email"],
            createdBy: "John Doe",
    createdDate: new Date("2023-12-01"),
    updatedDate: new Date("2024-01-05")
  }
]

export function WorkflowsProvider({ children }: { children: ReactNode }) {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(initialWorkflows)

  const addWorkflow = (workflow: ApprovalWorkflow) => {
    setWorkflows(prev => [...prev, workflow])
  }

  const updateWorkflow = (id: string, updatedWorkflow: ApprovalWorkflow) => {
    setWorkflows(prev => prev.map(workflow => 
      workflow.id === id ? updatedWorkflow : workflow
    ))
  }

  const deleteWorkflow = (id: string) => {
    setWorkflows(prev => prev.filter(workflow => workflow.id !== id))
  }

  const getWorkflow = (id: string) => {
    return workflows.find(workflow => workflow.id === id)
  }

  return (
    <WorkflowsContext.Provider value={{
      workflows,
      addWorkflow,
      updateWorkflow,
      deleteWorkflow,
      getWorkflow
    }}>
      {children}
    </WorkflowsContext.Provider>
  )
}

export function useWorkflows() {
  const context = useContext(WorkflowsContext)
  if (context === undefined) {
    throw new Error('useWorkflows must be used within a WorkflowsProvider')
  }
  return context
} 