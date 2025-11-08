/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Container } from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import BalanceAdjustmentModal from '../components/bankAccounts/BalanceAdjustmentModal'
import BankAccountFormModal from '../components/bankAccounts/BankAccountFormModal'
import BankAccountHeader from '../components/bankAccounts/BankAccountHeader'
import BankAccountSearchBar from '../components/bankAccounts/BankAccountSearchBar'
import BankAccountsTable from '../components/bankAccounts/BankAccountsTable'
import BankAccountStats from '../components/bankAccounts/BankAccountStats'
import { usePermissions } from '../hooks/usePermissions'
import { useAuthStore } from '../store/authStore'
import { BalanceAdjustmentData, BankAccount, BankAccountFormData } from '../types/bankAccount'

export default function BankAccounts(): React.JSX.Element {
  const { hasPermission } = usePermissions()
  const user = useAuthStore((state) => state.user)
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [limit] = useState(50)
  const [showModal, setShowModal] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [adjustingAccount, setAdjustingAccount] = useState<BankAccount | null>(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<BankAccountFormData>({
    name: '',
    accountType: 'cash',
    accountNumber: '',
    bankName: '',
    branchName: '',
    accountHolder: '',
    openingBalance: '0',
    description: ''
  })

  const [adjustmentData, setAdjustmentData] = useState<BalanceAdjustmentData>({
    amount: '',
    type: 'credit',
    reason: ''
  })

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm])

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await window.api.bankAccounts.getPaginated({
        page,
        limit,
        search: searchTerm
      })
      const typedAccounts = response.data as unknown as BankAccount[]
      setAccounts(typedAccounts)
      setTotalRecords(response.total)
    } catch (error) {
      console.error('Failed to load bank accounts:', error)
      toast.error('Failed to load bank accounts')
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

  const filteredAccounts = accounts

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!formData.name || !formData.accountType) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        openingBalance: parseFloat(formData.openingBalance) || 0,
        ...(editingAccount && { version: editingAccount.version }) // Include version for optimistic locking
      }

      if (editingAccount) {
        await window.api.bankAccounts.update(editingAccount.id, submitData)
        toast.success('Account updated successfully')
      } else {
        await window.api.bankAccounts.create(submitData)
        toast.success('Account created successfully')
      }
      handleCloseModal()
      loadData()
    } catch (error) {
      console.error('Failed to save account:', error)
      // Handle concurrent edit error
      if (error instanceof Error && error.message.includes('CONCURRENT_EDIT')) {
        toast.error('This account was modified by another user. Please refresh and try again.')
        loadData() // Auto-refresh the data
        handleCloseModal()
      } else {
        toast.error(editingAccount ? 'Failed to update account' : 'Failed to create account')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (account: BankAccount): void => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      accountType: account.accountType,
      accountNumber: account.accountNumber || '',
      bankName: account.bankName || '',
      branchName: account.branchName || '',
      accountHolder: account.accountHolder || '',
      openingBalance: account.openingBalance?.toString() || '0',
      description: account.description || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this account?')) return

    try {
      await window.api.bankAccounts.delete(id)
      toast.success('Account deleted successfully')
      loadData()
    } catch (error) {
      console.error('Failed to delete account:', error)
      toast.error('Failed to delete account')
    }
  }

  const handleCloseModal = (): void => {
    setShowModal(false)
    setEditingAccount(null)
    setFormData({
      name: '',
      accountType: 'cash',
      accountNumber: '',
      bankName: '',
      branchName: '',
      accountHolder: '',
      openingBalance: '0',
      description: ''
    })
  }

  const handleAdjustBalance = (account: BankAccount): void => {
    setAdjustingAccount(account)
    setAdjustmentData({
      amount: '',
      type: 'credit',
      reason: ''
    })
    setShowAdjustmentModal(true)
  }

  const handleSubmitAdjustment = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!adjustingAccount || !adjustmentData.amount || !adjustmentData.reason) {
      toast.error('Please fill in all required fields')
      return
    }

    const amount = parseFloat(adjustmentData.amount)
    if (amount <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    setLoading(true)
    try {
      await window.api.bankAccounts.updateBalance(
        adjustingAccount.id,
        amount,
        adjustmentData.type,
        user?.id || null,
        user?.username || null
      )
      toast.success(
        `Balance ${adjustmentData.type === 'credit' ? 'increased' : 'decreased'} successfully`
      )
      handleCloseAdjustmentModal()
      loadData()
    } catch (error) {
      console.error('Failed to adjust balance:', error)
      toast.error('Failed to adjust balance')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseAdjustmentModal = (): void => {
    setShowAdjustmentModal(false)
    setAdjustingAccount(null)
    setAdjustmentData({
      amount: '',
      type: 'credit',
      reason: ''
    })
  }

  const handleFormChange = (data: Partial<BankAccountFormData>): void => {
    setFormData({ ...formData, ...data })
  }

  const handleAdjustmentDataChange = (data: Partial<BalanceAdjustmentData>): void => {
    setAdjustmentData({ ...adjustmentData, ...data })
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
      <div data-tour="bank-accounts-header">
        <BankAccountHeader />
      </div>

      <div data-tour="bank-accounts-stats">
        <BankAccountStats accounts={accounts} />
      </div>

      <div data-tour="bank-accounts-search">
        <BankAccountSearchBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onAddClick={() => setShowModal(true)}
        />
      </div>

      <div data-tour="bank-accounts-table">
        <BankAccountsTable
          accounts={filteredAccounts}
          loading={loading}
          hasAdjustPermission={hasPermission('manage_roles')}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdjustBalance={handleAdjustBalance}
          page={page}
          totalRecords={totalRecords}
          limit={limit}
          onServerPageChange={handlePageChange}
        />
      </div>

      <BankAccountFormModal
        show={showModal}
        editingAccount={editingAccount}
        formData={formData}
        loading={loading}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onFormChange={handleFormChange}
      />

      <BalanceAdjustmentModal
        show={showAdjustmentModal}
        account={adjustingAccount}
        adjustmentData={adjustmentData}
        loading={loading}
        onClose={handleCloseAdjustmentModal}
        onSubmit={handleSubmitAdjustment}
        onAdjustmentDataChange={handleAdjustmentDataChange}
      />
    </Container>
  )
}
