/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Box, Container, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DamagedItemDetailsModal from '../components/returns/DamagedItemDetailsModal'
import DamagedItemModal from '../components/returns/DamagedItemModal'
import DamagedItemsTable from '../components/returns/DamagedItemsTable'
import PurchaseReturnsTable from '../components/returns/PurchaseReturnsTable'
import ReturnDetailsModal from '../components/returns/ReturnDetailsModal'
import ReturnsTabs from '../components/returns/ReturnsTabs'
import SalesReturnsTable from '../components/returns/SalesReturnsTable'
import { useAuthStore } from '../store/authStore'
import { DamagedItem, Product, PurchaseReturn, SalesReturn, TabType } from '../types/return'

export default function Returns(): React.JSX.Element {
  const user = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = useState<TabType>('sales-returns')

  // Sales Returns
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([])
  const [filteredSalesReturns, setFilteredSalesReturns] = useState<SalesReturn[]>([])
  const [salesSearchTerm, setSalesSearchTerm] = useState('')
  const [salesPage, setSalesPage] = useState(1)
  const [salesTotalRecords, setSalesTotalRecords] = useState(0)
  const [salesLimit] = useState(50)
  const [salesCurrentPage, setSalesCurrentPage] = useState(1)
  const [salesItemsPerPage, setSalesItemsPerPage] = useState(25)

  // Purchase Returns
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([])
  const [filteredPurchaseReturns, setFilteredPurchaseReturns] = useState<PurchaseReturn[]>([])
  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState('')
  const [purchasePage, setPurchasePage] = useState(1)
  const [purchaseTotalRecords, setPurchaseTotalRecords] = useState(0)
  const [purchaseLimit] = useState(50)
  const [purchaseCurrentPage, setPurchaseCurrentPage] = useState(1)
  const [purchaseItemsPerPage, setPurchaseItemsPerPage] = useState(25)

  // Damaged/Expired Items
  const [damagedItems, setDamagedItems] = useState<DamagedItem[]>([])
  const [filteredDamagedItems, setFilteredDamagedItems] = useState<DamagedItem[]>([])
  const [damagedSearchTerm, setDamagedSearchTerm] = useState('')
  const [damagedPage, setDamagedPage] = useState(1)
  const [damagedTotalRecords, setDamagedTotalRecords] = useState(0)
  const [damagedLimit] = useState(50)
  const [damagedCurrentPage, setDamagedCurrentPage] = useState(1)
  const [damagedItemsPerPage, setDamagedItemsPerPage] = useState(25)

  // Modals
  const [showDamagedItemModal, setShowDamagedItemModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | PurchaseReturn | null>(null)
  const [showDamagedItemDetailsModal, setShowDamagedItemDetailsModal] = useState(false)
  const [selectedDamagedItem, setSelectedDamagedItem] = useState<DamagedItem | null>(null)

  // Form states for new damaged item
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [damageQuantity, setDamageQuantity] = useState(1)
  const [damageReason, setDamageReason] = useState<'expired' | 'damaged' | 'defective'>('expired')
  const [damageBatchNumber, setDamageBatchNumber] = useState('')
  const [damageExpiryDate, setDamageExpiryDate] = useState('')
  const [damageNotes, setDamageNotes] = useState('')

  // Product search for damaged items
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  useEffect(() => {
    void loadSalesReturns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesPage, salesSearchTerm])

  useEffect(() => {
    void loadPurchaseReturns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchasePage, purchaseSearchTerm])

  useEffect(() => {
    void loadDamagedItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [damagedPage, damagedSearchTerm])

  useEffect(() => {
    setSalesCurrentPage(1)
  }, [salesReturns])

  useEffect(() => {
    setPurchaseCurrentPage(1)
  }, [purchaseReturns])

  useEffect(() => {
    setDamagedCurrentPage(1)
  }, [damagedItems])

  useEffect(() => {
    if (productSearchTerm.length > 0) {
      void searchProducts()
    } else {
      setProducts([])
      setShowProductDropdown(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSearchTerm])

  const loadSalesReturns = async (): Promise<void> => {
    try {
      const response = await window.api.salesReturns.getPaginated({
        page: salesPage,
        limit: salesLimit,
        search: salesSearchTerm
      })
      const typedReturns = response.data as unknown as SalesReturn[]
      setSalesReturns(typedReturns)
      setFilteredSalesReturns(typedReturns)
      setSalesTotalRecords(response.total)
    } catch (error) {
      console.error('Failed to load sales returns:', error)
      toast.error('Failed to load sales returns')
    }
  }

  const loadPurchaseReturns = async (): Promise<void> => {
    try {
      const response = await window.api.purchaseReturns.getPaginated({
        page: purchasePage,
        limit: purchaseLimit,
        search: purchaseSearchTerm
      })
      const typedReturns = response.data as unknown as PurchaseReturn[]
      setPurchaseReturns(typedReturns)
      setFilteredPurchaseReturns(typedReturns)
      setPurchaseTotalRecords(response.total)
    } catch (error) {
      console.error('Failed to load purchase returns:', error)
      toast.error('Failed to load purchase returns')
    }
  }

  const loadDamagedItems = async (): Promise<void> => {
    try {
      const response = await window.api.damagedItems.getPaginated({
        page: damagedPage,
        limit: damagedLimit,
        search: damagedSearchTerm
      })
      const typedItems = response.data as unknown as DamagedItem[]
      setDamagedItems(typedItems)
      setFilteredDamagedItems(typedItems)
      setDamagedTotalRecords(response.total)
    } catch (error) {
      console.error('Failed to load damaged items:', error)
      toast.error('Failed to load damaged items')
    }
  }

  const handleSalesSearchChange = (search: string): void => {
    setSalesSearchTerm(search)
    setSalesPage(1)
  }

  const handleSalesPageChange = (newPage: number): void => {
    setSalesPage(newPage)
  }

  const handlePurchaseSearchChange = (search: string): void => {
    setPurchaseSearchTerm(search)
    setPurchasePage(1)
  }

  const handlePurchasePageChange = (newPage: number): void => {
    setPurchasePage(newPage)
  }

  const handleDamagedSearchChange = (search: string): void => {
    setDamagedSearchTerm(search)
    setDamagedPage(1)
  }

  const handleDamagedPageChange = (newPage: number): void => {
    setDamagedPage(newPage)
  }

  const searchProducts = async (): Promise<void> => {
    try {
      const results = await window.api.products.search(productSearchTerm)
      const typedResults = results as unknown as Product[]
      setProducts(typedResults)
      setShowProductDropdown(true)
    } catch {
      toast.error('Product search failed')
    }
  }

  const handleCreateDamagedItem = async (): Promise<void> => {
    if (!selectedProduct) {
      toast.error('Please select a product')
      return
    }

    if (damageQuantity <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    try {
      await window.api.damagedItems.create({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: damageQuantity,
        reason: damageReason,
        batchNumber: damageBatchNumber || null,
        expiryDate: damageExpiryDate || null,
        notes: damageNotes || null,
        reportedBy: user?.id || ''
      })

      toast.success('Damaged item recorded successfully')
      resetDamagedForm()
      setShowDamagedItemModal(false)
      void loadDamagedItems()
    } catch (error) {
      console.error('Failed to record damaged item:', error)
      toast.error('Failed to record damaged item')
    }
  }

  const resetDamagedForm = (): void => {
    setSelectedProduct(null)
    setDamageQuantity(1)
    setDamageReason('expired')
    setDamageBatchNumber('')
    setDamageExpiryDate('')
    setDamageNotes('')
    setProductSearchTerm('')
    setShowProductDropdown(false)
  }

  const handleViewDetails = async (returnItem: SalesReturn | PurchaseReturn): Promise<void> => {
    try {
      // Open modal with loading state first
      setSelectedReturn(null)
      setShowDetailsModal(true)

      const isSalesReturn = 'customerName' in returnItem

      // Fetch full details with items from database
      let fullReturn
      if (isSalesReturn) {
        fullReturn = await window.api.salesReturns.getById(returnItem.id)
      } else {
        fullReturn = await window.api.purchaseReturns.getById(returnItem.id)
      }

      if (!fullReturn) {
        throw new Error('Return not found')
      }

      // Set the full data
      setSelectedReturn(fullReturn)
    } catch (error) {
      console.error('Failed to load return details:', error)
      toast.error('Failed to load return details')
      setShowDetailsModal(false)
      setSelectedReturn(null)
    }
  }

  const handleViewDamagedItemDetails = (item: DamagedItem): void => {
    setSelectedDamagedItem(item)
    setShowDamagedItemDetailsModal(true)
  }

  const handleProductSearchChange = (term: string): void => {
    setProductSearchTerm(term)
    if (selectedProduct) setSelectedProduct(null)
  }

  const handleProductSelect = (product: Product): void => {
    setSelectedProduct(product)
    setProductSearchTerm('')
    setShowProductDropdown(false)
  }

  // Pagination calculations
  const salesTotalPages = Math.ceil(filteredSalesReturns.length / salesItemsPerPage)
  const paginatedSalesReturns = filteredSalesReturns.slice(
    (salesCurrentPage - 1) * salesItemsPerPage,
    salesCurrentPage * salesItemsPerPage
  )

  const purchaseTotalPages = Math.ceil(filteredPurchaseReturns.length / purchaseItemsPerPage)
  const paginatedPurchaseReturns = filteredPurchaseReturns.slice(
    (purchaseCurrentPage - 1) * purchaseItemsPerPage,
    purchaseCurrentPage * purchaseItemsPerPage
  )

  const damagedTotalPages = Math.ceil(filteredDamagedItems.length / damagedItemsPerPage)
  const paginatedDamagedItems = filteredDamagedItems.slice(
    (damagedCurrentPage - 1) * damagedItemsPerPage,
    damagedCurrentPage * damagedItemsPerPage
  )

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
      {/* Page Header */}
      <Box
        sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        data-tour="returns-header"
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Returns & Damage Tracking
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage sales returns, purchase returns, and damaged/expired inventory
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <div data-tour="returns-tabs">
        <ReturnsTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Tab Content */}
      {activeTab === 'sales-returns' && (
        <div data-tour="sales-returns-table">
          <SalesReturnsTable
            returns={paginatedSalesReturns}
            searchTerm={salesSearchTerm}
            onSearchChange={handleSalesSearchChange}
            currentPage={salesCurrentPage}
            totalPages={salesTotalPages}
            itemsPerPage={salesItemsPerPage}
            onPageChange={setSalesCurrentPage}
            onItemsPerPageChange={(items) => {
              setSalesItemsPerPage(items)
              setSalesCurrentPage(1)
            }}
            onViewDetails={handleViewDetails}
            page={salesPage}
            totalRecords={salesTotalRecords}
            limit={salesLimit}
            onServerPageChange={handleSalesPageChange}
          />
        </div>
      )}

      {activeTab === 'purchase-returns' && (
        <div data-tour="purchase-returns-table">
          <PurchaseReturnsTable
            returns={paginatedPurchaseReturns}
            searchTerm={purchaseSearchTerm}
            onSearchChange={handlePurchaseSearchChange}
            currentPage={purchaseCurrentPage}
            totalPages={purchaseTotalPages}
            itemsPerPage={purchaseItemsPerPage}
            onPageChange={setPurchaseCurrentPage}
            onItemsPerPageChange={(items) => {
              setPurchaseItemsPerPage(items)
              setPurchaseCurrentPage(1)
            }}
            onViewDetails={handleViewDetails}
            page={purchasePage}
            totalRecords={purchaseTotalRecords}
            limit={purchaseLimit}
            onServerPageChange={handlePurchasePageChange}
          />
        </div>
      )}

      {activeTab === 'damaged-expired' && (
        <div data-tour="damaged-items-table">
          <DamagedItemsTable
            items={paginatedDamagedItems}
            searchTerm={damagedSearchTerm}
            onSearchChange={handleDamagedSearchChange}
            currentPage={damagedCurrentPage}
            totalPages={damagedTotalPages}
            itemsPerPage={damagedItemsPerPage}
            onPageChange={setDamagedCurrentPage}
            onItemsPerPageChange={(items) => {
              setDamagedItemsPerPage(items)
              setDamagedCurrentPage(1)
            }}
            onAddDamagedItem={() => setShowDamagedItemModal(true)}
            onViewDetails={handleViewDamagedItemDetails}
            page={damagedPage}
            totalRecords={damagedTotalRecords}
            limit={damagedLimit}
            onServerPageChange={handleDamagedPageChange}
          />
        </div>
      )}

      {/* Modals */}
      <DamagedItemModal
        isOpen={showDamagedItemModal}
        onClose={() => {
          setShowDamagedItemModal(false)
          resetDamagedForm()
        }}
        selectedProduct={selectedProduct}
        productSearchTerm={productSearchTerm}
        products={products}
        showProductDropdown={showProductDropdown}
        quantity={damageQuantity}
        reason={damageReason}
        batchNumber={damageBatchNumber}
        expiryDate={damageExpiryDate}
        notes={damageNotes}
        onProductSearchChange={handleProductSearchChange}
        onProductSelect={handleProductSelect}
        onQuantityChange={setDamageQuantity}
        onReasonChange={setDamageReason}
        onBatchNumberChange={setDamageBatchNumber}
        onExpiryDateChange={setDamageExpiryDate}
        onNotesChange={setDamageNotes}
        onSubmit={handleCreateDamagedItem}
      />

      <ReturnDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedReturn(null)
        }}
        returnItem={selectedReturn}
      />

      <DamagedItemDetailsModal
        isOpen={showDamagedItemDetailsModal}
        onClose={() => {
          setShowDamagedItemDetailsModal(false)
          setSelectedDamagedItem(null)
        }}
        item={selectedDamagedItem}
      />
    </Container>
  )
}
