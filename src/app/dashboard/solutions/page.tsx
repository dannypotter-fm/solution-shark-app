"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SolutionTable } from "@/components/solution-management/solution-table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Plus } from "lucide-react"
import { Solution, SolutionFilters } from "@/types/solution"
import { useApprovals } from "@/contexts/approvals-context"

// Mock data
const mockSolutions: Solution[] = [
  {
    id: "1",
    name: "Enterprise Cloud Migration",
    opportunity: "Cloud Infrastructure Upgrade",
    customer: "TechCorp Inc.",
    stage: "draft",
    owner: "1",
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
    stage: "review",
    owner: "2",
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
    owner: "3",
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
    owner: "4",
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

function SolutionsContent(): React.JSX.Element {
  const { solutions: contextSolutions, createSolution } = useApprovals()
  const [filteredSolutions, setFilteredSolutions] = useState<Solution[]>([])
  const [filters, setFilters] = useState<SolutionFilters>({
    search: "",
    stage: undefined,
    status: "active"
  })
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Use context solutions if available, otherwise fall back to mock data
    const solutionsToUse = contextSolutions.length > 0 ? contextSolutions : mockSolutions
    
    setFilteredSolutions(solutionsToUse)
    setIsInitialized(true)
  }, [contextSolutions])

  const handleCreateSolution = (data: Partial<Solution>) => {
    // Note: In a real app, this would add to the context
    // For now, we'll just redirect to the create page
    router.push("/dashboard/solutions/create")
  }

  const handleArchiveSolution = (id: string) => {
    // Note: In a real app, this would update the context
    // For now, we'll just update the filtered solutions
    setFilteredSolutions(prev => prev.map(s => s.id === id ? { ...s, status: "archived" } : s))
  }

  const handleFilterChange = (key: keyof SolutionFilters, value: string | boolean | undefined) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Use context solutions if available, otherwise fall back to mock data
    const solutionsToUse = contextSolutions.length > 0 ? contextSolutions : mockSolutions
    
    let filtered = solutionsToUse
    
    if (newFilters.status) {
      filtered = filtered.filter(s => s.status === newFilters.status)
    }
    
    if (newFilters.stage) {
      filtered = filtered.filter(s => s.stage === newFilters.stage)
    }
    
    if (newFilters.search) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(newFilters.search!.toLowerCase()) ||
        s.opportunity.toLowerCase().includes(newFilters.search!.toLowerCase()) ||
        s.customer.toLowerCase().includes(newFilters.search!.toLowerCase())
      )
    }
    
    setFilteredSolutions(filtered)
  }

  // Remove loading state check - always render the page

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
                <BreadcrumbLink href="/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Solutions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Solutions</h1>
              <p className="text-muted-foreground">
                Manage your solution documents
              </p>
            </div>
            <Button onClick={() => router.push("/dashboard/solutions/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Solution
            </Button>
          </div>

          <div className="space-y-4">
            <SolutionTable 
              solutions={filteredSolutions}
              onArchive={handleArchiveSolution}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function SolutionsPage(): React.JSX.Element {
  return <SolutionsContent />
}