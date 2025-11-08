/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Box, Container, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ExportModal from '../components/export/ExportModal'
import InventoryDetailsModal from '../components/inventory/InventoryDetailsModal'
import InventoryFilters from '../components/inventory/InventoryFilters'
import InventoryStats from '../components/inventory/InventoryStats'
import InventoryTable from '../components/inventory/InventoryTable'
import StockAdjustmentModal from '../components/inventory/StockAdjustmentModal'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import {
  Category,
  InventoryItem,
  InventoryWithProduct,
  Product,
  StockAdjustmentFormData
} from '../types/inventory'

export default function Inventory(): React.JSX.Element {
  const currency = useSettingsStore((state) => state.currency)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all')
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryWithProduct | null>(null)
  const [loading, setLoading] = useState(false)

  // Pagination state
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [limit] = useState(50)

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

  const [formData, setFormData] = useState<StockAdjustmentFormData>({
    productId: '',
    quantity: 0,
    batchNumber: '',
    expiryDate: ''
  })

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm])

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true)
      const [inventoryResponse, productsData, categoriesData] = await Promise.all([
        window.api.inventory.getPaginated({ page, limit, search: searchTerm }),
        window.api.products.getAll(),
        window.api.categories.getAll()
      ])
      const typedInventory = inventoryResponse.data as unknown as InventoryItem[]
      const typedProducts = productsData as unknown as Product[]
      const typedCategories = categoriesData as unknown as Category[]
      setInventory(typedInventory)
      setTotalRecords(inventoryResponse.total)
      setProducts(typedProducts)
      setCategories(typedCategories)
    } catch {
      toast.error('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  const inventoryWithProducts: InventoryWithProduct[] = inventory
    .map((item) => ({
      ...item,
      product: products.find((p) => p.id === item.productId)
    }))
    .filter((item) => item.product)

  // Client-side filtering for low/out of stock (on already paginated data)
  const filteredInventory = inventoryWithProducts.filter((item) => {
    const product = item.product!

    if (filterType === 'low') {
      return item.quantity > 0 && item.quantity <= product.reorderLevel
    } else if (filterType === 'out') {
      return item.quantity === 0
    }
    return true
  })

  const handleSearchChange = (search: string): void => {
    setSearchTerm(search)
    setPage(1) // Reset to first page on search
  }

  const handlePageChange = (newPage: number): void => {
    setPage(newPage)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!formData.productId || formData.quantity < 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const currentUser = useAuthStore.getState().user
      const options = {
        userId: currentUser?.id,
        username: currentUser?.username,
        ...(editingItem && { version: editingItem.version })
      }

      if (editingItem) {
        await window.api.inventory.updateQuantity(formData.productId, formData.quantity, options)
        toast.success('Inventory updated successfully')
      } else {
        await window.api.inventory.updateQuantity(formData.productId, formData.quantity, options)
        toast.success('Inventory added successfully')
      }
      handleCloseModal()
      loadData()
    } catch (error) {
      // Handle concurrent edit error
      if (error instanceof Error && error.message.includes('CONCURRENT_EDIT')) {
        toast.error('This inventory was modified by another user. Please refresh and try again.')
        loadData() // Auto-refresh the data
        handleCloseModal()
      } else {
        toast.error('Failed to save inventory')
      }
    }
  }

  const handleEdit = (item: InventoryWithProduct): void => {
    setEditingItem(item)
    setFormData({
      productId: item.productId,
      quantity: item.quantity,
      batchNumber: item.batchNumber || '',
      expiryDate: item.expiryDate || ''
    })
    setShowModal(true)
  }

  const handleCloseModal = (): void => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({
      productId: '',
      quantity: 0,
      batchNumber: '',
      expiryDate: ''
    })
  }

  const handleFilterChange = (value: 'all' | 'low' | 'out'): void => {
    setFilterType(value)
  }

  const handleViewDetails = (item: InventoryWithProduct): void => {
    setSelectedItem(item)
    setShowDetailsModal(true)
  }

  const handleCloseDetailsModal = (): void => {
    setShowDetailsModal(false)
    setSelectedItem(null)
  }

  // Calculate stats
  const lowStockCount = inventoryWithProducts.filter(
    (item) => item.product && item.quantity > 0 && item.quantity <= item.product.reorderLevel
  ).length

  const outOfStockCount = inventoryWithProducts.filter((item) => item.quantity === 0).length

  const totalValue = inventoryWithProducts.reduce((sum, item) => {
    return sum + (item.product?.costPrice || 0) * item.quantity
  }, 0)

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
      {/* Page Header */}
      <Box
        sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        data-tour="inventory-header"
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Inventory Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage stock levels across your pharmacy
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <div data-tour="inventory-stats">
        <InventoryStats
          totalItems={inventoryWithProducts.length}
          lowStockCount={lowStockCount}
          outOfStockCount={outOfStockCount}
          totalValue={totalValue}
          currencySymbol={getCurrencySymbol()}
        />
      </div>

      {/* Action Bar */}
      <div data-tour="inventory-filters">
        <InventoryFilters
          searchTerm={searchTerm}
          filterType={filterType}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onAdjustStock={() => setShowModal(true)}
          onExportClick={() => setShowExportModal(true)}
        />
      </div>

      {/* Inventory Table */}
      <div data-tour="inventory-table">
        <InventoryTable
          inventory={filteredInventory}
          categories={categories}
          loading={loading}
          currencySymbol={getCurrencySymbol()}
          onEdit={handleEdit}
          onViewDetails={handleViewDetails}
          page={page}
          totalRecords={totalRecords}
          limit={limit}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={showModal}
        onClose={handleCloseModal}
        editingItem={editingItem}
        products={products}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
      />

      {/* Inventory Details Modal */}
      <InventoryDetailsModal
        isOpen={showDetailsModal}
        item={selectedItem}
        category={
          selectedItem?.product
            ? categories.find((c) => c.id === selectedItem.product?.categoryId) || null
            : null
        }
        currencySymbol={getCurrencySymbol()}
        onClose={handleCloseDetailsModal}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultExportType="inventory"
      />
    </Container>
  )
}
