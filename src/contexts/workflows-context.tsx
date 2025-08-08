'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ApprovalWorkflow } from '@/types/approval'

interface WorkflowsContextType {
  workflows: ApprovalWorkflow[]
  createWorkflow: (workflowData: Partial<ApprovalWorkflow>) => Promise<ApprovalWorkflow>
  updateWorkflow: (id: string, updateData: Partial<ApprovalWorkflow>) => Promise<void>
  deleteWorkflow: (id: string) => Promise<void>
  getWorkflow: (id: string) => ApprovalWorkflow | undefined
  clearWorkflows: () => void
  loading: boolean
  error: string | null
}

const WorkflowsContext = createContext<WorkflowsContextType | undefined>(undefined)

interface WorkflowsProviderProps {
  children: ReactNode
}

import { API_CONFIG } from '@/lib/config'

export function WorkflowsProvider({ children }: WorkflowsProviderProps) {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch workflows from API
  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_CONFIG.BASE_URL}/workflows`)
      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.statusText}`)
      }
      const data = await response.json()
      setWorkflows(data)
    } catch (err) {
      console.error('Error fetching workflows:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch workflows')
    } finally {
      setLoading(false)
    }
  }

  // Create workflow via API
  const createWorkflow = async (workflowData: Partial<ApprovalWorkflow>): Promise<ApprovalWorkflow> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      })

      if (!response.ok) {
        throw new Error(`Failed to create workflow: ${response.statusText}`)
      }

      const newWorkflow = await response.json()
      
      // Update local state
      setWorkflows(prev => [...prev, newWorkflow])
      
      return newWorkflow
    } catch (err) {
      console.error('Error creating workflow:', err)
      setError(err instanceof Error ? err.message : 'Failed to create workflow')
      throw err
    }
  }

  // Update workflow via API
  const updateWorkflow = async (id: string, updateData: Partial<ApprovalWorkflow>): Promise<void> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/workflows/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error(`Failed to update workflow: ${response.statusText}`)
      }

      const updatedWorkflow = await response.json()
      
      // Update local state
      setWorkflows(prev => prev.map(w => w.id === id ? updatedWorkflow : w))
    } catch (err) {
      console.error('Error updating workflow:', err)
      setError(err instanceof Error ? err.message : 'Failed to update workflow')
      throw err
    }
  }

  // Delete workflow via API
  const deleteWorkflow = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/workflows/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete workflow: ${response.statusText}`)
      }

      // Update local state
      setWorkflows(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      console.error('Error deleting workflow:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete workflow')
      throw err
    }
  }

  // Get workflow by ID
  const getWorkflow = (id: string): ApprovalWorkflow | undefined => {
    return workflows.find(w => w.id === id)
  }

  // Clear all workflows
  const clearWorkflows = () => {
    setWorkflows([])
    setError(null)
  }

  // Initialize data on mount
  useEffect(() => {
    fetchWorkflows()
  }, [])

  const value: WorkflowsContextType = {
    workflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    getWorkflow,
    clearWorkflows,
    loading,
    error,
  }

  return (
    <WorkflowsContext.Provider value={value}>
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