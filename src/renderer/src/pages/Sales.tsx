/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Box, Container, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ExportModal from '../components/export/ExportModal'
import SaleDetailsModal from '../components/sales/SaleDetailsModal'
import SaleReturnModal from '../components/sales/SaleReturnModal'
import SalesFilters from '../components/sales/SalesFilters'
import SalesStats from '../components/sales/SalesStats'
import SalesTable from '../components/sales/SalesTable'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import { BankAccount, ReturnFormData, ReturnItem, Sale, SaleItem } from '../types/sale'

export default function Sales(): React.JSX.Element {
  const user = useAuthStore((state) => state.user)
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [limit] = useState(50)
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])

  // Return form state
  const [returnFormData, setReturnFormData] = useState<ReturnFormData>({
    saleId: '',
    accountId: '',
    refundAmount: 0,
    reason: '',
    notes: ''
  })

  const [returnItems, setReturnItems] = useState<ReturnItem[]>([])

  const currency = useSettingsStore((state) => state.currency)
  const storeName = useSettingsStore((state) => state.storeName)
  const storeAddress = useSettingsStore((state) => state.storeAddress)
  const storePhone = useSettingsStore((state) => state.storePhone)

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
    loadSales()
    loadAccounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm])

  useEffect(() => {
    filterSales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, statusFilter, paymentFilter])

  const loadSales = async (): Promise<void> => {
    try {
      const response = await window.api.sales.getPaginated({
        page,
        limit,
        search: searchTerm
      })
      setSales(response.data as unknown as Sale[])
      setTotalRecords(response.total)
    } catch {
      toast.error('Failed to load sales')
    }
  }

  const handleSearchChange = (search: string): void => {
    setSearchTerm(search)
    setPage(1)
  }

  const handlePageChange = (newPage: number): void => {
    setPage(newPage)
  }

  const loadAccounts = async (): Promise<void> => {
    try {
      const allAccounts = await window.api.bankAccounts.getAll()
      const typedAccounts = allAccounts as unknown as BankAccount[]
      setAccounts(typedAccounts.filter((acc) => acc.isActive))
    } catch {
      toast.error('Failed to load accounts')
    }
  }

  const filterSales = (): void => {
    let filtered = [...sales]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (sale) =>
          sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((sale) => sale.status === statusFilter)
    }

    // Payment method filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter((sale) => sale.paymentMethod === paymentFilter)
    }

    setFilteredSales(filtered)
  }

  const viewSaleDetails = async (sale: Sale): Promise<void> => {
    try {
      setSelectedSale(sale)
      const saleWithItems = (await window.api.sales.getById(sale.id)) as unknown as Sale & {
        items: SaleItem[]
      }
      if (saleWithItems && saleWithItems.items) {
        setSaleItems(saleWithItems.items)
      }
      setShowDetailsModal(true)
    } catch {
      toast.error('Failed to load sale details')
    }
  }

  const handlePrint = async (sale: Sale): Promise<void> => {
    try {
      // Get full sale details with items
      const saleWithItems = (await window.api.sales.getById(sale.id)) as unknown as Sale & {
        items: SaleItem[]
      }
      if (!saleWithItems || !saleWithItems.items) {
        toast.error('Failed to load invoice details')
        return
      }

      // Create a printable invoice HTML
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Please allow pop-ups to print invoices')
        return
      }

      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${sale.invoiceNumber}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
              }
              .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                border: 1px solid #ddd;
                padding: 30px;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
              }
              .header h1 {
                margin: 0;
                color: #1e40af;
              }
              .info-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
              }
              .info-block {
                flex: 1;
              }
              .info-block h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #666;
                text-transform: uppercase;
              }
              .info-block p {
                margin: 5px 0;
                font-size: 14px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              th {
                background-color: #f3f4f6;
                padding: 12px;
                text-align: left;
                font-size: 12px;
                text-transform: uppercase;
                border-bottom: 2px solid #ddd;
              }
              td {
                padding: 12px;
                border-bottom: 1px solid #eee;
                font-size: 14px;
              }
              .text-right {
                text-align: right;
              }
              .totals {
                float: right;
                width: 300px;
                margin-top: 20px;
              }
              .totals-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                font-size: 14px;
              }
              .totals-row.total {
                border-top: 2px solid #333;
                font-weight: bold;
                font-size: 16px;
                margin-top: 10px;
                padding-top: 10px;
              }
              .footer {
                clear: both;
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
              @media print {
                body {
                  padding: 0;
                }
                .invoice-container {
                  border: none;
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="header">
                <h1>PHARMACY POS</h1>
                <p style="margin: 5px 0;">Sales Invoice</p>
              </div>

              <div class="info-section">
                <div class="info-block">
                  <h3>Invoice Details</h3>
                  <p><strong>Invoice #:</strong> ${sale.invoiceNumber}</p>
                  <p><strong>Date:</strong> ${new Date(sale.createdAt).toLocaleString()}</p>
                  <p><strong>Status:</strong> ${sale.status.toUpperCase()}</p>
                </div>
                <div class="info-block">
                  <h3>Customer Information</h3>
                  <p><strong>Name:</strong> ${sale.customerName || 'Walk-in Customer'}</p>
                  <p><strong>Payment:</strong> ${sale.paymentMethod.toUpperCase()}</p>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Price</th>
                    <th class="text-right">Discount</th>
                    <th class="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${saleWithItems.items
                    .map(
                      (item: SaleItem) => `
                    <tr>
                      <td>${item.productName}</td>
                      <td class="text-right">${item.quantity}</td>
                      <td class="text-right">$${item.unitPrice.toFixed(2)}</td>
                      <td class="text-right">${item.discountPercent}%</td>
                      <td class="text-right">$${item.subtotal.toFixed(2)}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>

              <div class="totals">
                <div class="totals-row">
                  <span>Paid Amount:</span>
                  <span>$${sale.paidAmount.toFixed(2)}</span>
                </div>
                <div class="totals-row">
                  <span>Change:</span>
                  <span>$${sale.changeAmount.toFixed(2)}</span>
                </div>
                <div class="totals-row total">
                  <span>Total Amount:</span>
                  <span>$${sale.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div class="footer">
                <p>Thank you for your business!</p>
                <p>This is a computer generated invoice.</p>
              </div>
            </div>
          </body>
        </html>
      `

      printWindow.document.write(invoiceHTML)
      printWindow.document.close()

      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          // Don't close automatically, let user close after printing
        }, 250)
      }

      toast.success(`Invoice ${sale.invoiceNumber} ready to print`)
    } catch {
      toast.error('Failed to print invoice')
    }
  }

  const handleSaleSelect = async (saleId: string): Promise<void> => {
    setReturnFormData({ ...returnFormData, saleId })

    if (saleId) {
      const sale = (await window.api.sales.getById(saleId)) as unknown as Sale & {
        items: (SaleItem & { productId: string })[]
      }
      if (sale && sale.items) {
        setReturnItems(
          sale.items.map((item: SaleItem & { productId: string }) => ({
            saleItemId: item.id,
            productId: item.productId,
            productName: item.productName,
            quantity: 0,
            unitPrice: item.unitPrice,
            maxQuantity: item.quantity
          }))
        )
      }
    } else {
      setReturnItems([])
    }
  }

  const handleReturnSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      if (!user) {
        toast.error('User not authenticated')
        return
      }

      if (!returnFormData.saleId) {
        toast.error('Please select a sale')
        return
      }

      // Filter return items with quantity > 0
      const validReturnItems = returnItems.filter((item) => item.quantity > 0)

      if (validReturnItems.length === 0) {
        toast.error('Please add at least one item to return')
        return
      }

      if (!returnFormData.reason) {
        toast.error('Please provide a return reason')
        return
      }

      const sale = (await window.api.sales.getById(returnFormData.saleId)) as unknown as Sale
      if (!sale) {
        toast.error('Sale not found')
        return
      }

      const totalAmount = validReturnItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      )

      // Prepare return items with all required fields
      const returnItemsWithSubtotal = validReturnItems.map((item) => ({
        saleItemId: item.saleItemId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: 0,
        taxRate: 0,
        subtotal: item.quantity * item.unitPrice
      }))

      await window.api.salesReturns.create(
        {
          returnNumber: `SR-${Date.now()}`,
          saleId: returnFormData.saleId,
          customerId: (sale as Sale & { customerId?: string }).customerId || null,
          accountId: returnFormData.accountId || null,
          userId: user.id,
          subtotal: totalAmount,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount,
          refundAmount: returnFormData.refundAmount,
          refundStatus:
            returnFormData.refundAmount >= totalAmount
              ? 'refunded'
              : returnFormData.refundAmount > 0
                ? 'partial'
                : 'pending',
          reason: returnFormData.reason,
          notes: returnFormData.notes
        },
        returnItemsWithSubtotal
      )

      toast.success('Sales return created successfully')
      setShowReturnModal(false)
      setReturnFormData({
        saleId: '',
        accountId: '',
        refundAmount: 0,
        reason: '',
        notes: ''
      })
      setReturnItems([])
      await loadSales()
    } catch (error) {
      console.error('Failed to create sales return:', error)
      toast.error('Failed to create sales return')
    }
  }

  const handleReturnModalClose = (): void => {
    setShowReturnModal(false)
    setReturnFormData({
      saleId: '',
      accountId: '',
      refundAmount: 0,
      reason: '',
      notes: ''
    })
    setReturnItems([])
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
      {/* Page Header */}
      <Box
        sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        data-tour="sales-header"
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Sales History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage all sales transactions
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <div data-tour="sales-stats">
        <SalesStats sales={filteredSales} currencySymbol={getCurrencySymbol()} />
      </div>

      {/* Filters */}
      <div data-tour="sales-filters">
        <SalesFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          paymentFilter={paymentFilter}
          onSearchChange={handleSearchChange}
          onStatusFilterChange={setStatusFilter}
          onPaymentFilterChange={setPaymentFilter}
          onReturnClick={() => setShowReturnModal(true)}
          onExportClick={() => setShowExportModal(true)}
        />
      </div>

      {/* Sales Table */}
      <div data-tour="sales-table">
        <SalesTable
          sales={filteredSales}
          currencySymbol={getCurrencySymbol()}
          onViewDetails={viewSaleDetails}
          onPrint={handlePrint}
          page={page}
          totalRecords={totalRecords}
          limit={limit}
          onServerPageChange={handlePageChange}
        />
      </div>

      {/* Sale Details Modal */}
      <SaleDetailsModal
        isOpen={showDetailsModal}
        sale={selectedSale}
        saleItems={saleItems}
        currencySymbol={getCurrencySymbol()}
        storeName={storeName}
        storeAddress={storeAddress}
        storePhone={storePhone}
        onClose={() => setShowDetailsModal(false)}
      />

      {/* Sales Return Modal */}
      <SaleReturnModal
        isOpen={showReturnModal}
        sales={sales}
        accounts={accounts}
        returnFormData={returnFormData}
        returnItems={returnItems}
        currencySymbol={getCurrencySymbol()}
        onClose={handleReturnModalClose}
        onSubmit={handleReturnSubmit}
        onReturnFormDataChange={setReturnFormData}
        onReturnItemsChange={setReturnItems}
        onSaleSelect={handleSaleSelect}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultExportType="sales"
      />
    </Container>
  )
}
