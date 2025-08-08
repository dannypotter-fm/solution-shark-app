import { NextRequest, NextResponse } from 'next/server'
import { executeQuery, queryObjects } from '@/database/connection'

export async function GET() {
  try {
    const solutions = await queryObjects(`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.customer,
        s.opportunity,
        s.estimated_value as "estimatedValue",
        s.amount,
        s.currency,
        s.stage,
        s.owner_id as "ownerId",
        s.project_type as "projectType",
        s.created_at as "createdAt",
        s.updated_at as "updatedAt",
        s.created_by as "createdBy",
        s.last_modified_by as "lastModifiedBy"
      FROM solutions s
      ORDER BY s.created_at DESC
    `)

    return NextResponse.json(solutions)
  } catch (error) {
    console.error('Error fetching solutions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch solutions' },
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
      INSERT INTO solutions (
        name, description, customer, opportunity, estimated_value, amount, currency, 
        stage, owner_id, project_type, created_by, last_modified_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `

    const parameters = [
      body.name,
      body.description || '',
      body.customer || '',
      body.opportunity || '',
      body.estimatedValue || 0,
      body.amount || body.estimatedValue || 0,
      body.currency || 'USD',
      body.stage || 'draft',
      adminId || body.ownerId,
      body.projectType || '',
      adminId,
      adminId,
    ]

    const newSolution = await queryObjects(sql, parameters)

    return NextResponse.json(newSolution[0], { status: 201 })
  } catch (error) {
    console.error('Error creating solution:', error)
    return NextResponse.json(
      { error: 'Failed to create solution' },
      { status: 500 }
    )
  }
} 