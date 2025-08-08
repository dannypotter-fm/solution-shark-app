import { NextRequest, NextResponse } from 'next/server'
import { queryObjects } from '@/database/connection'

export async function GET() {
  try {
    const workflows = await queryObjects(`
      SELECT 
        w.id,
        w.name,
        w.description,
        w.is_required as "isRequired",
        w.is_active as "isActive",
        w.created_at as "createdAt",
        w.updated_at as "updatedAt",
        w.created_by as "createdBy"
      FROM approval_workflows w
      ORDER BY w.created_at DESC
    `)

    return NextResponse.json(workflows)
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
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
      INSERT INTO approval_workflows (
        name, description, is_required, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `

    const parameters = [
      body.name,
      body.description || '',
      body.isRequired || false,
      body.isActive !== false, // Default to true
      adminId,
    ]

    const newWorkflow = await queryObjects(sql, parameters)

    return NextResponse.json(newWorkflow[0], { status: 201 })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
} 