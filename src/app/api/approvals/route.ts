import { NextRequest, NextResponse } from 'next/server'
import { queryObjects } from '@/database/connection'

export async function GET() {
  try {
    const approvals = await queryObjects(`
      SELECT 
        a.id,
        a.solution_id as "solutionId",
        s.name as "solutionName",
        a.workflow_id as "workflowId",
        w.name as "workflowName",
        u.name as "requesterName",
        u.email as "requesterEmail",
        a.submitted_at as "submittedAt",
        a.status,
        a.current_step_order as "currentStepOrder",
        a.total_steps as "totalSteps",
        a.priority,
        a.notes,
        a.processed_at as "processedAt",
        a.processed_by as "processedBy"
      FROM approvals a
      JOIN solutions s ON a.solution_id = s.id
      JOIN approval_workflows w ON a.workflow_id = w.id
      JOIN users u ON a.requester_id = u.id
      ORDER BY a.submitted_at DESC
    `)

    return NextResponse.json(approvals)
  } catch (error) {
    console.error('Error fetching approvals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get default admin user for now (in real app, get from auth context)
    const adminUser = await queryObjects('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin'])
    const adminId = adminUser[0]?.id

    const sql = `
      INSERT INTO approvals (
        solution_id, workflow_id, requester_id, status, current_step_order, 
        total_steps, priority, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `

    const parameters = [
      body.solutionId,
      body.workflowId,
      adminId, // requester_id
      body.status || 'pending',
      body.currentStepOrder || 1,
      body.totalSteps || 1,
      body.priority || 'medium',
      body.notes || '',
    ]

    const newApproval = await queryObjects(sql, parameters)

    return NextResponse.json(newApproval[0], { status: 201 })
  } catch (error) {
    console.error('Error creating approval:', error)
    return NextResponse.json(
      { error: 'Failed to create approval' },
      { status: 500 }
    )
  }
} 