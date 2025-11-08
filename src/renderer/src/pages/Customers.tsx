/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Container } from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import CustomerFilters from '../components/customers/CustomerFilters'
import CustomerFormModal from '../components/customers/CustomerFormModal'
import CustomerHeader from '../components/customers/CustomerHeader'
import CustomersTable from '../components/customers/CustomersTable'
import CustomerStats from '../components/customers/CustomerStats'
import CustomerViewModal from '../components/customers/CustomerViewModal'
import ExportModal from '../components/export/ExportModal'
import { useSettingsStore } from '../store/settingsStore'
import { Customer, CustomerFormData } from '../types/customer'

export default function Customers(): React.JSX.Element {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [limit] = useState(50)

  const currency = useSettingsStore((state) => state.currency)

  // Get currency symbol
  const getCurrencySymbol = (): string => {
    switch (currency) {
      case 'USD':
        return '$'
      case 'EUR':
        return '€'
      case 'GBP':
        return '£'
      case 'BDT':
        return '৳'
      case 'INR':
        return '₹'
      default:
        return '$'
    }
  }

  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
    status: 'active'
  })

  useEffect(() => {
    initializeCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm])

  useEffect(() => {
    filterCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, statusFilter])

  const initializeCustomers = async (): Promise<void> => {
    try {
      // First, recalculate customer stats from existing sales (one-time fix)
      await window.api.customers.recalculateStats()
      // Then load customers with updated stats
      await loadCustomers()
    } catch {
      // If recalculation fails, still try to load customers
      await loadCustomers()
    }
  }

  const loadCustomers = async (): Promise<void> => {
    try {
      const response = await window.api.customers.getPaginated({ page, limit, search: searchTerm })
      // Map isActive to status for frontend compatibility
      const mappedCustomers = (response.data as unknown as Array<Record<string, unknown>>).map(
        (customer) => ({
          ...customer,
          status: customer.isActive ? 'active' : 'inactive',
          loyaltyPoints: customer.loyaltyPoints || 0,
          totalPurchases: customer.totalPurchases || 0
        })
      ) as unknown as Customer[]
      setCustomers(mappedCustomers)
      setTotalRecords(response.total)
    } catch {
      toast.error('Failed to load customers')
    }
  }

  const filterCustomers = (): void => {
    let filtered = [...customers]

    // Status filter (client-side)
    if (statusFilter !== 'all') {
      filtered = filtered.filter((customer) => customer.status === statusFilter)
    }

    setFilteredCustomers(filtered)
  }

  const handleSearchChange = (search: string): void => {
    setSearchTerm(search)
    setPage(1) // Reset to first page on search
  }

  const handlePageChange = (newPage: number): void => {
    setPage(newPage)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!formData.name || !formData.phone) {
      toast.error('Name and phone are required')
      return
    }

    try {
      if (editingCustomer) {
        // Include version for optimistic locking
        const updateData = {
          ...formData,
          version: editingCustomer.version
        } as unknown as Record<string, unknown>

        await window.api.customers.update(editingCustomer.id, updateData)
        toast.success('Customer updated successfully')
      } else {
        await window.api.customers.create(formData as unknown as Record<string, unknown>)
        toast.success('Customer added successfully')
      }
      handleCloseModal()
      await loadCustomers()
    } catch (error) {
      // Handle concurrent edit error
      if (error instanceof Error && error.message.includes('CONCURRENT_EDIT')) {
        toast.error('This customer was modified by another user. Please refresh and try again.')
        await loadCustomers() // Auto-refresh the data
        handleCloseModal()
      } else {
        toast.error(editingCustomer ? 'Failed to update customer' : 'Failed to add customer')
      }
    }
  }

  const handleEdit = (customer: Customer): void => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      dateOfBirth: customer.dateOfBirth || '',
      status: customer.status || 'active'
    })
    setShowModal(true)
  }

  const handleView = (customer: Customer): void => {
    setViewingCustomer(customer)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await window.api.customers.delete(id)
      toast.success('Customer deleted successfully')
      await loadCustomers()
    } catch {
      toast.error('Failed to delete customer')
    }
  }

  const handleCloseModal = (): void => {
    setShowModal(false)
    setEditingCustomer(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      dateOfBirth: '',
      status: 'active'
    })
  }

  const handleCloseViewModal = (): void => {
    setShowViewModal(false)
    setViewingCustomer(null)
  }

  // Calculate stats
  const totalCustomers = filteredCustomers.length
  const activeCustomers = filteredCustomers.filter((c) => c.status === 'active').length
  const totalLoyaltyPoints = filteredCustomers.reduce((sum, c) => sum + c.loyaltyPoints, 0)
  const totalPurchaseValue = filteredCustomers.reduce((sum, c) => sum + c.totalPurchases, 0)

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
      <div data-tour="customers-header">
        <CustomerHeader />
      </div>

      <div data-tour="customers-stats">
        <CustomerStats
          totalCustomers={totalCustomers}
          activeCustomers={activeCustomers}
          totalLoyaltyPoints={totalLoyaltyPoints}
          totalPurchaseValue={totalPurchaseValue}
          currencySymbol={getCurrencySymbol()}
        />
      </div>

      <div data-tour="customers-filters">
        <CustomerFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={handleSearchChange}
          onStatusFilterChange={setStatusFilter}
          onAddClick={() => setShowModal(true)}
          onExportClick={() => setShowExportModal(true)}
        />
      </div>

      <div data-tour="customers-table">
        <CustomersTable
          customers={filteredCustomers}
          currencySymbol={getCurrencySymbol()}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          page={page}
          totalRecords={totalRecords}
          limit={limit}
          onPageChange={handlePageChange}
        />
      </div>

      <CustomerFormModal
        isOpen={showModal}
        onClose={handleCloseModal}
        customer={editingCustomer}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
      />

      <CustomerViewModal
        open={showViewModal}
        onClose={handleCloseViewModal}
        customer={viewingCustomer}
        currencySymbol={getCurrencySymbol()}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultExportType="customers"
      />
    </Container>
  )
}
