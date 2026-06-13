'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { RequiredFieldsEditor } from '@/components/RequiredFieldsEditor'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, FileText, Wallet, ShoppingCart, User, Users, Settings, LogOut, Menu, X,
  Search, Plus, Check, Ban, Clock, DollarSign, TrendingUp, Package, AlertCircle,
  ChevronRight, RefreshCw, Upload, Eye, Edit, Trash2, ArrowLeft, CreditCard,
  Banknote, Phone, Mail, Shield, ChevronDown, MessageCircle, Download, FileCheck, Loader2
} from 'lucide-react'

// ==================== TYPES ====================
interface Service {
  id: string
  name: string
  description?: string
  estimatedTime: string
  price: number
  category: string
  isActive: boolean
  sortOrder: number
  requiredFields?: string
}

interface UserInfo {
  id: string
  email: string
  name: string
  phone?: string
  role: string
  balance: number
}

interface Transaction {
  id: string
  userId: string
  type: string
  amount: number
  status: string
  reference?: string
  receiptUrl?: string
  notes?: string
  adminNotes?: string
  createdAt: string
  user?: { id: string; name: string; email: string }
}

interface Order {
  id: string
  userId: string
  serviceId: string
  status: string
  totalPrice: number
  notes?: string
  fieldValues?: string
  adminNotes?: string
  resultData?: string
  createdAt: string
  user?: { id: string; name: string; email: string }
  service?: { id: string; name: string; category: string; estimatedTime?: string }
}

interface AdminUser {
  id: string
  email: string
  name: string
  phone?: string
  balance: number
  isActive: boolean
  createdAt: string
  _count: { orders: number; transactions: number }
}

// ==================== API HELPERS ====================
const API_BASE = '/api'

async function apiFetch(path: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('dax_token') : null
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud')
  return data
}

async function apiUpload(file: File) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('dax_token') : null
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al subir archivo')
  return data
}

// ==================== CATEGORY HELPERS ====================
const CATEGORY_LABELS: Record<string, string> = {
  actas: 'Actas',
  rfc: 'RFC',
  sat: 'SAT',
  credito: 'Buró de Crédito',
  imss: 'IMSS',
  infonavit: 'Infonavit',
  servicios: 'Servicios',
  general: 'General',
}

const CATEGORY_COLORS: Record<string, string> = {
  actas: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rfc: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  sat: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  credito: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  imss: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  infonavit: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  servicios: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  general: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  in_progress: 'En Proceso',
  completed: 'Exitoso',
  rejected: 'Rechazado',
  cancelled: 'Cancelado / Reembolso',
}

// ==================== SERVICE FIELDS ====================
interface FieldDef {
  key: string
  label: string
  type: 'text' | 'date' | 'email' | 'tel'
  required: boolean
  placeholder: string
}

const SERVICE_FIELDS: Record<string, FieldDef[]> = {
  'Acta de Nacimiento': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
  ],
  'Acta de Matrimonio': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
  ],
  'Acta de Divorcio': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
  ],
  'Acta de Defunción': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
  ],
  'RFC con IdCIF': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
    { key: 'nombreCompleto', label: 'Nombre completo', type: 'text', required: true, placeholder: 'Ej: Juan Pérez García' },
    { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date', required: true, placeholder: '' },
  ],
  'RFC con CURP': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
  ],
  'Localización de IdCIF CURP': [
    { key: 'nombreCompleto', label: 'Nombre completo', type: 'text', required: true, placeholder: 'Ej: Juan Pérez García' },
    { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date', required: true, placeholder: '' },
    { key: 'entidadFederativa', label: 'Entidad federativa de nacimiento', type: 'text', required: true, placeholder: 'Ej: Chiapas' },
  ],
  'Cita al SAT Primera Vez': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
    { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Ej: correo@ejemplo.com' },
    { key: 'telefono', label: 'Teléfono', type: 'tel', required: true, placeholder: 'Ej: 5512345678' },
  ],
  'Cita al SAT Primera Vez Express': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
    { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Ej: correo@ejemplo.com' },
    { key: 'telefono', label: 'Teléfono', type: 'tel', required: true, placeholder: 'Ej: 5512345678' },
  ],
  'Cita para la e.firma': [
    { key: 'rfc', label: 'RFC', type: 'text', required: true, placeholder: 'Ej: ABCD123456' },
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
    { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Ej: correo@ejemplo.com' },
  ],
  'Cambio de Lugar y Fecha de Emisión': [
    { key: 'rfc', label: 'RFC', type: 'text', required: true, placeholder: 'Ej: ABCD123456' },
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
  ],
  'Cita para Cambio de Domicilio': [
    { key: 'rfc', label: 'RFC', type: 'text', required: true, placeholder: 'Ej: ABCD123456' },
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
  ],
  'Corrección de Datos': [
    { key: 'rfc', label: 'RFC', type: 'text', required: true, placeholder: 'Ej: ABCD123456' },
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
  ],
  'Buró de Crédito': [
    { key: 'nombreCompleto', label: 'Nombre completo', type: 'text', required: true, placeholder: 'Ej: Juan Pérez García' },
    { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date', required: true, placeholder: '' },
    { key: 'rfcOCurp', label: 'RFC o CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456 o ABCD123456HDFRFA09' },
  ],
  'Buró de Crédito con Score': [
    { key: 'nombreCompleto', label: 'Nombre completo', type: 'text', required: true, placeholder: 'Ej: Juan Pérez García' },
    { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date', required: true, placeholder: '' },
    { key: 'rfcOCurp', label: 'RFC o CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456 o ABCD123456HDFRFA09' },
  ],
  'Semanas Cotizadas': [
    { key: 'nssOCurp', label: 'NSS o CURP', type: 'text', required: true, placeholder: 'Ej: 12345678901 o ABCD123456HDFRFA09' },
  ],
  'Semanas Cotizadas Detalladas': [
    { key: 'nssOCurp', label: 'NSS o CURP', type: 'text', required: true, placeholder: 'Ej: 12345678901 o ABCD123456HDFRFA09' },
  ],
  'NSS': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
    { key: 'nombreCompleto', label: 'Nombre completo', type: 'text', required: true, placeholder: 'Ej: Juan Pérez García' },
  ],
  'CFE': [
    { key: 'numeroServicio', label: 'Número de servicio', type: 'text', required: true, placeholder: 'Ej: 123456789' },
    { key: 'nombrePersona', label: 'Nombre de la persona', type: 'text', required: true, placeholder: 'Ej: Juan Pérez García' },
    { key: 'numeroMedidor', label: 'Número de medidor', type: 'text', required: true, placeholder: 'Ej: 12345678' },
  ],
  'Talón de Pago IMSS Activo y Jubilados': [
    { key: 'nss', label: 'NSS', type: 'text', required: true, placeholder: 'Ej: 12345678901' },
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
  ],
  'Talón de Pago Pensión ISSSTE': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
    { key: 'numeroPensionado', label: 'Número de pensionado', type: 'text', required: true, placeholder: 'Ej: 123456789' },
  ],
  'Desbloqueo de Cuenta Infonavit': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
    { key: 'nss', label: 'NSS', type: 'text', required: true, placeholder: 'Ej: 12345678901' },
  ],
  'Pre-calificación Crédito Infonavit': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
    { key: 'nss', label: 'NSS', type: 'text', required: true, placeholder: 'Ej: 12345678901' },
  ],
  'Recuperación de Clave Cuenta Infonavit': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
    { key: 'nss', label: 'NSS', type: 'text', required: true, placeholder: 'Ej: 12345678901' },
  ],
  'Registro de Cuenta Infonavit': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
    { key: 'nss', label: 'NSS', type: 'text', required: true, placeholder: 'Ej: 12345678901' },
  ],
  'Reporte Histórico Infonavit': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
    { key: 'nss', label: 'NSS', type: 'text', required: true, placeholder: 'Ej: 12345678901' },
  ],
  'Resumen de Movimientos Infonavit': [
    { key: 'curp', label: 'CURP', type: 'text', required: true, placeholder: 'Ej: ABCD123456HDFRFA09' },
    { key: 'nss', label: 'NSS', type: 'text', required: true, placeholder: 'Ej: 12345678901' },
  ],
}

