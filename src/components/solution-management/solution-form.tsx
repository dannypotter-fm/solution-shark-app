"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Solution, CreateSolutionData, UpdateSolutionData, SolutionStage } from "@/types/solution"

interface SolutionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateSolutionData | UpdateSolutionData) => void
  solution?: Solution
  isLoading?: boolean
}

export function SolutionForm({ open, onOpenChange, onSubmit, solution, isLoading = false }: SolutionFormProps) {
  const [formData, setFormData] = useState({
    name: solution?.name || "",
    opportunity: solution?.opportunity || "",
    stage: solution?.stage || "draft" as SolutionStage,
    description: solution?.description || "",
    estimatedValue: solution?.estimatedValue?.toString() || "",
    customer: solution?.customer || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
    }
    onSubmit(data)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{solution ? "Edit Solution" : "Create New Solution"}</DialogTitle>
          <DialogDescription>
            {solution ? "Update the solution details below." : "Fill in the solution details below."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Solution Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter solution name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="opportunity">Opportunity</Label>
              <Input
                id="opportunity"
                value={formData.opportunity}
                onChange={(e) => handleInputChange("opportunity", e.target.value)}
                placeholder="Enter opportunity name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stage">Stage</Label>
              <Select value={formData.stage} onValueChange={(value: SolutionStage) => handleInputChange("stage", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer</Label>
              <Input
                id="customer"
                value={formData.customer}
                onChange={(e) => handleInputChange("customer", e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
              <Input
                id="estimatedValue"
                type="number"
                value={formData.estimatedValue}
                onChange={(e) => handleInputChange("estimatedValue", e.target.value)}
                placeholder="Enter estimated value"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter solution description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : solution ? "Update Solution" : "Create Solution"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 