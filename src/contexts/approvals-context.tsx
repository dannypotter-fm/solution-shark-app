'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Solution } from '@/types/solution'
import { Approval, ApprovalHistory } from '@/types/approval'

interface ApprovalsContextType {
  solutions: Solution[]
  approvals: Approval[]
  approvalHistory: { [solutionId: string]: ApprovalHistory[] }
  createSolution: (solutionData: Partial<Solution>) => Promise<Solution>
  updateSolution: (id: string, updateData: Partial<Solution>) => Promise<void>
  deleteSolution: (id: string) => Promise<void>
  addApprovalHistory: (solutionId: string, history: ApprovalHistory) => Promise<void>
  updateSolutionStage: (solutionId: string, stage: Solution['stage'], previousStage?: string) => Promise<void>
  clearSolutions: () => void
  loading: boolean
  error: string | null
}

const ApprovalsContext = createContext<ApprovalsContextType | undefined>(undefined)

interface ApprovalsProviderProps {
  children: ReactNode
}

import { API_CONFIG } from '@/lib/config'

export function ApprovalsProvider({ children }: ApprovalsProviderProps) {
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [approvalHistory, setApprovalHistory] = useState<{ [solutionId: string]: ApprovalHistory[] }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch solutions from API
  const fetchSolutions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_CONFIG.BASE_URL}/solutions`)
      if (!response.ok) {
        throw new Error(`Failed to fetch solutions: ${response.statusText}`)
      }
      const data = await response.json()
      setSolutions(data)
    } catch (err) {
      console.error('Error fetching solutions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch solutions')
    } finally {
      setLoading(false)
    }
  }

  // Fetch approvals from API
  const fetchApprovals = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/approvals`)
      if (!response.ok) {
        throw new Error(`Failed to fetch approvals: ${response.statusText}`)
      }
      const data = await response.json()
      setApprovals(data)
    } catch (err) {
      console.error('Error fetching approvals:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch approvals')
    }
  }

  // Create solution via API
  const createSolution = async (solutionData: Partial<Solution>): Promise<Solution> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/solutions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(solutionData),
      })

      if (!response.ok) {
        throw new Error(`Failed to create solution: ${response.statusText}`)
      }

      const newSolution = await response.json()
      
      // Update local state
      setSolutions(prev => [...prev, newSolution])
      
      return newSolution
    } catch (err) {
      console.error('Error creating solution:', err)
      setError(err instanceof Error ? err.message : 'Failed to create solution')
      throw err
    }
  }

  // Update solution via API
  const updateSolution = async (id: string, updateData: Partial<Solution>): Promise<void> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/solutions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error(`Failed to update solution: ${response.statusText}`)
      }

      const updatedSolution = await response.json()
      
      // Update local state
      setSolutions(prev => prev.map(s => s.id === id ? updatedSolution : s))
    } catch (err) {
      console.error('Error updating solution:', err)
      setError(err instanceof Error ? err.message : 'Failed to update solution')
      throw err
    }
  }

  // Delete solution via API
  const deleteSolution = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/solutions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete solution: ${response.statusText}`)
      }

      // Update local state
      setSolutions(prev => prev.filter(s => s.id !== id))
      
      // Remove from approval history
      setApprovalHistory(prev => {
        const newHistory = { ...prev }
        delete newHistory[id]
        return newHistory
      })
    } catch (err) {
      console.error('Error deleting solution:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete solution')
      throw err
    }
  }

  // Add approval history via API
  const addApprovalHistory = async (solutionId: string, history: ApprovalHistory): Promise<void> => {
    try {
      // Create approval via API
      const approvalData = {
        solutionId,
        workflowId: history.workflowId,
        status: history.status,
        currentStepOrder: history.stepOrder,
        totalSteps: 1, // Default, should be updated based on workflow
        priority: 'medium',
        notes: '',
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/approvals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData),
      })

      if (!response.ok) {
        throw new Error(`Failed to create approval: ${response.statusText}`)
      }

      const newApproval = await response.json()
      
      // Update local state
      setApprovals(prev => [...prev, newApproval])
      setApprovalHistory(prev => ({
        ...prev,
        [solutionId]: [...(prev[solutionId] || []), history]
      }))
    } catch (err) {
      console.error('Error adding approval history:', err)
      setError(err instanceof Error ? err.message : 'Failed to add approval history')
      throw err
    }
  }

  // Update solution stage via API
  const updateSolutionStage = async (solutionId: string, stage: Solution['stage'], previousStage?: string): Promise<void> => {
    try {
      await updateSolution(solutionId, { stage })
    } catch (err) {
      console.error('Error updating solution stage:', err)
      setError(err instanceof Error ? err.message : 'Failed to update solution stage')
      throw err
    }
  }

  // Clear all data
  const clearSolutions = () => {
    setSolutions([])
    setApprovals([])
    setApprovalHistory({})
    setError(null)
  }

  // Initialize data on mount
  useEffect(() => {
    fetchSolutions()
    fetchApprovals()
  }, [])

  const value: ApprovalsContextType = {
    solutions,
    approvals,
    approvalHistory,
    createSolution,
    updateSolution,
    deleteSolution,
    addApprovalHistory,
    updateSolutionStage,
    clearSolutions,
    loading,
    error,
  }

  return (
    <ApprovalsContext.Provider value={value}>
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