// ==================== ANIMATION VARIANTS ====================
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: 'easeOut' },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
}

function getServiceFields(serviceName: string): FieldDef[] {
  return SERVICE_FIELDS[serviceName] || []
}

function formatFieldValues(fieldValuesJson: string | undefined): string {
  if (!fieldValuesJson) return ''
  try {
    const values = JSON.parse(fieldValuesJson) as Record<string, string>
    // Find the service name by matching field keys to SERVICE_FIELDS entries
    for (const [serviceName, fields] of Object.entries(SERVICE_FIELDS)) {
      const allKeysMatch = fields.every(f => f.key in values)
      if (allKeysMatch && Object.keys(values).length >= fields.length) {
        return fields.map(f => `${f.label}: ${values[f.key] || '-'}`).join('\n')
      }
    }
    // Fallback: just show key-value pairs
    return Object.entries(values).map(([k, v]) => `${k}: ${v}`).join('\n')
  } catch {
    return fieldValuesJson
  }
}

// ==================== WHATSAPP FLOATING BUTTON ====================
function WhatsAppFloatingButton({ mobileMenuOpen }: { mobileMenuOpen: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-16 right-0 bg-white text-gray-900 px-4 py-2 rounded-lg shadow-xl text-sm font-medium whitespace-nowrap animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          Soporte DAX
          <div className="absolute -bottom-1 right-6 w-2 h-2 bg-white rotate-45" />
        </div>
      )}
      <a
        href="https://wa.me/529613142550"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Contactar por WhatsApp - Soporte DAX"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white group-hover:animate-pulse">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  )
}

// ==================== MAIN APP ====================
type View = 'landing' | 'login' | 'register' | 'dashboard'

