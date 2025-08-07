"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Solution, UpdateSolutionData, SolutionStage } from "@/types/solution"
import { ArrowLeft, Save, X } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useApprovals } from "@/contexts/approvals-context"

export default function EditSolutionPage() {
  const router = useRouter()
  const params = useParams()
  const solutionId = params.id as string
  const { solutions, updateSolution } = useApprovals()
  
  const [solution, setSolution] = useState<Solution | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    opportunity: "",
    stage: "draft" as SolutionStage,
    description: "",
    estimatedValue: "",
    customer: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Find the solution by ID from the global context
    const foundSolution = solutions.find(s => s.id === solutionId)
    if (foundSolution) {
      setSolution(foundSolution)
      setFormData({
        name: foundSolution.name,
        opportunity: foundSolution.opportunity,
        stage: foundSolution.stage,
        description: foundSolution.description || "",
        estimatedValue: foundSolution.estimatedValue?.toString() || "",
        customer: foundSolution.customer || "",
      })
    }
    setIsInitialized(true)
  }, [solutionId, solutions])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const updateData: UpdateSolutionData = {
      ...formData,
      estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
    }
    
    // Update the solution in the global context
    if (solution) {
      updateSolution(solution.id, updateData)
    }
    
    console.log("Updating solution:", updateData)
    
    setIsLoading(false)
    router.push("/dashboard/solutions")
  }

  const handleCancel = () => {
    router.push("/dashboard/solutions")
  }

  if (!isInitialized) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-[68px] shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard/solutions">
                    Solutions
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Edit Solution</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading solution...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!solution) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-[68px] shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard/solutions">
                    Solutions
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Edit Solution</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Solution not found</p>
              <Button onClick={() => router.push("/dashboard/solutions")} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Solutions
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-[68px] shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/solutions">
                  Solutions
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit Solution</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Solution</h1>
                <p className="text-muted-foreground">
                  Update the solution details below.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Solution Details</CardTitle>
                <CardDescription>
                  Update the solution information. All fields marked with * are required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Solution Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter solution name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="opportunity">Opportunity *</Label>
                      <Input
                        id="opportunity"
                        value={formData.opportunity}
                        onChange={(e) => handleInputChange("opportunity", e.target.value)}
                        placeholder="Enter opportunity name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stage">Stage *</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="customer">Customer Name</Label>
                      <Input
                        id="customer"
                        value={formData.customer}
                        onChange={(e) => handleInputChange("customer", e.target.value)}
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
                      <Input
                        id="estimatedValue"
                        type="number"
                        value={formData.estimatedValue}
                        onChange={(e) => handleInputChange("estimatedValue", e.target.value)}
                        placeholder="Enter estimated value"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Enter solution description"
                      rows={4}
                    />
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 