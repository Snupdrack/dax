import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await db.user.findFirst({ where: { sessionToken: token } })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    
    // Destructure to separate allow fields and prevent accidental updates of protected fields
    const { 
      name, 
      description, 
      estimatedTime, 
      price, 
      category, 
      sortOrder, 
      requiredFields,
      isActive 
    } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime
    if (price !== undefined) updateData.price = parseFloat(price)
    if (category !== undefined) updateData.category = category
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder)
    if (requiredFields !== undefined) updateData.requiredFields = requiredFields
    if (isActive !== undefined) updateData.isActive = isActive

    const service = await db.service.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Update service error:', error)
    return NextResponse.json({ error: 'Error al actualizar servicio' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await db.user.findFirst({ where: { sessionToken: token } })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await db.service.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Servicio eliminado' })
  } catch (error) {
    console.error('Delete service error:', error)
    return NextResponse.json({ error: 'Error al eliminar servicio' }, { status: 500 })
  }
}
