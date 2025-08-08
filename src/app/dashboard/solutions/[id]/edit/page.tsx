'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppSidebar } from '@/components/app-sidebar'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { useApprovals } from '@/contexts/approvals-context'
import { ArrowLeft, Save } from 'lucide-react'
import { Solution } from '@/types/solution'

export default function EditSolutionPage() {
  const router = useRouter()
  const params = useParams()
  const { solutions, updateSolution, loading, error } = useApprovals()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customer: '',
    opportunity: '',
    estimatedValue: '',
    currency: 'USD',
    projectType: '',
    stage: 'draft' as Solution['stage']
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [foundSolution, setFoundSolution] = useState<Solution | null>(null)

  // Find the solution to edit
  useEffect(() => {
    if (params?.id && solutions.length > 0) {
      const solution = solutions.find(s => s.id === params.id)
      if (solution) {
        setFoundSolution(solution)
        setFormData({
          name: solution.name || '',
          description: solution.description || '',
          customer: solution.customer || '',
          opportunity: solution.opportunity || '',
          estimatedValue: solution.estimatedValue?.toString() || '',
          currency: solution.currency || 'USD',
          projectType: solution.projectType || '',
          stage: solution.stage || 'draft'
        })
      }
    }
  }, [params?.id, solutions])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!foundSolution) {
      alert('Solution not found')
      return
    }

    if (!formData.name.trim()) {
      alert('Please enter a solution name')
      return
    }

    try {
      setIsSubmitting(true)
      
      const updateData = {
        name: formData.name,
        description: formData.description,
        customer: formData.customer,
        opportunity: formData.opportunity,
        estimatedValue: parseFloat(formData.estimatedValue) || 0,
        currency: formData.currency,
        projectType: formData.projectType,
        stage: formData.stage,
      }

      await updateSolution(foundSolution.id, updateData)
      
      // Navigate back to the solution view
      router.push(`/dashboard/solutions/${foundSolution.id}`)
    } catch (err) {
      console.error('Error updating solution:', err)
      alert('Failed to update solution. Please try again.')
    } finally {
      setIsSubmitting(false)
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

  if (!foundSolution) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Solution not found</h2>
            <p className="mt-2 text-gray-600">The solution you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboard/solutions')} className="mt-4">
              Back to Solutions
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
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
                      <BreadcrumbLink href={`/dashboard/solutions/${foundSolution.id}`}>
                        {foundSolution.name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Edit</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-2xl font-semibold text-gray-900 mt-1">Edit Solution</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || loading}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Solution Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Solution Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter solution name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer">Customer</Label>
                      <Input
                        id="customer"
                        value={formData.customer}
                        onChange={(e) => handleInputChange('customer', e.target.value)}
                        placeholder="Enter customer name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="opportunity">Opportunity</Label>
                      <Input
                        id="opportunity"
                        value={formData.opportunity}
                        onChange={(e) => handleInputChange('opportunity', e.target.value)}
                        placeholder="Enter opportunity name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectType">Project Type</Label>
                      <Select
                        value={formData.projectType}
                        onValueChange={(value) => handleInputChange('projectType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Implementation">Implementation</SelectItem>
                          <SelectItem value="Consulting">Consulting</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                          <SelectItem value="Training">Training</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimatedValue">Estimated Value</Label>
                      <Input
                        id="estimatedValue"
                        type="number"
                        value={formData.estimatedValue}
                        onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => handleInputChange('currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stage">Stage</Label>
                      <Select
                        value={formData.stage}
                        onValueChange={(value) => handleInputChange('stage', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="review">In Review</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter solution description"
                      rows={4}
                    />
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 