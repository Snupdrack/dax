import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Public endpoint - anyone can view active services
    const services = await db.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
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
    const { name, description, estimatedTime, price, category, sortOrder, requiredFields } = body

    if (!name || !estimatedTime || price === undefined) {
      return NextResponse.json({ error: 'Nombre, tiempo estimado y precio son obligatorios' }, { status: 400 })
    }

    const service = await db.service.create({
      data: {
        name,
        description: description || null,
        estimatedTime,
        price: parseFloat(price),
        category: category || 'general',
        sortOrder: parseInt(sortOrder) || 0,
        requiredFields: requiredFields || null,
      },
    })

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Create service error:', error)
    return NextResponse.json({ error: 'Error al crear servicio' }, { status: 500 })
  }
}
