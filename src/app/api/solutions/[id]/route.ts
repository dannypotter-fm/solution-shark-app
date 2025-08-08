import { NextRequest, NextResponse } from 'next/server'
import { queryObjects, executeQuery } from '@/database/connection'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      WHERE s.id = $1
    `, [params.id])

    if (solutions.length === 0) {
      return NextResponse.json(
        { error: 'Solution not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(solutions[0])
  } catch (error) {
    console.error('Error fetching solution:', error)
    return NextResponse.json(
      { error: 'Failed to fetch solution' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Get default admin user for now (in real app, get from auth context)
    const adminUser = await queryObjects('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin'])
    const adminId = adminUser[0]?.id

    const sql = `
      UPDATE solutions 
      SET 
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        customer = COALESCE($4, customer),
        opportunity = COALESCE($5, opportunity),
        estimated_value = COALESCE($6, estimated_value),
        amount = COALESCE($7, amount),
        currency = COALESCE($8, currency),
        stage = COALESCE($9, stage),
        project_type = COALESCE($10, project_type),
        last_modified_by = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `

    const parameters = [
      params.id,
      body.name,
      body.description,
      body.customer,
      body.opportunity,
      body.estimatedValue,
      body.amount,
      body.currency,
      body.stage,
      body.projectType,
      adminId,
    ]

    const updatedSolution = await queryObjects(sql, parameters)

    if (updatedSolution.length === 0) {
      return NextResponse.json(
        { error: 'Solution not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedSolution[0])
  } catch (error) {
    console.error('Error updating solution:', error)
    return NextResponse.json(
      { error: 'Failed to update solution' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First delete related approvals
    await executeQuery(
      'DELETE FROM approvals WHERE solution_id = $1',
      [params.id]
    )

    // Then delete the solution
    const result = await executeQuery(
      'DELETE FROM solutions WHERE id = $1',
      [params.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting solution:', error)
    return NextResponse.json(
      { error: 'Failed to delete solution' },
      { status: 500 }
    )
  }
} 