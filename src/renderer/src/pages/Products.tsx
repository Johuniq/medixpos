/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import AddIcon from '@mui/icons-material/Add'
import CategoryIcon from '@mui/icons-material/Category'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import UploadIcon from '@mui/icons-material/Upload'
import { Box, Button, Container, Paper, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import BulkActionsMenu from '../components/bulk/BulkActionsMenu'
import ExportModal from '../components/export/ExportModal'
import BulkImportModal from '../components/products/BulkImportModal'
import ProductBarcodeModal from '../components/products/ProductBarcodeModal'
import ProductFilters from '../components/products/ProductFilters'
import ProductFormModal from '../components/products/ProductFormModal'
import ProductsTable from '../components/products/ProductsTable'
import { useSettingsStore } from '../store/settingsStore'
import { Category, InventoryItem, Product, ProductFormData, Supplier, Unit } from '../types/product'

export default function Products(): React.JSX.Element {
  const currency = useSettingsStore((state) => state.currency)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [inventory, setInventory] = useState<Record<string, number>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showBarcodeModal, setShowBarcodeModal] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkActionsAnchor, setBulkActionsAnchor] = useState<null | HTMLElement>(null)

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

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setLoading(true)
        const [productsResponse, categoriesData, suppliersData, unitsData, inventoryData] =
          await Promise.all([
            window.api.products.getPaginated({ page, limit, search: searchTerm }),
            window.api.categories.getAll(),
            window.api.suppliers.getAll(),
            window.api.units.getAll(),
            window.api.inventory.getAll()
          ])
        const typedProducts = productsResponse.data as unknown as Product[]
        const typedCategories = categoriesData as unknown as Category[]
        const typedSuppliers = suppliersData as unknown as Supplier[]
        const typedUnits = unitsData as unknown as Unit[]
        const typedInventory = inventoryData as unknown as InventoryItem[]

        setProducts(typedProducts)
        setTotalRecords(productsResponse.total)
        setCategories(typedCategories)
        setSuppliers(typedSuppliers)
        setUnits(typedUnits)

        // Create inventory map: productId -> total quantity
        const inventoryMap: Record<string, number> = {}
        typedInventory.forEach((item) => {
          if (inventoryMap[item.productId]) {
            inventoryMap[item.productId] += item.quantity
          } else {
            inventoryMap[item.productId] = item.quantity
          }
        })
        setInventory(inventoryMap)
      } catch (error) {
        console.error('Failed to load products data:', error)
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [page, limit, searchTerm])

  const reloadData = async (): Promise<void> => {
    try {
      setLoading(true)
      const [productsResponse, categoriesData, suppliersData, unitsData, inventoryData] =
        await Promise.all([
          window.api.products.getPaginated({ page, limit, search: searchTerm }),
          window.api.categories.getAll(),
          window.api.suppliers.getAll(),
          window.api.units.getAll(),
          window.api.inventory.getAll()
        ])
      const typedProducts = productsResponse.data as unknown as Product[]
      const typedCategories = categoriesData as unknown as Category[]
      const typedSuppliers = suppliersData as unknown as Supplier[]
      const typedUnits = unitsData as unknown as Unit[]
      const typedInventory = inventoryData as unknown as InventoryItem[]

      setProducts(typedProducts)
      setTotalRecords(productsResponse.total)
      setCategories(typedCategories)
      setSuppliers(typedSuppliers)
      setUnits(typedUnits)

      // Create inventory map: productId -> total quantity
      const inventoryMap: Record<string, number> = {}
      typedInventory.forEach((item) => {
        if (inventoryMap[item.productId]) {
          inventoryMap[item.productId] += item.quantity
        } else {
          inventoryMap[item.productId] = item.quantity
        }
      })
      setInventory(inventoryMap)
    } catch (error) {
      console.error('Failed to load products data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Client-side category filtering on already paginated data
  const filteredProducts = categoryFilter
    ? products.filter((product) => product.categoryId === categoryFilter)
    : products

  const handlePageChange = (newPage: number): void => {
    setPage(newPage)
  }

  const handleSearchChange = (search: string): void => {
    setSearchTerm(search)
    setPage(1) // Reset to first page on search
  }

  const handleSubmit = async (formData: ProductFormData): Promise<void> => {
    if (!formData.name || !formData.sku || formData.sellingPrice <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const productData = {
        ...formData,
        categoryId: formData.categoryId || null,
        supplierId: formData.supplierId || null,
        barcode: formData.barcode || null,
        genericName: formData.genericName || null,
        description: formData.description || null,
        manufacturer: formData.manufacturer || null,
        isActive: true
      }

      if (editingProduct) {
        // Include version for optimistic locking
        const updateData = {
          ...productData,
          version: editingProduct.version
        }
        await window.api.products.update(editingProduct.id, updateData)
        // Update inventory quantity
        await window.api.inventory.updateQuantity(editingProduct.id, formData.stockQuantity)
        toast.success('Product updated successfully')
      } else {
        const newProduct = await window.api.products.create(productData)
        const typedNewProduct = newProduct as unknown as { id: string }
        // Create initial inventory record
        await window.api.inventory.updateQuantity(typedNewProduct.id, formData.stockQuantity)
        toast.success('Product created successfully')
      }
      handleCloseModal()
      reloadData()
    } catch (error) {
      console.error('Error saving product:', error)
      if (error instanceof Error) {
        // Handle concurrent edit error
        if (error.message.includes('CONCURRENT_EDIT')) {
          toast.error('This product was modified by another user. Please refresh and try again.')
          reloadData() // Auto-refresh the data
          handleCloseModal()
        } else {
          toast.error(`Failed to save product: ${error.message}`)
        }
      } else {
        toast.error('Failed to save product')
      }
    }
  }

  const handleEdit = (product: Product): void => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await window.api.products.delete(id)
      toast.success('Product deleted successfully')
      reloadData()
    } catch (error) {
      console.error('Failed to delete product:', error)
      toast.error('Failed to delete product')
    }
  }

  const handleCloseModal = (): void => {
    setShowModal(false)
    setEditingProduct(null)
  }

  const handleViewBarcode = (product: Product): void => {
    setSelectedProduct(product)
    setShowBarcodeModal(true)
  }

  const handleCloseBarcodeModal = (): void => {
    setShowBarcodeModal(false)
    setSelectedProduct(null)
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
      {/* Page Header */}
      <Box
        sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Products Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your pharmacy products inventory
          </Typography>
        </Box>
      </Box>

      {/* Action Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}
        >
          <div data-tour="product-filters">
            <ProductFilters
              searchTerm={searchTerm}
              categoryFilter={categoryFilter}
              categories={categories}
              onSearchChange={handleSearchChange}
              onCategoryFilterChange={setCategoryFilter}
            />
          </div>
          <Box sx={{ display: 'flex', gap: 2, mt: { xs: 2, sm: 0 } }}>
            <div data-tour="add-product">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingProduct(null)
                  setShowModal(true)
                }}
              >
                Add Product
              </Button>
            </div>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<CategoryIcon />}
              component="a"
              href="#/categories-units"
            >
              Manage Categories & Units
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Table Header with Bulk Import & Export */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {selectedIds.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {selectedIds.length} item(s) selected
            </Typography>
            <Button
              variant="outlined"
              startIcon={<MoreVertIcon />}
              onClick={(e) => setBulkActionsAnchor(e.currentTarget)}
            >
              Bulk Actions
            </Button>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
          <div data-tour="export-import">
            <Button
              variant="outlined"
              startIcon={<CloudDownloadIcon />}
              onClick={() => setShowExportModal(true)}
            >
              Export Data
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setShowBulkImportModal(true)}
              sx={{ ml: 2 }}
            >
              Bulk Import
            </Button>
          </div>
        </Box>
      </Box>

      {/* Products Table */}
      <div data-tour="product-list">
        <ProductsTable
          products={filteredProducts}
          categories={categories}
          inventory={inventory}
          currencySymbol={getCurrencySymbol()}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewBarcode={handleViewBarcode}
          page={page}
          totalRecords={totalRecords}
          limit={limit}
          onPageChange={handlePageChange}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={showModal}
        editingProduct={editingProduct}
        suppliers={suppliers}
        categories={categories}
        units={units}
        currencySymbol={getCurrencySymbol()}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />

      {/* Product Barcode Modal */}
      <ProductBarcodeModal
        isOpen={showBarcodeModal}
        product={selectedProduct}
        currencySymbol={getCurrencySymbol()}
        onClose={handleCloseBarcodeModal}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImportComplete={reloadData}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultExportType="products"
      />

      {/* Bulk Actions Menu */}
      <BulkActionsMenu
        anchorEl={bulkActionsAnchor}
        open={Boolean(bulkActionsAnchor)}
        onClose={() => setBulkActionsAnchor(null)}
        selectedIds={selectedIds}
        entityType="products"
        onSuccess={() => {
          setSelectedIds([])
          reloadData()
        }}
      />
    </Container>
  )
}
