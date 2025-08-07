"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Shield, 
  Users, 
  Clock,
  Eye,
  Settings,
  FileText
} from "lucide-react"
import { ApprovalWorkflow } from "@/types/approval"
import { Solution } from "@/types/solution"
import { useWorkflows } from "@/contexts/workflows-context"

interface ApprovalSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  solution: Solution
  onApprovalSubmit: (selectedWorkflows: ApprovalWorkflow[]) => void
}

export function ApprovalSelectionModal({ 
  isOpen, 
  onClose, 
  solution, 
  onApprovalSubmit 
}: ApprovalSelectionModalProps) {
  const { workflows } = useWorkflows()
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([])
  const [requiredWorkflows, setRequiredWorkflows] = useState<ApprovalWorkflow[]>([])
  const [optionalWorkflows, setOptionalWorkflows] = useState<ApprovalWorkflow[]>([])

  useEffect(() => {
    if (!isOpen) return

    // Filter workflows based on solution criteria
    const matchingWorkflows = workflows.filter(workflow => {
      if (!workflow.isActive || workflow.isArchived) return false
      
      // Check if workflow conditions match the solution
      if (workflow.conditionRules && workflow.conditionRules.length > 0) {
        return workflow.conditionRules.every(rule => {
          switch (rule.field) {
            case "projectType":
              // Check if the solution has any of the project types that match the rule
              // For now, we'll use a mock project types array - in real app this would come from solution data
              const solutionProjectTypes = ["Consulting", "Implementation"] // Mock data - should come from solution.projectTypes
              return solutionProjectTypes.includes(rule.value)
            case "budget":
              return solution.estimatedValue >= parseInt(rule.value)
            case "priority":
              return solution.stage === "review" || solution.stage === "approved"
            case "department":
              return true // Default to true for now
            case "category":
              return true // Default to true for now
            case "status":
              return solution.status === rule.value
            default:
              return true
          }
        })
      }
      
      return true // If no conditions, include all active workflows
    })

    // Separate required and optional workflows
    const required = matchingWorkflows.filter(w => w.isRequired)
    const optional = matchingWorkflows.filter(w => !w.isRequired)

    setRequiredWorkflows(required)
    setOptionalWorkflows(optional)
    
    // Auto-select required workflows
    setSelectedWorkflows(required.map(w => w.id))
  }, [isOpen, workflows, solution.id, solution.estimatedValue, solution.stage, solution.status])

  const handleWorkflowToggle = (workflowId: string) => {
    setSelectedWorkflows(prev => 
      prev.includes(workflowId) 
        ? prev.filter(id => id !== workflowId)
        : [...prev, workflowId]
    )
  }

  const handleSubmit = () => {
    const selected = workflows.filter(w => selectedWorkflows.includes(w.id))
    onApprovalSubmit(selected)
    onClose()
  }

  const getStatusIcon = (workflow: ApprovalWorkflow) => {
    if (workflow.isArchived) return <AlertCircle className="h-4 w-4 text-red-600" />
    if (workflow.isActive) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <Clock className="h-4 w-4 text-gray-600" />
  }

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case "review": return Eye
      case "approve": return CheckCircle
      case "sign_off": return Shield
      case "technical_review": return Settings
      case "business_review": return Users
      case "legal_review": return Shield
      case "finance_review": return FileText
      default: return Clock
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[800px] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Select Approval Workflows</h3>
            <p className="text-muted-foreground">Choose which approval processes to apply to this solution</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Required Approvals Section */}
          {requiredWorkflows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Required Approvals
                  <Badge variant="destructive" className="ml-2">Required</Badge>
                </CardTitle>
                <CardDescription>
                  These approval workflows are mandatory based on your solution criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {requiredWorkflows.map((workflow) => (
                  <div key={workflow.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Checkbox 
                      checked={selectedWorkflows.includes(workflow.id)}
                      onCheckedChange={() => handleWorkflowToggle(workflow.id)}
                      disabled
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{workflow.name}</h4>
                        {getStatusIcon(workflow)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{workflow.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {workflow.steps.length} steps
                        </Badge>
                        {workflow.conditionRules && workflow.conditionRules.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {workflow.conditionRules.length} conditions
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {workflow.steps.slice(0, 3).map((step) => {
                          const Icon = getStepIcon(step.type)
                          return (
                            <Badge key={step.id} variant="outline" className="text-xs">
                              <Icon className="h-3 w-3 mr-1" />
                              {step.name}
                            </Badge>
                          )
                        })}
                        {workflow.steps.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{workflow.steps.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Optional Approvals Section */}
          {optionalWorkflows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Optional Approvals
                  <Badge variant="secondary" className="ml-2">Optional</Badge>
                </CardTitle>
                <CardDescription>
                  These approval workflows are available but not required for your solution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {optionalWorkflows.map((workflow) => (
                  <div key={workflow.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Checkbox 
                      checked={selectedWorkflows.includes(workflow.id)}
                      onCheckedChange={() => handleWorkflowToggle(workflow.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{workflow.name}</h4>
                        {getStatusIcon(workflow)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{workflow.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {workflow.steps.length} steps
                        </Badge>
                        {workflow.conditionRules && workflow.conditionRules.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {workflow.conditionRules.length} conditions
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {workflow.steps.slice(0, 3).map((step) => {
                          const Icon = getStepIcon(step.type)
                          return (
                            <Badge key={step.id} variant="outline" className="text-xs">
                              <Icon className="h-3 w-3 mr-1" />
                              {step.name}
                            </Badge>
                          )
                        })}
                        {workflow.steps.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{workflow.steps.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {requiredWorkflows.length === 0 && optionalWorkflows.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Matching Workflows</h3>
              <p className="text-muted-foreground">
                No approval workflows match the criteria for this solution.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={selectedWorkflows.length === 0}
          >
            Submit for Approval ({selectedWorkflows.length})
          </Button>
        </div>
      </div>
    </div>
  )
} 