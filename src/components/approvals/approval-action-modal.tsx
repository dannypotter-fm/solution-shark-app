"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface ApprovalActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (action: 'approved' | 'rejected', notes: string) => void
  action: 'approve' | 'reject' | null
  approval: {
    id: string
    solutionName: string
    workflowName: string
    currentStep: string
    requesterName: string
  } | null
}

export function ApprovalActionModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  approval
}: ApprovalActionModalProps) {
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!action || !approval) return
    
    setIsSubmitting(true)
    
    try {
      await onConfirm(action === 'approve' ? 'approved' : 'rejected', notes)
      setNotes("")
      onClose()
    } catch (error) {
      console.error('Error processing approval action:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setNotes("")
    onClose()
  }

  if (!approval || !action) return null

  const isApprove = action === 'approve'
  const icon = isApprove ? <CheckCircle className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-red-500" />
  const title = isApprove ? 'Approve Request' : 'Reject Request'
  const description = isApprove 
    ? 'You are about to approve this request. This will move the solution to the next approval step or mark it as approved if this is the final step.'
    : 'You are about to reject this request. This will stop the approval process and reset the solution to its previous state.'

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request Details */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-sm">Solution:</span>
              <span className="text-sm text-muted-foreground">{approval.solutionName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-sm">Workflow:</span>
              <span className="text-sm text-muted-foreground">{approval.workflowName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-sm">Current Step:</span>
              <span className="text-sm text-muted-foreground">{approval.currentStep}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-sm">Requested By:</span>
              <span className="text-sm text-muted-foreground">{approval.requesterName}</span>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="approval-notes">
              {isApprove ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
            </Label>
            <Textarea
              id="approval-notes"
              placeholder={isApprove 
                ? "Add any comments or conditions for this approval..."
                : "Please provide a reason for rejection..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className={!isApprove && !notes ? "border-red-300" : ""}
            />
            {!isApprove && !notes && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Rejection reason is required
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!isApprove && !notes.trim())}
            variant={isApprove ? "default" : "destructive"}
          >
            {isSubmitting ? "Processing..." : (isApprove ? "Approve" : "Reject")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}