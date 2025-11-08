/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Container } from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ExportModal from '../components/export/ExportModal'
import PaymentModal, { generatePaymentPDF } from '../components/suppliers/PaymentModal'
import SupplierFormModal from '../components/suppliers/SupplierFormModal'
import SupplierHeader from '../components/suppliers/SupplierHeader'
import SupplierSearchBar from '../components/suppliers/SupplierSearchBar'
import SuppliersTable from '../components/suppliers/SuppliersTable'
import SupplierStats from '../components/suppliers/SupplierStats'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import {
  BankAccount,
  PaymentFormData,
  PaymentReceipt,
  Supplier,
  SupplierFormData
} from '../types/supplier'

export default function Suppliers(): React.JSX.Element {
  const { user } = useAuthStore()
  const { storeName, storePhone, storeEmail, storeAddress, currency } = useSettingsStore()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Pagination state
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [limit] = useState(50)

  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxNumber: '',
    openingBalance: '0',
    creditLimit: '0',
    creditDays: '0'
  })

  const [paymentData, setPaymentData] = useState<PaymentFormData>({
    amount: '',
    accountId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm])

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true)
      const [suppliersResponse, accountsData] = await Promise.all([
        window.api.suppliers.getPaginated({ page, limit, search: searchTerm }),
        window.api.bankAccounts.getAll()
      ])
      const typedSuppliers = suppliersResponse.data as unknown as Supplier[]
      const typedAccounts = accountsData as unknown as BankAccount[]
      setSuppliers(typedSuppliers)
      setTotalRecords(suppliersResponse.total)
      setBankAccounts(typedAccounts)
    } catch (error) {
      console.error('Failed to load suppliers:', error)
      toast.error('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (search: string): void => {
    setSearchTerm(search)
    setPage(1)
  }

  const handlePageChange = (newPage: number): void => {
    setPage(newPage)
  }

  const filteredSuppliers = suppliers

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!formData.name || !formData.code) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        openingBalance: parseFloat(formData.openingBalance) || 0,
        creditLimit: parseFloat(formData.creditLimit) || 0,
        creditDays: parseInt(formData.creditDays) || 0,
        ...(editingSupplier && { version: editingSupplier.version }) // Include version for optimistic locking
      }

      if (editingSupplier) {
        await window.api.suppliers.update(editingSupplier.id, submitData)
        toast.success('Supplier updated successfully')
      } else {
        await window.api.suppliers.create(submitData)
        toast.success('Supplier created successfully')
      }
      handleCloseModal()
      loadData()
    } catch (error) {
      console.error('Failed to save supplier:', error)
      // Handle concurrent edit error
      if (error instanceof Error && error.message.includes('CONCURRENT_EDIT')) {
        toast.error('This supplier was modified by another user. Please refresh and try again.')
        loadData() // Auto-refresh the data
        handleCloseModal()
      } else {
        toast.error(editingSupplier ? 'Failed to update supplier' : 'Failed to create supplier')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (supplier: Supplier): void => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      code: supplier.code,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      taxNumber: supplier.taxNumber || '',
      openingBalance: supplier.openingBalance?.toString() || '0',
      creditLimit: supplier.creditLimit?.toString() || '0',
      creditDays: supplier.creditDays?.toString() || '0'
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this supplier?')) return

    try {
      await window.api.suppliers.delete(id)
      toast.success('Supplier deleted successfully')
      loadData()
    } catch (error) {
      console.error('Failed to delete supplier:', error)
      toast.error('Failed to delete supplier')
    }
  }

  const handleCloseModal = (): void => {
    setShowModal(false)
    setEditingSupplier(null)
    setFormData({
      name: '',
      code: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      taxNumber: '',
      openingBalance: '0',
      creditLimit: '0',
      creditDays: '0'
    })
  }

  const handleRecordPayment = (supplier: Supplier): void => {
    setPayingSupplier(supplier)
    setPaymentData({
      amount: '',
      accountId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    if (!payingSupplier) {
      toast.error('No supplier selected')
      return
    }

    if (!user) {
      toast.error('User not authenticated')
      return
    }

    if (!paymentData.accountId) {
      toast.error('Please select a payment account')
      return
    }

    const totalBalance = (payingSupplier.openingBalance || 0) + (payingSupplier.currentBalance || 0)
    if (parseFloat(paymentData.amount) > totalBalance && totalBalance > 0) {
      toast.error(`Payment amount cannot exceed balance of $${totalBalance.toFixed(2)}`)
      return
    }

    const selectedAccount = bankAccounts.find((acc) => acc.id === paymentData.accountId)
    if (!selectedAccount) {
      toast.error('Selected account not found')
      return
    }

    if (selectedAccount.currentBalance < parseFloat(paymentData.amount)) {
      toast.error(
        `Insufficient balance in ${selectedAccount.name}. Available: $${selectedAccount.currentBalance.toFixed(2)}`
      )
      return
    }

    setLoading(true)
    try {
      const referenceNumber = `PAY-${Date.now()}`
      await window.api.supplierPayments.create({
        supplierId: payingSupplier.id,
        accountId: paymentData.accountId,
        userId: user.id,
        referenceNumber,
        amount: parseFloat(paymentData.amount),
        paymentMethod: 'bank',
        paymentDate: paymentData.paymentDate,
        notes: paymentData.notes
      })

      // Generate PDF receipt
      const paymentReceipt: PaymentReceipt = {
        referenceNumber,
        amount: parseFloat(paymentData.amount),
        accountName: selectedAccount.name,
        paymentDate: paymentData.paymentDate,
        notes: paymentData.notes
      }

      generatePaymentPDF(payingSupplier, paymentReceipt, {
        storeName,
        storePhone,
        storeEmail,
        storeAddress,
        currency,
        userName: user?.fullName
      })

      toast.success('Payment recorded successfully and receipt generated')
      handleClosePaymentModal()
      loadData()
    } catch (error) {
      console.error('Failed to record payment:', error)
      toast.error('Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  const handleClosePaymentModal = (): void => {
    setShowPaymentModal(false)
    setPayingSupplier(null)
    setPaymentData({
      amount: '',
      accountId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
    })
  }

  const generateCode = (): void => {
    const code = 'SUP' + Date.now().toString().slice(-6)
    setFormData({ ...formData, code })
  }

  const handleFormChange = (data: Partial<SupplierFormData>): void => {
    setFormData({ ...formData, ...data })
  }

  const handlePaymentDataChange = (data: Partial<PaymentFormData>): void => {
    setPaymentData({ ...paymentData, ...data })
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
      {/* Page Header */}
      <div data-tour="suppliers-header">
        <SupplierHeader />
      </div>

      {/* Stats Cards */}
      <div data-tour="suppliers-stats">
        <SupplierStats suppliers={suppliers} />
      </div>

      {/* Search Bar */}
      <div data-tour="suppliers-search">
        <SupplierSearchBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onAddClick={() => setShowModal(true)}
          onExportClick={() => setShowExportModal(true)}
        />
      </div>

      {/* Suppliers Table */}
      <div data-tour="suppliers-table">
        <SuppliersTable
          suppliers={filteredSuppliers}
          loading={loading}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRecordPayment={handleRecordPayment}
          page={page}
          totalRecords={totalRecords}
          limit={limit}
          onServerPageChange={handlePageChange}
        />
      </div>

      {/* Add/Edit Modal */}
      <SupplierFormModal
        show={showModal}
        editingSupplier={editingSupplier}
        formData={formData}
        loading={loading}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onFormChange={handleFormChange}
        onGenerateCode={generateCode}
      />

      {/* Payment Modal */}
      <PaymentModal
        show={showPaymentModal}
        supplier={payingSupplier}
        bankAccounts={bankAccounts}
        paymentData={paymentData}
        loading={loading}
        storeName={storeName}
        storePhone={storePhone}
        storeEmail={storeEmail}
        storeAddress={storeAddress}
        currency={currency}
        userName={user?.fullName}
        onClose={handleClosePaymentModal}
        onSubmit={handlePaymentSubmit}
        onPaymentDataChange={handlePaymentDataChange}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultExportType="suppliers"
      />
    </Container>
  )
}
