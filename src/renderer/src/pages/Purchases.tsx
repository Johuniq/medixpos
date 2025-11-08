/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Box, Container, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ExportModal from '../components/export/ExportModal'
import AddPurchaseModal from '../components/purchases/AddPurchaseModal'
import PurchaseDetailsModal from '../components/purchases/PurchaseDetailsModal'
import PurchaseFilters from '../components/purchases/PurchaseFilters'
import PurchaseReturnModal from '../components/purchases/PurchaseReturnModal'
import PurchaseStats from '../components/purchases/PurchaseStats'
import PurchasesTable from '../components/purchases/PurchasesTable'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import { BankAccount, Product, Purchase, PurchaseItem, Supplier } from '../types/purchase'

export default function Purchases(): React.JSX.Element {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [limit] = useState(50)
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])

  const currency = useSettingsStore((state) => state.currency)

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

  useEffect(() => {
    loadPurchases()
    loadSuppliers()
    loadProducts()
    loadAccounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm])

  useEffect(() => {
    filterPurchases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchases, statusFilter, paymentFilter])

  const loadPurchases = async (): Promise<void> => {
    try {
      const response = await window.api.purchases.getPaginated({
        page,
        limit,
        search: searchTerm
      })
      const typedPurchases = response.data as unknown as Purchase[]
      setPurchases(typedPurchases)
      setTotalRecords(response.total)
    } catch {
      toast.error('Failed to load purchases')
    }
  }

  const handleSearchChange = (search: string): void => {
    setSearchTerm(search)
    setPage(1)
  }

  const handlePageChange = (newPage: number): void => {
    setPage(newPage)
  }

  const loadSuppliers = async (): Promise<void> => {
    try {
      const allSuppliers = await window.api.suppliers.getAll()
      const typedSuppliers = allSuppliers as unknown as Supplier[]
      setSuppliers(typedSuppliers)
    } catch {
      toast.error('Failed to load suppliers')
    }
  }

  const loadProducts = async (): Promise<void> => {
    try {
      const allProducts = await window.api.products.getAll()
      const typedProducts = allProducts as unknown as Product[]
      setProducts(typedProducts)
    } catch {
      toast.error('Failed to load products')
    }
  }

  const loadAccounts = async (): Promise<void> => {
    try {
      const allAccountsData = await window.api.bankAccounts.getAll()
      const allAccounts = allAccountsData as unknown as BankAccount[]
      setAccounts(allAccounts.filter((acc) => acc.isActive))
    } catch {
      toast.error('Failed to load accounts')
    }
  }

  const filterPurchases = (): void => {
    let filtered = [...purchases]

    if (searchTerm) {
      filtered = filtered.filter(
        (purchase) =>
          purchase.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          purchase.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((purchase) => purchase.status === statusFilter)
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter((purchase) => purchase.paymentStatus === paymentFilter)
    }

    setFilteredPurchases(filtered)
  }

  const viewPurchaseDetails = async (purchase: Purchase): Promise<void> => {
    try {
      setSelectedPurchase(purchase)
      const purchaseWithItemsData = await window.api.purchases.getById(purchase.id)
      const purchaseWithItems = purchaseWithItemsData as unknown as { items: PurchaseItem[] }
      if (purchaseWithItems && purchaseWithItems.items) {
        setPurchaseItems(purchaseWithItems.items)
      }
      setShowDetailsModal(true)
    } catch {
      toast.error('Failed to load purchase details')
    }
  }

  // Calculate stats
  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0)
  const totalPaid = filteredPurchases.reduce((sum, p) => sum + p.paidAmount, 0)
  const totalDue = filteredPurchases.reduce((sum, p) => sum + p.dueAmount, 0)
  const totalTransactions = filteredPurchases.length

  // Event handlers
  const handleViewDetails = (purchase: Purchase): void => {
    viewPurchaseDetails(purchase)
  }

  const handleDelete = (purchase: Purchase): void => {
    setPurchaseToDelete(purchase)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async (): Promise<void> => {
    if (!purchaseToDelete) return

    try {
      const user = useAuthStore.getState().user
      if (!user) {
        toast.error('User not authenticated')
        setShowDeleteDialog(false)
        return
      }

      await window.api.purchases.delete(purchaseToDelete.id, user.id)
      toast.success('Purchase deleted successfully')
      setShowDeleteDialog(false)
      setPurchaseToDelete(null)
      loadPurchases()
    } catch (error) {
      console.error('Failed to delete purchase:', error)
      toast.error('Failed to delete purchase')
      setShowDeleteDialog(false)
    }
  }

  const handleCancelDelete = (): void => {
    setShowDeleteDialog(false)
    setPurchaseToDelete(null)
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }} data-tour="purchases-header">
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Purchase Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage purchase orders and supplier transactions
        </Typography>
      </Box>

      {/* Stats Cards */}
      <div data-tour="purchases-stats">
        <PurchaseStats
          totalPurchases={totalPurchases}
          totalPaid={totalPaid}
          totalDue={totalDue}
          totalTransactions={totalTransactions}
          currencySymbol={getCurrencySymbol()}
        />
      </div>

      {/* Filters */}
      <div data-tour="purchases-filters">
        <PurchaseFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          paymentFilter={paymentFilter}
          onSearchChange={handleSearchChange}
          onStatusFilterChange={setStatusFilter}
          onPaymentFilterChange={setPaymentFilter}
          onAddPurchase={() => setShowAddModal(true)}
          onPurchaseReturn={() => setShowReturnModal(true)}
          onExportClick={() => setShowExportModal(true)}
        />
      </div>

      {/* Purchases Table */}
      <div data-tour="purchases-table">
        <PurchasesTable
          purchases={filteredPurchases}
          currencySymbol={getCurrencySymbol()}
          onViewDetails={handleViewDetails}
          onDelete={handleDelete}
          page={page}
          totalRecords={totalRecords}
          limit={limit}
          onServerPageChange={handlePageChange}
        />
      </div>

      {/* Purchase Details Modal */}
      <PurchaseDetailsModal
        isOpen={showDetailsModal}
        purchase={selectedPurchase}
        items={purchaseItems}
        currencySymbol={getCurrencySymbol()}
        onClose={() => setShowDetailsModal(false)}
      />

      {/* Add Purchase Modal */}
      <AddPurchaseModal
        isOpen={showAddModal}
        suppliers={suppliers}
        products={products}
        accounts={accounts}
        currencySymbol={getCurrencySymbol()}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadPurchases}
      />

      {/* Purchase Return Modal */}
      <PurchaseReturnModal
        isOpen={showReturnModal}
        purchases={purchases}
        accounts={accounts}
        currencySymbol={getCurrencySymbol()}
        onClose={() => setShowReturnModal(false)}
        onSuccess={loadPurchases}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Purchase"
        message={`Are you sure you want to delete purchase ${purchaseToDelete?.invoiceNumber}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultExportType="purchases"
      />
    </Container>
  )
}
