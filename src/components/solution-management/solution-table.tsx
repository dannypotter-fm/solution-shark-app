"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Edit, Archive, MoreHorizontal, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Solution, SolutionFilters } from "@/types/solution"

interface SolutionTableProps {
  solutions: Solution[]
  onArchive: (id: string) => void
  filters: SolutionFilters
  onFilterChange: (key: keyof SolutionFilters, value: string | boolean | undefined) => void
}

const stages = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" }
]

const getStageIcon = (stage: string) => {
  switch (stage) {
    case "draft":
      return "📝"
    case "review":
      return "👀"
    case "approved":
      return "✅"
    case "rejected":
      return "❌"
    default:
      return "📄"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return "🟢"
    case "archived":
      return "🔴"
    default:
      return "⚪"
  }
}

export function SolutionTable({ solutions, onArchive, filters, onFilterChange }: SolutionTableProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("active")

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    onFilterChange("status", value === "all" ? "" : value)
  }

  const handleStageFilterChange = (value: string) => {
    onFilterChange("stage", value === "all" ? "" : value)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search solutions..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filters.stage || "all"} onValueChange={handleStageFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map((stage) => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="all" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
            All Solutions
          </TabsTrigger>
          <TabsTrigger value="active" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
            Active
          </TabsTrigger>
          <TabsTrigger value="archived" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
            Archived
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Estimated Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solutions.map((solution) => (
                  <TableRow 
                    key={solution.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push(`/dashboard/solutions/${solution.id}`)}
                  >
                    <TableCell className="font-medium">{solution.name}</TableCell>
                    <TableCell>{solution.opportunity}</TableCell>
                    <TableCell>{solution.customer}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <span>{getStageIcon(solution.stage)}</span>
                        {stages.find(s => s.value === solution.stage)?.label || solution.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>${solution.estimatedValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <span>{getStatusIcon(solution.status)}</span>
                        {solution.status?.charAt(0)?.toUpperCase() + solution.status?.slice(1) || solution.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(solution.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{solution.createdBy}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/solutions/${solution.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onArchive(solution.id)}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 