export default function DAXApp() {
  const [view, setView] = useState<View>('landing')
  const [user, setUser] = useState<UserInfo | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { toast } = useToast()

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('dax_token')
      const savedUser = localStorage.getItem('dax_user')
      if (token && savedUser) {
        try {
          const data = await apiFetch('/auth/me')
          setUser(data.user)
          setView('dashboard')
        } catch {
          localStorage.removeItem('dax_token')
          localStorage.removeItem('dax_user')
        }
      }
      setLoading(false)
    }
    checkSession()
  }, [])

  // Seed database on first load
  useEffect(() => {
    const seed = async () => {
      try {
        await fetch(`${API_BASE}/seed`, { method: 'POST' })
      } catch {
        // Ignore seed errors
      }
    }
    seed()
  }, [])

  // Load services
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await apiFetch('/services')
        if (!cancelled) setServices(data.services || [])
      } catch {
        // Will retry
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleLogin = (userData: UserInfo, token: string) => {
    localStorage.setItem('dax_token', token)
    localStorage.setItem('dax_user', JSON.stringify(userData))
    setUser(userData)
    setView('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('dax_token')
    localStorage.removeItem('dax_user')
    setUser(null)
    setView('landing')
    setMobileMenuOpen(false)
  }

  const refreshUser = async () => {
    try {
      const data = await apiFetch('/auth/me')
      setUser(data.user)
      localStorage.setItem('dax_user', JSON.stringify(data.user))
    } catch {
      handleLogout()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Image src="/logo.png" alt="DAX" width={80} height={80} />
          </motion.div>
          <motion.div
            className="flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
          <p className="text-gray-400 text-lg">Cargando...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div key="landing" initial="initial" animate="animate" exit="exit" variants={pageVariants}>
            <LandingView onLogin={() => setView('login')} onRegister={() => setView('register')} services={services} />
          </motion.div>
        )}
        {view === 'login' && (
          <motion.div key="login" initial="initial" animate="animate" exit="exit" variants={pageVariants}>
            <LoginView onLogin={handleLogin} onBack={() => setView('landing')} onRegister={() => setView('register')} />
          </motion.div>
        )}
        {view === 'register' && (
          <motion.div key="register" initial="initial" animate="animate" exit="exit" variants={pageVariants}>
            <RegisterView onRegister={handleLogin} onBack={() => setView('landing')} onLogin={() => setView('login')} />
          </motion.div>
        )}
        {view === 'dashboard' && user && (
          <motion.div key="dashboard" initial="initial" animate="animate" exit="exit" variants={pageVariants}>
            <DashboardView
              user={user}
              services={services}
              onLogout={handleLogout}
              onRefreshUser={refreshUser}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <WhatsAppFloatingButton mobileMenuOpen={mobileMenuOpen} />
    </div>
  )
}

// ==================== LANDING VIEW ====================
function LandingView({ onLogin, onRegister, services }: { onLogin: () => void; onRegister: () => void; services: Service[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))]
  const filteredServices = selectedCategory === 'all' ? services : services.filter(s => s.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="DAX" width={40} height={40} />
              <span className="text-xl font-bold text-white">DAX</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onLogin} className="text-gray-300 hover:text-white hover:bg-gray-800">
                Iniciar Sesión
              </Button>
              <Button onClick={onRegister} className="bg-blue-600 hover:bg-blue-700 text-white">
                Crear Cuenta
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-gray-950 to-gray-950" />
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              DAX <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Servicios Digitales</span>
            </motion.h1>
            <motion.p
              className="text-xl sm:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              Tu plataforma de trámites digitales
            </motion.p>
            <motion.p
              className="text-gray-500 mb-10 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              Realiza tus trámites de manera rápida y segura. Actas, RFC, SAT, IMSS, Infonavit y más.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" onClick={onRegister} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-lg px-8 py-6 shadow-lg shadow-blue-500/25">
                  Comenzar Ahora <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" variant="outline" onClick={onLogin} className="border-gray-700 text-gray-300 hover:bg-gray-800 text-lg px-8 py-6">
                  Iniciar Sesión
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {[
                { icon: Shield, label: 'Trámites seguros' },
                { icon: Clock, label: 'Respuesta rápida' },
                { icon: MessageCircle, label: 'Soporte por WhatsApp' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-gray-400">
                  <Icon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {[
              { value: '27+', label: 'Servicios' },
              { value: '8', label: 'Categorías' },
              { value: '24/7', label: 'Disponible' },
            ].map(stat => (
              <div key={stat.label} className="text-center rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm py-5">
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">¿Por qué elegir DAX?</h2>
          <p className="text-gray-400 max-w-xl mx-auto">Hacemos tus trámites simples, rápidos y confiables</p>
        </div>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-80px' }}
        >
          {[
            { icon: Clock, title: 'Rápido y eficiente', desc: 'Procesamos tus solicitudes en el menor tiempo posible para que no esperes de más.' },
            { icon: Shield, title: 'Seguro y confiable', desc: 'Tus datos están protegidos. Manejamos tu información con la máxima confidencialidad.' },
            { icon: Wallet, title: 'Saldo a tu favor', desc: 'Recarga tu saldo y úsalo cuando quieras en cualquiera de nuestros servicios.' },
          ].map(({ icon: Icon, title, desc }) => (
            <motion.div key={title} variants={staggerItem}>
              <Card className="h-full bg-gray-900/80 backdrop-blur-sm border-gray-800 hover:border-blue-500/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Nuestros Servicios</h2>
          <p className="text-gray-400 max-w-xl mx-auto">Más de 27 trámites digitales disponibles para ti</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}
            >
              {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat] || cat}
            </Button>
          ))}
        </div>

        {/* Service Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {filteredServices.map((service, index) => (
            <motion.div key={service.id} variants={staggerItem} custom={index}>
              <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className={CATEGORY_COLORS[service.category] || CATEGORY_COLORS.general}>
                        {CATEGORY_LABELS[service.category] || service.category}
                      </Badge>
                      <span className="text-blue-400 font-bold text-lg">${service.price}</span>
                    </div>
                    <h3 className="text-white font-semibold text-sm mt-2 mb-1 group-hover:text-blue-300 transition-colors">{service.name}</h3>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{service.estimatedTime}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Payment Info */}
      <section className="bg-gray-900 border-t border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Método de Pago</h2>
            <p className="text-gray-400">Realiza tu depósito mediante transferencia bancaria</p>
          </div>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Banknote className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-white font-semibold text-lg">Transferencia Bancaria</p>
                  <p className="text-gray-400 text-sm">Banco: Mercado Pago</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">Nombre:</span>
                  <span className="text-white font-medium">Diego Cruz Mazariegos</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">Banco:</span>
                  <span className="text-white font-medium">Mercado Pago</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">CLABE:</span>
                  <span className="text-white font-mono">722969028834827397</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">No. Tarjeta:</span>
                  <span className="text-white font-mono">5428 7807 5481 8680</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo.png" alt="DAX" width={36} height={36} />
                <span className="text-xl font-bold text-white">DAX</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                Tu plataforma de trámites digitales. Realizamos tus gestiones de actas, RFC, SAT, IMSS e Infonavit de forma rápida y segura.
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-5">
                {[
                  { icon: Shield, label: 'Trámites seguros' },
                  { icon: Clock, label: 'Respuesta rápida' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-gray-500 text-xs">
                    <Icon className="w-3.5 h-3.5 text-blue-400" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Plataforma</h4>
              <ul className="space-y-3">
                <li>
                  <button onClick={onRegister} className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
                    Crear cuenta
                  </button>
                </li>
                <li>
                  <button onClick={onLogin} className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
                    Iniciar sesión
                  </button>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
                    Nuestros servicios
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Contacto</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://wa.me/529613142550"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-400 hover:text-green-400 text-sm transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Soporte por WhatsApp
                  </a>
                </li>
                <li className="flex items-center gap-2 text-gray-400 text-sm">
                  <Phone className="w-4 h-4" />
                  961 314 2550
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-gray-800" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-gray-500 text-sm">© 2026 DAX Servicios Digitales. Todos los derechos reservados.</span>
            <a
              href="https://synkdata.online"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              <span>Powered by</span>
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 group-hover:from-blue-300 group-hover:to-blue-500 transition-all">
                Synkdata.online
              </span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ==================== LOGIN VIEW ====================
function LoginView({ onLogin, onBack, onRegister }: { onLogin: (user: UserInfo, token: string) => void; onBack: () => void; onRegister: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      toast({ title: 'Bienvenido', description: `Hola, ${data.user.name}` })
      onLogin(data.user, data.token)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-950 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-md">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl font-bold text-white">Iniciar Sesión</h1>
          <p className="text-gray-400 mt-2">Accede a tu cuenta DAX</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 shadow-xl shadow-black/20">
            <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Contraseña</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500" />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-500/20" disabled={loading}>
                  {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                </Button>
              </motion.div>
            </form>
            <div className="mt-4 text-center">
              <button onClick={onRegister} className="text-blue-400 hover:text-blue-300 text-sm">
                ¿No tienes cuenta? Crear una
              </button>
            </div>
            <div className="mt-2 text-center">
              <button onClick={onBack} className="text-gray-500 hover:text-gray-400 text-sm flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Volver al inicio
              </button>
            </div>
          </CardContent>
        </Card>
        </motion.div>
        <div className="mt-8 flex items-center justify-center">
          <a
            href="https://synkdata.online"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            <span>Powered by</span>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 group-hover:from-blue-300 group-hover:to-blue-500 transition-all">
              Synkdata.online
            </span>
          </a>
        </div>
      </div>
    </motion.div>
  )
}

// ==================== REGISTER VIEW ====================
function RegisterView({ onRegister, onBack, onLogin }: { onRegister: (user: UserInfo, token: string) => void; onBack: () => void; onLogin: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, password }),
      })
      toast({ title: 'Cuenta creada', description: 'Tu cuenta ha sido creada exitosamente' })
      onRegister(data.user, data.token)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-950 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-md">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl font-bold text-white">Crear Cuenta</h1>
          <p className="text-gray-400 mt-2">Regístrate en DAX</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Juan Pérez" required className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-gray-300">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <Input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-phone" className="text-gray-300">Teléfono (opcional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <Input id="reg-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="5512345678" className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-gray-300">Contraseña</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <Input id="reg-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500" />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-500/20" disabled={loading}>
                  {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Button>
              </motion.div>
            </form>
            <div className="mt-4 text-center">
              <button onClick={onLogin} className="text-blue-400 hover:text-blue-300 text-sm">
                ¿Ya tienes cuenta? Iniciar sesión
              </button>
            </div>
            <div className="mt-2 text-center">
              <button onClick={onBack} className="text-gray-500 hover:text-gray-400 text-sm flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Volver al inicio
              </button>
            </div>
          </CardContent>
        </Card>
        </motion.div>
        <div className="mt-8 flex items-center justify-center">
          <a
            href="https://synkdata.online"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            <span>Powered by</span>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 group-hover:from-blue-300 group-hover:to-blue-500 transition-all">
              Synkdata.online
            </span>
          </a>
        </div>
      </div>
    </motion.div>
  )
}

// ==================== DASHBOARD VIEW ====================
type UserTab = 'inicio' | 'servicios' | 'recargar' | 'pedidos' | 'soporte' | 'perfil'
type AdminTab = 'panel' | 'usuarios' | 'servicios' | 'depositos' | 'pedidos'

function DashboardView({ user, services, onLogout, onRefreshUser, mobileMenuOpen, setMobileMenuOpen }: {
  user: UserInfo
  services: Service[]
  onLogout: () => void
  onRefreshUser: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}) {
  const isAdmin = user.role === 'admin'
  const [userTab, setUserTab] = useState<UserTab>('inicio')
  const [adminTab, setAdminTab] = useState<AdminTab>('panel')

  const userTabs: { id: UserTab; label: string; icon: React.ReactNode }[] = [
    { id: 'inicio', label: 'Inicio', icon: <Home className="w-4 h-4" /> },
    { id: 'servicios', label: 'Servicios', icon: <FileText className="w-4 h-4" /> },
    { id: 'recargar', label: 'Recargar Saldo', icon: <Wallet className="w-4 h-4" /> },
    { id: 'pedidos', label: 'Mis Pedidos', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'soporte', label: 'Soporte', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'perfil', label: 'Mi Perfil', icon: <User className="w-4 h-4" /> },
  ]

  const adminTabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'panel', label: 'Panel', icon: <Home className="w-4 h-4" /> },
    { id: 'usuarios', label: 'Usuarios', icon: <Users className="w-4 h-4" /> },
    { id: 'servicios', label: 'Servicios', icon: <Settings className="w-4 h-4" /> },
    { id: 'depositos', label: 'Depósitos', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'pedidos', label: 'Pedidos', icon: <Package className="w-4 h-4" /> },
  ]

  const tabs = isAdmin ? adminTabs : userTabs
  const currentTab = isAdmin ? adminTab : userTab
  const setCurrentTab = isAdmin ? setAdminTab : setUserTab

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-6 h-6 text-gray-400" /> : <Menu className="w-6 h-6 text-gray-400" />}
              </button>
              <Image src="/logo.png" alt="DAX" width={32} height={32} />
              <span className="text-lg font-bold text-white hidden sm:inline">DAX</span>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden lg:flex items-center gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as never)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentTab === tab.id
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {!isAdmin && (
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
                  <Wallet className="w-3 h-3 mr-1" />
                  ${user.balance.toFixed(2)}
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 hidden sm:inline">{user.name}</span>
                <Button variant="ghost" size="sm" onClick={onLogout} className="text-gray-400 hover:text-red-400">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-40 bg-gray-950/95 backdrop-blur-sm">
          <div className="p-4 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setCurrentTab(tab.id as never); setMobileMenuOpen(false) }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm transition-colors ${
                  currentTab === tab.id
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          {isAdmin ? (
            <motion.div key={`admin-${adminTab}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {adminTab === 'panel' && <AdminPanel />}
              {adminTab === 'usuarios' && <AdminUsers />}
              {adminTab === 'servicios' && <AdminServices services={services} onRefresh={onRefreshUser} />}
              {adminTab === 'depositos' && <AdminDeposits onRefresh={onRefreshUser} />}
              {adminTab === 'pedidos' && <AdminOrders />}
            </motion.div>
          ) : (
            <motion.div key={`user-${userTab}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {userTab === 'inicio' && <UserInicio user={user} onNavigate={setUserTab} />}
              {userTab === 'servicios' && <UserServicios services={services} user={user} onRefreshUser={onRefreshUser} />}
              {userTab === 'recargar' && <UserRecargar user={user} onRefreshUser={onRefreshUser} />}
              {userTab === 'pedidos' && <UserPedidos />}
              {userTab === 'soporte' && <UserSoporte />}
              {userTab === 'perfil' && <UserProfile user={user} onRefreshUser={onRefreshUser} onLogout={onLogout} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Credits */}
      <footer className="border-t border-gray-800 py-4">
        <div className="max-w-7xl mx-auto w-full px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-gray-600">© 2026 DAX Servicios Digitales</span>
          <a
            href="https://synkdata.online"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <span>Powered by</span>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 group-hover:from-blue-300 group-hover:to-blue-500 transition-all">
              Synkdata.online
            </span>
          </a>
        </div>
      </footer>
    </div>
  )
}
function UserInicio({ user, onNavigate }: { user: UserInfo; onNavigate: (tab: UserTab) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">¡Hola, {user.name}!</h1>
        <p className="text-gray-400 mt-1">Bienvenido a DAX Servicios Digitales</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Saldo Disponible</p>
              <p className="text-2xl font-bold text-white">${user.balance.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800 cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => onNavigate('recargar')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Plus className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Recargar Saldo</p>
              <p className="text-white font-medium">Agregar fondos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800 cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => onNavigate('servicios')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Solicitar</p>
              <p className="text-white font-medium">Nuevo trámite</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Recargar Saldo', icon: <Wallet className="w-5 h-5" />, tab: 'recargar' as UserTab, color: 'text-green-400 bg-green-500/20' },
              { label: 'Ver Servicios', icon: <FileText className="w-5 h-5" />, tab: 'servicios' as UserTab, color: 'text-blue-400 bg-blue-500/20' },
              { label: 'Mis Pedidos', icon: <ShoppingCart className="w-5 h-5" />, tab: 'pedidos' as UserTab, color: 'text-amber-400 bg-amber-500/20' },
              { label: 'Soporte', icon: <MessageCircle className="w-5 h-5" />, tab: 'soporte' as UserTab, color: 'text-green-400 bg-green-500/20' },
              { label: 'Mi Perfil', icon: <User className="w-5 h-5" />, tab: 'perfil' as UserTab, color: 'text-purple-400 bg-purple-500/20' },
            ].map(item => (
              <button key={item.label} onClick={() => onNavigate(item.tab)} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors">
                <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}>
                  {item.icon}
                </div>
                <span className="text-gray-300 text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== USER: SERVICIOS ====================
function UserServicios({ services, user, onRefreshUser }: { services: Service[]; user: UserInfo; onRefreshUser: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [orderNotes, setOrderNotes] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))]
  const filtered = services.filter(s => {
    const matchCat = selectedCategory === 'all' || s.category === selectedCategory
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleOpenOrder = (service: Service) => {
    setSelectedService(service)
    setOrderNotes('')
    const fields = getServiceFields(service.name)
    const initialValues: Record<string, string> = {}
    fields.forEach(f => { initialValues[f.key] = '' })
    setDynamicFieldValues(initialValues)
    setOrderDialogOpen(true)
  }

  const handleOrder = async () => {
    if (!selectedService) return
    setOrdering(true)
    try {
      const fields = getServiceFields(selectedService.name)
      // Validate required fields
      for (const field of fields) {
        if (field.required && !dynamicFieldValues[field.key]?.trim()) {
          toast({ title: 'Campo requerido', description: `El campo "${field.label}" es obligatorio`, variant: 'destructive' })
          setOrdering(false)
          return
        }
      }
      const body: Record<string, string> = { serviceId: selectedService.id }
      if (fields.length > 0) {
        body.fieldValues = JSON.stringify(dynamicFieldValues)
        // Also format as notes for backward compatibility
        const formattedNotes = fields.map(f => `${f.label}: ${dynamicFieldValues[f.key] || '-'}`).join('\n')
        body.notes = orderNotes ? `${formattedNotes}\n\nNotas: ${orderNotes}` : formattedNotes
      } else {
        if (orderNotes) body.notes = orderNotes
      }
      await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      toast({ title: 'Pedido creado', description: `Tu pedido de ${selectedService.name} ha sido creado` })
      setOrderDialogOpen(false)
      setSelectedService(null)
      setOrderNotes('')
      setDynamicFieldValues({})
      onRefreshUser()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al crear pedido', variant: 'destructive' })
    } finally {
      setOrdering(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Servicios</h1>
        <p className="text-gray-400 mt-1">Selecciona un trámite para solicitarlo</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar servicio..." className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat)} className={selectedCategory === cat ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}>
            {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat] || cat}
          </Button>
        ))}
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {filtered.map((service, index) => (
          <motion.div key={service.id} variants={staggerItem} custom={index}>
            <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
              <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className={CATEGORY_COLORS[service.category] || CATEGORY_COLORS.general}>
                      {CATEGORY_LABELS[service.category] || service.category}
                    </Badge>
                    <span className="text-blue-400 font-bold text-lg">${service.price}</span>
                  </div>
                  <h3 className="text-white font-semibold mb-1 group-hover:text-blue-300 transition-colors">{service.name}</h3>
                  <div className="flex items-center gap-1 text-gray-500 text-xs mb-4">
                    <Clock className="w-3 h-3" />
                    <span>{service.estimatedTime}</span>
                  </div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-sm shadow-blue-500/20"
                      size="sm"
                      onClick={() => { handleOpenOrder(service) }}
                    >
                      Solicitar
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No se encontraron servicios</p>
        </div>
      )}

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Solicitar Servicio</DialogTitle>
            <DialogDescription className="text-gray-400">Confirma los detalles de tu solicitud</DialogDescription>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">{selectedService.name}</span>
                  <Badge variant="outline" className={CATEGORY_COLORS[selectedService.category] || CATEGORY_COLORS.general}>
                    {CATEGORY_LABELS[selectedService.category] || selectedService.category}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedService.estimatedTime}</span>
                  <span className="text-blue-400 font-bold text-xl">${selectedService.price}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                <span className="text-gray-400">Tu saldo actual:</span>
                <span className={`font-semibold ${user.balance >= selectedService.price ? 'text-green-400' : 'text-red-400'}`}>
                  ${user.balance.toFixed(2)}
                </span>
              </div>
              {user.balance < selectedService.price && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Saldo insuficiente. Necesitas recargar ${((selectedService.price - user.balance)).toFixed(2)} más.</span>
                </div>
              )}
              {/* Dynamic Service Fields */}
              {getServiceFields(selectedService.name).length > 0 && (
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm font-medium">Datos requeridos para el trámite:</p>
                  {getServiceFields(selectedService.name).map(field => (
                    <div key={field.key} className="space-y-1">
                      <Label className="text-gray-300 text-sm">
                        {field.label} {field.required && <span className="text-red-400">*</span>}
                      </Label>
                      <Input
                        type={field.type}
                        value={dynamicFieldValues[field.key] || ''}
                        onChange={e => setDynamicFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-gray-300">Notas adicionales (opcional)</Label>
                <Textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)} placeholder="Información extra para tu trámite..." className="bg-gray-800 border-gray-700 text-white placeholder-gray-500" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOrderDialogOpen(false)} className="border-gray-700 text-gray-300">Cancelar</Button>
                <Button onClick={handleOrder} disabled={ordering || user.balance < selectedService.price} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {ordering ? 'Procesando...' : `Pagar $${selectedService.price}`}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== USER: RECARGAR ====================
function UserRecargar({ user, onRefreshUser }: { user: UserInfo; onRefreshUser: () => void }) {
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTx, setLoadingTx] = useState(true)
  const { toast } = useToast()

  const loadTransactions = useCallback(async () => {
    try {
      const data = await apiFetch('/transactions')
      setTransactions(data.transactions || [])
    } catch { /* ignore */ } finally {
      setLoadingTx(false)
    }
  }, [])

  useEffect(() => { loadTransactions() }, [loadTransactions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) < 350) {
      toast({ title: 'Error', description: 'La recarga mínima es de $350.00', variant: 'destructive' })
      return
    }
    if (!reference) {
      toast({ title: 'Error', description: 'Ingresa la referencia del depósito', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      let receiptUrl = ''
      if (receiptFile) {
        const uploadData = await apiUpload(receiptFile)
        receiptUrl = uploadData.url
      }
      await apiFetch('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(amount),
          reference,
          notes: notes || undefined,
          receiptUrl: receiptUrl || undefined,
        }),
      })
      toast({ title: 'Depósito registrado', description: 'Tu solicitud ha sido enviada. Será aprobada en breve.' })
      setAmount('')
      setReference('')
      setNotes('')
      setReceiptFile(null)
      loadTransactions()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al registrar depósito', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Recargar Saldo</h1>
        <p className="text-gray-400 mt-1">Realiza una transferencia y registra tu depósito</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Info */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><Banknote className="w-5 h-5 text-blue-400" /> Datos Bancarios</CardTitle>
            <CardDescription className="text-gray-400">Transfiere a esta cuenta y registra tu depósito</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Nombre:</span>
              <span className="text-white font-medium">Diego Cruz Mazariegos</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Banco:</span>
              <span className="text-white font-medium">Mercado Pago</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">CLABE:</span>
              <span className="text-white font-mono text-sm">722969028834827397</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">No. Tarjeta:</span>
              <span className="text-white font-mono text-sm">5428 7807 5481 8680</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 mt-4">
              <span className="text-gray-400">Tu saldo actual:</span>
              <span className="text-green-400 font-semibold">${user.balance.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Form */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-400" /> Registrar Depósito</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Monto ($)</Label>
                <Input type="number" step="0.01" min="350" value={amount} onChange={e => setAmount(e.target.value)} placeholder="350.00" className="bg-gray-800 border-gray-700 text-white placeholder-gray-500" required />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Número de Referencia</Label>
                <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Referencia de la transferencia" className="bg-gray-800 border-gray-700 text-white placeholder-gray-500" required />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Comprobante (opcional)</Label>
                <div className="relative">
                  <Input type="file" accept="image/*" onChange={e => setReceiptFile(e.target.files?.[0] || null)} className="bg-gray-800 border-gray-700 text-gray-300 file:bg-gray-700 file:text-gray-300 file:border-0 file:mr-3" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Notas (opcional)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Información adicional..." className="bg-gray-800 border-gray-700 text-white placeholder-gray-500" />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
                {submitting ? 'Registrando...' : 'Registrar Depósito'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Historial de Depósitos</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTx ? (
            <div className="text-center py-8 text-gray-400">Cargando...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tienes depósitos registrados</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Fecha</TableHead>
                    <TableHead className="text-gray-400">Monto</TableHead>
                    <TableHead className="text-gray-400">Referencia</TableHead>
                    <TableHead className="text-gray-400">Estado</TableHead>
                    <TableHead className="text-gray-400">Notas Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(tx => (
                    <TableRow key={tx.id} className="border-gray-800">
                      <TableCell className="text-gray-300 text-sm">{new Date(tx.createdAt).toLocaleDateString('es-MX')}</TableCell>
                      <TableCell className="text-green-400 font-medium">${tx.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-gray-300 text-sm font-mono">{tx.reference || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[tx.status] || STATUS_COLORS.pending}>
                          {STATUS_LABELS[tx.status] || tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm max-w-[200px] truncate">{tx.adminNotes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== USER: PEDIDOS ====================
function UserPedidos() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/orders')
        setOrders(data.orders || [])
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
    </div>
  )

  const getStatusSteps = (status: string) => {
    const steps = [
      { key: 'pending', label: 'Pendiente', icon: Clock },
      { key: 'in_progress', label: 'En Proceso', icon: RefreshCw },
      { key: 'completed', label: 'Exitoso', icon: Check },
    ]
    const statusOrder = ['pending', 'in_progress', 'completed']
    const currentIndex = status === 'cancelled' ? -1 : statusOrder.indexOf(status)
    return steps.map((step, i) => ({
      ...step,
      active: i <= currentIndex,
      current: step.key === status,
    }))
  }

  const parseFieldValues = (fieldValuesJson: string | undefined): { label: string; value: string }[] => {
    if (!fieldValuesJson) return []
    try {
      const values = JSON.parse(fieldValuesJson) as Record<string, string>
      for (const [serviceName, fields] of Object.entries(SERVICE_FIELDS)) {
        const allKeysMatch = fields.every(f => f.key in values)
        if (allKeysMatch && Object.keys(values).length >= fields.length) {
          return fields.map(f => ({ label: f.label, value: values[f.key] || '-' }))
        }
      }
      return Object.entries(values).map(([k, v]) => ({ label: k, value: v }))
    } catch {
      return [{ label: 'Datos', value: fieldValuesJson }]
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mis Pedidos</h1>
        <p className="text-gray-400 mt-1">Seguimiento de tus trámites</p>
      </div>

      {orders.length === 0 ? (
        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
          <CardContent className="py-12 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No tienes pedidos aún</p>
            <p className="text-gray-500 text-sm">Solicita un servicio para verlo aquí</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const fieldData = parseFieldValues(order.fieldValues)
            const statusSteps = getStatusSteps(order.status)
            const isCancelled = order.status === 'cancelled'
            const isCompleted = order.status === 'completed'
            const hasDocument = isCompleted && order.resultData

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`bg-gray-900/80 backdrop-blur-sm border-gray-800 ${isCancelled ? 'border-red-500/30' : isCompleted ? 'border-green-500/30' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold">{order.service?.name || 'Servicio'}</h3>
                            <Badge variant="outline" className={STATUS_COLORS[order.status] || STATUS_COLORS.pending}>
                              {STATUS_LABELS[order.status] || order.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{new Date(order.createdAt).toLocaleDateString('es-MX')}</span>
                            <span className="text-blue-400 font-medium">${order.totalPrice.toFixed(2)}</span>
                            {order.service?.estimatedTime && (
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{order.service.estimatedTime}</span>
                            )}
                          </div>
                        </div>
                        {hasDocument && (
                          <motion.a
                            href={order.resultData}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg transition-colors self-start"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <Download className="w-4 h-4" />
                            <span className="font-medium text-sm">Descargar Documento</span>
                          </motion.a>
                        )}
                      </div>

                      {/* Status Timeline (only for non-cancelled) */}
                      {!isCancelled && (
                        <div className="flex items-center gap-2 py-2">
                          {statusSteps.map((step, i) => (
                            <React.Fragment key={step.key}>
                              <div className="flex items-center gap-1.5">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                  step.current
                                    ? 'bg-blue-500 text-white'
                                    : step.active
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-gray-800 text-gray-500'
                                }`}>
                                  {step.active && !step.current ? <Check className="w-3.5 h-3.5" /> : <step.icon className="w-3.5 h-3.5" />}
                                </div>
                                <span className={`text-xs ${step.current ? 'text-blue-400 font-medium' : step.active ? 'text-green-400' : 'text-gray-500'}`}>
                                  {step.label}
                                </span>
                              </div>
                              {i < statusSteps.length - 1 && (
                                <div className={`flex-1 h-0.5 ${step.active ? 'bg-green-500/40' : 'bg-gray-800'}`} />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      )}

                      {/* Field Values */}
                      {fieldData.length > 0 && (
                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                          <p className="text-blue-400 text-xs font-medium mb-2 flex items-center gap-1">
                            <FileCheck className="w-3 h-3" /> Datos del trámite:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {fieldData.map(field => (
                              <div key={field.label} className="flex flex-col">
                                <span className="text-gray-500 text-xs">{field.label}</span>
                                <span className="text-gray-200 text-sm font-medium">{field.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Admin Notes */}
                      {order.adminNotes && (
                        <div className="text-sm text-gray-400">
                          <span className="text-gray-500">Nota del administrador:</span> {order.adminNotes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ==================== USER: SOPORTE ====================
function UserSoporte() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Soporte DAX</h1>
        <p className="text-gray-400 mt-1">¿Necesitas ayuda? Contáctanos por WhatsApp</p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-10 h-10 fill-green-400">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">WhatsApp Soporte</h2>
              <p className="text-gray-400 mb-1">Escríbenos para resolver tus dudas</p>
              <p className="text-green-400 font-mono text-lg">961-314-2550</p>
            </div>
            <a
              href="https://wa.me/529613142550"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Abrir WhatsApp
            </a>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Horario de Atención</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400">Lunes a Viernes</span>
              <span className="text-white font-medium">9:00 AM - 6:00 PM</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400">Sábados</span>
              <span className="text-white font-medium">9:00 AM - 2:00 PM</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Domingos</span>
              <span className="text-gray-500">Cerrado</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== USER: PERFIL ====================
function UserProfile({ user, onRefreshUser, onLogout }: { user: UserInfo; onRefreshUser: () => void; onLogout: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changing, setChanging] = useState(false)
  const { toast } = useToast()

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) return
    setChanging(true)
    try {
      // Simple password change: login with current, then we'd need an API for this
      // For now, just show a toast
      toast({ title: 'Función no disponible', description: 'El cambio de contraseña se implementará próximamente', variant: 'destructive' })
    } finally {
      setChanging(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
        <p className="text-gray-400 mt-1">Información de tu cuenta</p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
              <User className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{user.name}</p>
              <p className="text-gray-400">{user.email}</p>
              {user.phone && <p className="text-gray-500 text-sm">{user.phone}</p>}
            </div>
          </div>
          <Separator className="bg-gray-700" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Rol</p>
              <p className="text-white capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Saldo</p>
              <p className="text-green-400 font-semibold">${user.balance.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Cambiar Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Contraseña Actual</Label>
              <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Nueva Contraseña</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={changing}>
              {changing ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => { onRefreshUser() }} className="border-gray-700 text-gray-300 hover:bg-gray-800">
        <RefreshCw className="w-4 h-4 mr-2" /> Actualizar Datos
      </Button>

      <Button variant="ghost" onClick={onLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
        <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
      </Button>
    </div>
  )
}

// ==================== ADMIN: PANEL ====================
function AdminPanel() {
  const [stats, setStats] = useState<{ totalUsers: number; activeUsers: number; pendingDeposits: number; pendingOrders: number; completedOrders: number; totalOrders: number; totalRevenue: number; totalBalance: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/admin/stats')
        setStats(data)
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-400">Cargando estadísticas...</div>

  const statCards = stats ? [
    { label: 'Usuarios Totales', value: stats.totalUsers, icon: <Users className="w-5 h-5" />, color: 'text-blue-400 bg-blue-500/20' },
    { label: 'Usuarios Activos', value: stats.activeUsers, icon: <Users className="w-5 h-5" />, color: 'text-green-400 bg-green-500/20' },
    { label: 'Depósitos Pendientes', value: stats.pendingDeposits, icon: <Clock className="w-5 h-5" />, color: 'text-yellow-400 bg-yellow-500/20' },
    { label: 'Pedidos Pendientes', value: stats.pendingOrders, icon: <Package className="w-5 h-5" />, color: 'text-amber-400 bg-amber-500/20' },
    { label: 'Pedidos Completados', value: stats.completedOrders, icon: <Check className="w-5 h-5" />, color: 'text-emerald-400 bg-emerald-500/20' },
    { label: 'Ingresos Totales', value: `$${stats.totalRevenue.toFixed(2)}`, icon: <DollarSign className="w-5 h-5" />, color: 'text-green-400 bg-green-500/20' },
    { label: 'Saldo Usuarios', value: `$${stats.totalBalance.toFixed(2)}`, icon: <Wallet className="w-5 h-5" />, color: 'text-purple-400 bg-purple-500/20' },
    { label: 'Total Pedidos', value: stats.totalOrders, icon: <TrendingUp className="w-5 h-5" />, color: 'text-cyan-400 bg-cyan-500/20' },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
        <p className="text-gray-400 mt-1">Resumen general de la plataforma</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Card key={card.label} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-gray-400 text-xs">{card.label}</p>
                  <p className="text-white font-bold text-lg">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ==================== ADMIN: USUARIOS ====================
function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editBalance, setEditBalance] = useState('')
  const { toast } = useToast()

  const loadUsers = useCallback(async () => {
    try {
      const data = await apiFetch('/admin/users')
      setUsers(data.users || [])
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const toggleActive = async (userId: string, isActive: boolean) => {
    try {
      await apiFetch(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !isActive }),
      })
      toast({ title: 'Usuario actualizado', description: `Usuario ${!isActive ? 'activado' : 'desactivado'}` })
      loadUsers()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al actualizar', variant: 'destructive' })
    }
  }

  const updateBalance = async () => {
    if (!editingUser || editBalance === '') return
    try {
      await apiFetch(`/admin/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ balance: parseFloat(editBalance) }),
      })
      toast({ title: 'Saldo actualizado' })
      setEditingUser(null)
      loadUsers()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al actualizar', variant: 'destructive' })
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Cargando...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Usuarios</h1>
        <p className="text-gray-400 mt-1">Gestión de usuarios registrados</p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Nombre</TableHead>
                  <TableHead className="text-gray-400">Email</TableHead>
                  <TableHead className="text-gray-400">Saldo</TableHead>
                  <TableHead className="text-gray-400">Pedidos</TableHead>
                  <TableHead className="text-gray-400">Estado</TableHead>
                  <TableHead className="text-gray-400">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id} className="border-gray-800">
                    <TableCell className="text-white font-medium">{u.name}</TableCell>
                    <TableCell className="text-gray-400">{u.email}</TableCell>
                    <TableCell className="text-green-400">${u.balance.toFixed(2)}</TableCell>
                    <TableCell className="text-gray-300">{u._count.orders}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={u.isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 h-8" onClick={() => { setEditingUser(u); setEditBalance(u.balance.toFixed(2)) }}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className={`h-8 ${u.isActive ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`} onClick={() => toggleActive(u.id, u.isActive)}>
                          {u.isActive ? <Ban className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Balance Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Editar Saldo</DialogTitle>
            <DialogDescription className="text-gray-400">Modificar saldo de {editingUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Nuevo Saldo</Label>
              <Input type="number" step="0.01" value={editBalance} onChange={e => setEditBalance(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)} className="border-gray-700 text-gray-300">Cancelar</Button>
              <Button onClick={updateBalance} className="bg-blue-600 hover:bg-blue-700 text-white">Guardar</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== ADMIN: SERVICIOS ====================
function AdminServices({ services, onRefresh }: { services: Service[]; onRefresh: () => void }) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [form, setForm] = useState({ name: '', description: '', estimatedTime: '', price: '', category: 'general', sortOrder: '0', requiredFields: '' })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const resetForm = () => setForm({ name: '', description: '', estimatedTime: '', price: '', category: 'general', sortOrder: '0', requiredFields: '' })

  const handleAdd = () => { resetForm(); setShowAddDialog(true) }

  const handleEdit = (service: Service) => {
    setForm({
      name: service.name,
      description: service.description || '',
      estimatedTime: service.estimatedTime,
      price: service.price.toString(),
      category: service.category,
      sortOrder: service.sortOrder.toString(),
      requiredFields: service.requiredFields || '',
    })
    setEditingService(service)
  }

  const handleSave = async () => {
    if (!form.name || !form.estimatedTime || !form.price) {
      toast({ title: 'Error', description: 'Nombre, tiempo y precio son obligatorios', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      if (editingService) {
        await apiFetch(`/services/${editingService.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: form.name,
            description: form.description || null,
            estimatedTime: form.estimatedTime,
            price: parseFloat(form.price),
            category: form.category,
            sortOrder: parseInt(form.sortOrder) || 0,
            requiredFields: form.requiredFields || null,
          }),
        })
        toast({ title: 'Servicio actualizado' })
      } else {
        await apiFetch('/services', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            description: form.description || null,
            estimatedTime: form.estimatedTime,
            price: parseFloat(form.price),
            category: form.category,
            sortOrder: parseInt(form.sortOrder) || 0,
            requiredFields: form.requiredFields || null,
          }),
        })
        toast({ title: 'Servicio creado' })
      }
      setShowAddDialog(false)
      setEditingService(null)
      resetForm()
      onRefresh()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al guardar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este servicio?')) return
    try {
      await apiFetch(`/services/${id}`, { method: 'DELETE' })
      toast({ title: 'Servicio eliminado' })
      onRefresh()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al eliminar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Servicios</h1>
          <p className="text-gray-400 mt-1">Gestión de servicios disponibles</p>
        </div>
        <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Agregar Servicio
        </Button>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Servicio</TableHead>
                  <TableHead className="text-gray-400">Categoría</TableHead>
                  <TableHead className="text-gray-400">Tiempo</TableHead>
                  <TableHead className="text-gray-400">Precio</TableHead>
                  <TableHead className="text-gray-400">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map(s => (
                  <TableRow key={s.id} className="border-gray-800">
                    <TableCell className="text-white font-medium">{s.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={CATEGORY_COLORS[s.category] || CATEGORY_COLORS.general}>
                        {CATEGORY_LABELS[s.category] || s.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">{s.estimatedTime}</TableCell>
                    <TableCell className="text-blue-400 font-medium">${s.price}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 h-8" onClick={() => handleEdit(s)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8" onClick={() => handleDelete(s.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingService} onOpenChange={() => { setShowAddDialog(false); setEditingService(null) }}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Editar Servicio' : 'Agregar Servicio'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingService ? 'Modifica los detalles del servicio' : 'Ingresa los datos del nuevo servicio'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Nombre</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Descripción</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Tiempo Estimado</Label>
                <Input value={form.estimatedTime} onChange={e => setForm({ ...form, estimatedTime: e.target.value })} placeholder="10-20 min" className="bg-gray-800 border-gray-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Precio ($)</Label>
                <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Categoría</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-gray-300">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Orden</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
              </div>
            </div>
            <div className="space-y-2 border-t border-gray-700 pt-4">
              <Label className="text-gray-300">Campos Requeridos del Cliente</Label>
              <RequiredFieldsEditor
                value={form.requiredFields}
                onChange={(value) => setForm({ ...form, requiredFields: value })}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingService(null) }} className="border-gray-700 text-gray-300">Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== ADMIN: DEPOSITOS ====================
function AdminDeposits({ onRefresh }: { onRefresh: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  const loadTransactions = useCallback(async () => {
    try {
      const data = await apiFetch('/transactions')
      setTransactions(data.transactions || [])
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTransactions() }, [loadTransactions])

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(true)
    try {
      await apiFetch(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminNotes: adminNotes || null }),
      })
      toast({ title: `Depósito ${status === 'approved' ? 'aprobado' : 'rechazado'}` })
      setSelectedTx(null)
      setAdminNotes('')
      loadTransactions()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al procesar', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Cargando...</div>

  const pending = transactions.filter(t => t.status === 'pending')
  const processed = transactions.filter(t => t.status !== 'pending')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Depósitos</h1>
        <p className="text-gray-400 mt-1">Gestión de solicitudes de recarga</p>
      </div>

      {pending.length > 0 && (
        <Card className="bg-gray-900 border-yellow-500/20 border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              Depósitos Pendientes ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pending.map(tx => (
              <div key={tx.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{tx.user?.name || 'Usuario'}</span>
                      <span className="text-gray-500 text-sm">({tx.user?.email})</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-400 font-bold text-lg">${tx.amount.toFixed(2)}</span>
                      <span className="text-gray-400">Ref: <span className="font-mono">{tx.reference}</span></span>
                      <span className="text-gray-500">{new Date(tx.createdAt).toLocaleDateString('es-MX')}</span>
                    </div>
                    {tx.notes && <p className="text-gray-400 text-sm mt-1">Notas: {tx.notes}</p>}
                    {tx.receiptUrl && (
                      <a href={tx.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-1">
                        <Eye className="w-3 h-3" /> Ver comprobante
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setSelectedTx(tx); setAdminNotes('') }} className="bg-gray-700 hover:bg-gray-600 text-white">
                      Revisar
                    </Button>
                    <Button size="sm" onClick={() => handleAction(tx.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={() => handleAction(tx.id, 'rejected')} className="bg-red-600 hover:bg-red-700 text-white">
                      <Ban className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Historial de Depósitos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Usuario</TableHead>
                  <TableHead className="text-gray-400">Monto</TableHead>
                  <TableHead className="text-gray-400">Referencia</TableHead>
                  <TableHead className="text-gray-400">Estado</TableHead>
                  <TableHead className="text-gray-400">Fecha</TableHead>
                  <TableHead className="text-gray-400">Notas Admin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processed.map(tx => (
                  <TableRow key={tx.id} className="border-gray-800">
                    <TableCell className="text-gray-300">{tx.user?.name || '-'}</TableCell>
                    <TableCell className="text-green-400 font-medium">${tx.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-gray-400 font-mono text-sm">{tx.reference || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[tx.status] || STATUS_COLORS.pending}>
                        {STATUS_LABELS[tx.status] || tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">{new Date(tx.createdAt).toLocaleDateString('es-MX')}</TableCell>
                    <TableCell className="text-gray-400 text-sm max-w-[200px] truncate">{tx.adminNotes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Revisar Depósito</DialogTitle>
            <DialogDescription className="text-gray-400">Depósito de {selectedTx?.user?.name}</DialogDescription>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-green-400 font-bold text-2xl mb-2">${selectedTx.amount.toFixed(2)}</p>
                <p className="text-gray-400">Referencia: <span className="text-white font-mono">{selectedTx.reference}</span></p>
                {selectedTx.receiptUrl && (
                  <a href={selectedTx.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-2">
                    <Eye className="w-3 h-3" /> Ver comprobante
                  </a>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Notas del Administrador</Label>
                <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Notas opcionales..." className="bg-gray-800 border-gray-700 text-white" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTx(null)} className="border-gray-700 text-gray-300">Cancelar</Button>
                <Button onClick={() => handleAction(selectedTx.id, 'rejected')} className="bg-red-600 hover:bg-red-700 text-white" disabled={processing}>
                  <Ban className="w-4 h-4 mr-1" /> Rechazar
                </Button>
                <Button onClick={() => handleAction(selectedTx.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white" disabled={processing}>
                  <Check className="w-4 h-4 mr-1" /> Aprobar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== ADMIN: PEDIDOS ====================
function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderStatus, setOrderStatus] = useState('')
  const [orderAdminNotes, setOrderAdminNotes] = useState('')
  const [orderResultData, setOrderResultData] = useState('')
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiFetch('/orders')
      setOrders(data.orders || [])
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDoc(true)
    try {
      const uploadData = await apiUpload(file)
      setOrderResultData(uploadData.url)
      toast({ title: 'Documento subido', description: 'El documento se ha subido correctamente' })
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al subir documento', variant: 'destructive' })
    } finally {
      setUploadingDoc(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedOrder) return
    setProcessing(true)
    try {
      const body: Record<string, string> = {}
      if (orderStatus) body.status = orderStatus
      if (orderAdminNotes !== undefined) body.adminNotes = orderAdminNotes
      if (orderResultData !== undefined) body.resultData = orderResultData

      await apiFetch(`/orders/${selectedOrder.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      toast({ title: 'Pedido actualizado' })
      setSelectedOrder(null)
      setOrderStatus('')
      setOrderAdminNotes('')
      setOrderResultData('')
      loadOrders()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al actualizar', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  const openEdit = (order: Order) => {
    setSelectedOrder(order)
    setOrderStatus(order.status)
    setOrderAdminNotes(order.adminNotes || '')
    setOrderResultData(order.resultData || '')
  }

  const parseFieldValues = (fieldValuesJson: string | undefined): { label: string; value: string }[] => {
    if (!fieldValuesJson) return []
    try {
      const values = JSON.parse(fieldValuesJson) as Record<string, string>
      for (const [serviceName, fields] of Object.entries(SERVICE_FIELDS)) {
        const allKeysMatch = fields.every(f => f.key in values)
        if (allKeysMatch && Object.keys(values).length >= fields.length) {
          return fields.map(f => ({ label: f.label, value: values[f.key] || '-' }))
        }
      }
      return Object.entries(values).map(([k, v]) => ({ label: k, value: v }))
    } catch {
      return [{ label: 'Datos', value: fieldValuesJson }]
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
    </div>
  )

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const inProgressOrders = orders.filter(o => o.status === 'in_progress')
  const otherOrders = orders.filter(o => o.status !== 'pending' && o.status !== 'in_progress')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pedidos</h1>
        <p className="text-gray-400 mt-1">Gestión de pedidos de servicios</p>
      </div>

      {/* Pending Orders Alert */}
      {pendingOrders.length > 0 && (
        <Card className="bg-gray-900/80 backdrop-blur-sm border-yellow-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Clock className="w-5 h-5 text-yellow-400" />
              Pedidos Pendientes ({pendingOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingOrders.map(order => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{order.service?.name}</span>
                    <span className="text-gray-500 text-sm">- {order.user?.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm mt-1">
                    <span className="text-blue-400 font-bold">${order.totalPrice.toFixed(2)}</span>
                    <span className="text-gray-500">{new Date(order.createdAt).toLocaleDateString('es-MX')}</span>
                  </div>
                </div>
                <Button size="sm" onClick={() => openEdit(order)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Edit className="w-3 h-3 mr-1" /> Revisar
                </Button>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* In Progress Orders */}
      {inProgressOrders.length > 0 && (
        <Card className="bg-gray-900/80 backdrop-blur-sm border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              En Proceso ({inProgressOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inProgressOrders.map(order => (
              <div key={order.id} className="bg-gray-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{order.service?.name}</span>
                    <span className="text-gray-500 text-sm">- {order.user?.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm mt-1">
                    <span className="text-blue-400 font-bold">${order.totalPrice.toFixed(2)}</span>
                    <span className="text-gray-500">{new Date(order.createdAt).toLocaleDateString('es-MX')}</span>
                  </div>
                </div>
                <Button size="sm" onClick={() => openEdit(order)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Edit className="w-3 h-3 mr-1" /> Actualizar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Orders Table */}
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Todos los Pedidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Usuario</TableHead>
                  <TableHead className="text-gray-400">Servicio</TableHead>
                  <TableHead className="text-gray-400">Precio</TableHead>
                  <TableHead className="text-gray-400">Estado</TableHead>
                  <TableHead className="text-gray-400">Fecha</TableHead>
                  <TableHead className="text-gray-400">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => (
                  <TableRow key={order.id} className="border-gray-800">
                    <TableCell className="text-gray-300">{order.user?.name || '-'}</TableCell>
                    <TableCell className="text-white font-medium">{order.service?.name || '-'}</TableCell>
                    <TableCell className="text-blue-400 font-medium">${order.totalPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[order.status] || STATUS_COLORS.pending}>
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">{new Date(order.createdAt).toLocaleDateString('es-MX')}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 h-8" onClick={() => openEdit(order)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Order Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Actualizar Pedido</DialogTitle>
            <DialogDescription className="text-gray-400">
              Pedido de {selectedOrder?.user?.name} - {selectedOrder?.service?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Info Card */}
              <div className="bg-gray-800/80 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-400 font-bold text-xl">${selectedOrder.totalPrice.toFixed(2)}</span>
                  <Badge variant="outline" className={STATUS_COLORS[selectedOrder.status] || STATUS_COLORS.pending}>
                    {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                  </Badge>
                </div>

                {/* Field Values - Proper Card Display */}
                {selectedOrder.fieldValues && (() => {
                  const fieldData = parseFieldValues(selectedOrder.fieldValues)
                  return fieldData.length > 0 ? (
                    <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/50">
                      <p className="text-blue-400 text-xs font-medium mb-2 flex items-center gap-1">
                        <FileCheck className="w-3 h-3" /> Datos del trámite:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {fieldData.map(field => (
                          <div key={field.label} className="flex flex-col">
                            <span className="text-gray-400 text-xs">{field.label}</span>
                            <span className="text-white text-sm font-medium">{field.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                })()}

                {/* User Notes */}
                {selectedOrder.notes && !selectedOrder.fieldValues && (
                  <p className="text-gray-400 text-sm mt-2">Notas: <span className="text-white">{selectedOrder.notes}</span></p>
                )}

                {/* Existing Document */}
                {selectedOrder.resultData && (
                  <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <FileCheck className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm">Documento adjunto</span>
                    <a
                      href={selectedOrder.resultData}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs ml-auto flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Ver
                    </a>
                  </div>
                )}
              </div>

              {/* Status Select */}
              <div className="space-y-2">
                <Label className="text-gray-300">Estado</Label>
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="pending" className="text-gray-300">Pendiente</SelectItem>
                    <SelectItem value="in_progress" className="text-gray-300">En Proceso</SelectItem>
                    <SelectItem value="completed" className="text-gray-300">Exitoso</SelectItem>
                    <SelectItem value="cancelled" className="text-gray-300">Cancelado / Reembolso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label className="text-gray-300">Notas del Administrador</Label>
                <Textarea value={orderAdminNotes} onChange={e => setOrderAdminNotes(e.target.value)} placeholder="Notas internas..." className="bg-gray-800 border-gray-700 text-white" />
              </div>

              {/* Document Upload Section */}
              <div className="space-y-3">
                <Label className="text-gray-300">Documento de Resultado</Label>
                {orderResultData && orderResultData.startsWith('/uploads/') ? (
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-white text-sm font-medium">Documento adjunto</p>
                          <p className="text-gray-500 text-xs">Se entregará al usuario cuando el pedido sea exitoso</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={orderResultData}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Ver
                        </a>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 text-xs"
                          onClick={() => setOrderResultData('')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleDocUpload}
                          className="hidden"
                        />
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
                            disabled={uploadingDoc}
                            onClick={() => {}}
                          >
                            {uploadingDoc ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...</>
                            ) : (
                              <><Upload className="w-4 h-4 mr-2" /> Subir Documento</>
                            )}
                          </Button>
                        </motion.div>
                      </label>
                      <span className="text-gray-500 text-xs">PDF, JPG, PNG, DOC</span>
                    </div>
                    <div className="relative">
                      <Input
                        value={orderResultData}
                        onChange={e => setOrderResultData(e.target.value)}
                        placeholder="O pega una URL del documento..."
                        className="bg-gray-800 border-gray-700 text-white text-sm pr-10"
                      />
                      {orderResultData && (
                        <a
                          href={orderResultData}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedOrder(null)} className="border-gray-700 text-gray-300">Cancelar</Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={handleUpdate} disabled={processing} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-500/20">
                    {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : 'Guardar'}
                  </Button>
                </motion.div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
