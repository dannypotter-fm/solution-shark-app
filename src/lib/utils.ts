import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Counter to ensure unique IDs even within the same millisecond
let approvalCounter = 0

/**
 * Generates a unique approval ID to prevent React key conflicts
 * @param workflowId - The ID of the workflow
 * @param index - Optional index for multiple approvals in the same request
 * @returns A unique approval ID string
 */
export function generateApprovalId(workflowId: string, index?: number): string {
  const timestamp = Date.now()
  const counter = ++approvalCounter // Increment counter for uniqueness
  const randomSuffix = Math.random().toString(36).substr(2, 9)
  const indexSuffix = index !== undefined ? `_${index}` : ''
  return `approval_${timestamp}_${workflowId}${indexSuffix}_${counter}_${randomSuffix}`
}
