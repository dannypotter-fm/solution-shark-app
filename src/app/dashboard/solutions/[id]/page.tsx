'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { useApprovals } from '@/contexts/approvals-context'
import { ApprovalSelectionModal } from '@/components/solutions/approval-selection-modal'
import { ArrowLeft, Edit, CheckCircle, Clock, AlertCircle, Check, X } from 'lucide-react'
import { Solution } from '@/types/solution'
import { ApprovalWorkflow } from '@/types/approval'
import { generateApprovalId } from '@/lib/utils'
import { Label } from '@/components/ui/label'

export default function SolutionPage() {
  const router = useRouter()
  const params = useParams()
  const { solutions, addApprovalHistory, updateSolutionStage, loading, error } = useApprovals()
  
  const [solution, setSolution] = useState<Solution | null>(null)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false)
  const [submittedWorkflows, setSubmittedWorkflows] = useState<Set<string>>(new Set())

  // Find the solution to display
  useEffect(() => {
    if (params?.id && solutions.length > 0) {
      const foundSolution = solutions.find(s => s.id === params.id)
      if (foundSolution) {
        setSolution(foundSolution)
      }
    }
  }, [params?.id, solutions])

  const handleApprovalSubmit = async (selectedWorkflows: ApprovalWorkflow[]) => {
    if (!solution || isSubmittingApproval) return
    
    setIsSubmittingApproval(true)
    
    console.log('Submitting approvals for solution:', solution.id)
    console.log('Selected workflows:', selectedWorkflows)
    
    // Track submitted workflows to prevent duplicates
    const newWorkflows = selectedWorkflows.filter(workflow => !submittedWorkflows.has(workflow.id))
    
    if (newWorkflows.length === 0) {
      console.log('All selected workflows have already been submitted')
      setIsSubmittingApproval(false)
      return
    }
    
    try {
      // Add new approval entries to history through context
      for (const workflow of newWorkflows) {
        // Generate unique ID using utility function to prevent React key conflicts
        const uniqueId = generateApprovalId(workflow.id, newWorkflows.indexOf(workflow))
        
        const historyEntry = {
          id: uniqueId,
          workflowId: workflow.id,
          workflowName: workflow.name,
          status: 'pending' as const,
          submittedAt: new Date(),
          submittedBy: 'Current User', // In real app, get from auth context
          currentStep: workflow.steps?.[0]?.name || 'Initial Review',
          stepOrder: 1
        }
        console.log('Creating approval history entry:', historyEntry)
        await addApprovalHistory(solution.id, historyEntry)
      }
      
      // Update submitted workflows tracking
      setSubmittedWorkflows(prev => new Set([...prev, ...newWorkflows.map(w => w.id)]))

      // Update solution stage to 'review' when submitting for approval
      await updateSolutionStage(solution.id, 'review', solution.stage)
      
      console.log('Approval submission complete')
    } catch (err) {
      console.error('Error submitting approvals:', err)
      alert('Failed to submit approvals. Please try again.')
    } finally {
      // Reset submission state after a short delay
      setTimeout(() => {
        setIsSubmittingApproval(false)
      }, 1000)
    }
  }

  const getStatusIcon = (stage: string) => {
    switch (stage) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'review':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'rejected':
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (stage: string) => {
    switch (stage) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'review':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading solution...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!solution) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Solution not found</h2>
            <p className="mt-2 text-gray-600">The solution you&apos;re looking for doesn&apos;t exist.</p>
            <Button onClick={() => router.push('/dashboard/solutions')} className="mt-4">
              Back to Solutions
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard/solutions">Solutions</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{solution.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <div className="flex items-center space-x-3 mt-1">
                  <h1 className="text-2xl font-semibold text-gray-900">{solution.name}</h1>
                  <Badge className={getStatusColor(solution.stage)}>
                    {getStatusIcon(solution.stage)}
                    <span className="ml-1 capitalize">{solution.stage}</span>
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/solutions/${solution.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                className="w-full" 
                onClick={() => setIsApprovalModalOpen(true)}
                disabled={solution.stage === 'approved' || isSubmittingApproval}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {solution.stage === 'approved' 
                  ? 'Already Approved' 
                  : isSubmittingApproval 
                  ? 'Submitting...' 
                  : 'Submit for Approval'
                }
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Solution Details */}
            <Card>
              <CardHeader>
                <CardTitle>Solution Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Customer</Label>
                    <p className="text-gray-900">{solution.customer || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Opportunity</Label>
                    <p className="text-gray-900">{solution.opportunity || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Project Type</Label>
                    <p className="text-gray-900">{solution.projectType || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Estimated Value</Label>
                    <p className="text-gray-900">
                      {solution.currency} {solution.estimatedValue?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                
                {solution.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                    <p className="text-gray-900 mt-1">{solution.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(solution.stage)}
                  <span className="text-lg font-medium capitalize">{solution.stage}</span>
                </div>
                <p className="text-gray-600 mt-2">
                  {solution.stage === 'draft' && 'This solution is in draft mode and ready for review.'}
                  {solution.stage === 'review' && 'This solution is currently under review.'}
                  {solution.stage === 'approved' && 'This solution has been approved.'}
                  {solution.stage === 'rejected' && 'This solution was rejected and needs to be updated.'}
                </p>
              </CardContent>
            </Card>

            {/* Approval History */}
            <Card>
              <CardHeader>
                <CardTitle>Approval History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* This would be populated from the approval history */}
                  <p className="text-gray-600">No approval history yet.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        </div>
      </div>

      {/* Approval Selection Modal */}
      <ApprovalSelectionModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onApprovalSubmit={handleApprovalSubmit}
        solution={solution}
      />
    </SidebarProvider>
  )
} 