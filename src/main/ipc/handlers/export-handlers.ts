/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { and, gte, lte } from 'drizzle-orm'
import { dialog, ipcMain } from 'electron'
import ExcelJS from 'exceljs'
import fs from 'fs'
import { getDatabase } from '../../database'
import { customers, inventory, products, purchases, sales, suppliers } from '../../database/schema'

interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json'
  startDate?: string
  endDate?: string
  filters?: Record<string, unknown>
}

interface ExportResult {
  success: boolean
  filePath?: string
  error?: string
  recordCount?: number
}

/**
 * Export products to file
 */
ipcMain.handle('db:export:products', async (_, options: ExportOptions): Promise<ExportResult> => {
  try {
    const db = getDatabase()
    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        genericName: products.genericName,
        strength: products.strength,
        categoryId: products.categoryId,
        manufacturer: products.manufacturer,
        barcode: products.barcode,
        sku: products.sku,
        sellingPrice: products.sellingPrice,
        costPrice: products.costPrice,
        unit: products.unit,
        shelf: products.shelf,
        reorderLevel: products.reorderLevel,
        description: products.description,
        isActive: products.isActive,
        createdAt: products.createdAt
      })
      .from(products)
      .all()

    const result = await dialog.showSaveDialog({
      title: 'Export Products',
      defaultPath: `products_${new Date().toISOString().split('T')[0]}.${options.format}`,
      filters: [
        {
          name:
            options.format === 'xlsx'
              ? 'Excel File'
              : options.format === 'csv'
                ? 'CSV File'
                : 'JSON File',
          extensions: [options.format]
        }
      ]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Export cancelled' }
    }

    if (options.format === 'xlsx') {
      await exportToExcel(allProducts, result.filePath, 'Products')
    } else if (options.format === 'csv') {
      await exportToCSV(allProducts, result.filePath)
    } else {
      await exportToJSON(allProducts, result.filePath)
    }

    return { success: true, filePath: result.filePath, recordCount: allProducts.length }
  } catch (error) {
    console.error('Export products error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    }
  }
})

/**
 * Export customers to file
 */
ipcMain.handle('db:export:customers', async (_, options: ExportOptions): Promise<ExportResult> => {
  try {
    const db = getDatabase()
    const allCustomers = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        address: customers.address,
        dateOfBirth: customers.dateOfBirth,
        gender: customers.gender,
        loyaltyPoints: customers.loyaltyPoints,
        totalPurchases: customers.totalPurchases,
        notes: customers.notes,
        isActive: customers.isActive,
        createdAt: customers.createdAt
      })
      .from(customers)
      .all()

    const result = await dialog.showSaveDialog({
      title: 'Export Customers',
      defaultPath: `customers_${new Date().toISOString().split('T')[0]}.${options.format}`,
      filters: [
        {
          name:
            options.format === 'xlsx'
              ? 'Excel File'
              : options.format === 'csv'
                ? 'CSV File'
                : 'JSON File',
          extensions: [options.format]
        }
      ]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Export cancelled' }
    }

    if (options.format === 'xlsx') {
      await exportToExcel(allCustomers, result.filePath, 'Customers')
    } else if (options.format === 'csv') {
      await exportToCSV(allCustomers, result.filePath)
    } else {
      await exportToJSON(allCustomers, result.filePath)
    }

    return { success: true, filePath: result.filePath, recordCount: allCustomers.length }
  } catch (error) {
    console.error('Export customers error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    }
  }
})

/**
 * Export suppliers to file
 */
ipcMain.handle('db:export:suppliers', async (_, options: ExportOptions): Promise<ExportResult> => {
  try {
    const db = getDatabase()
    const allSuppliers = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        code: suppliers.code,
        contactPerson: suppliers.contactPerson,
        phone: suppliers.phone,
        email: suppliers.email,
        address: suppliers.address,
        taxNumber: suppliers.taxNumber,
        openingBalance: suppliers.openingBalance,
        currentBalance: suppliers.currentBalance,
        totalPurchases: suppliers.totalPurchases,
        totalPayments: suppliers.totalPayments,
        creditLimit: suppliers.creditLimit,
        creditDays: suppliers.creditDays,
        isActive: suppliers.isActive,
        createdAt: suppliers.createdAt
      })
      .from(suppliers)
      .all()

    const result = await dialog.showSaveDialog({
      title: 'Export Suppliers',
      defaultPath: `suppliers_${new Date().toISOString().split('T')[0]}.${options.format}`,
      filters: [
        {
          name:
            options.format === 'xlsx'
              ? 'Excel File'
              : options.format === 'csv'
                ? 'CSV File'
                : 'JSON File',
          extensions: [options.format]
        }
      ]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Export cancelled' }
    }

    if (options.format === 'xlsx') {
      await exportToExcel(allSuppliers, result.filePath, 'Suppliers')
    } else if (options.format === 'csv') {
      await exportToCSV(allSuppliers, result.filePath)
    } else {
      await exportToJSON(allSuppliers, result.filePath)
    }

    return { success: true, filePath: result.filePath, recordCount: allSuppliers.length }
  } catch (error) {
    console.error('Export suppliers error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    }
  }
})

/**
 * Export inventory to file
 */
ipcMain.handle('db:export:inventory', async (_, options: ExportOptions): Promise<ExportResult> => {
  try {
    const db = getDatabase()
    const allInventory = await db
      .select({
        id: inventory.id,
        productId: inventory.productId,
        batchNumber: inventory.batchNumber,
        quantity: inventory.quantity,
        expiryDate: inventory.expiryDate,
        manufactureDate: inventory.manufactureDate,
        createdAt: inventory.createdAt
      })
      .from(inventory)
      .all()

    const result = await dialog.showSaveDialog({
      title: 'Export Inventory',
      defaultPath: `inventory_${new Date().toISOString().split('T')[0]}.${options.format}`,
      filters: [
        {
          name:
            options.format === 'xlsx'
              ? 'Excel File'
              : options.format === 'csv'
                ? 'CSV File'
                : 'JSON File',
          extensions: [options.format]
        }
      ]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Export cancelled' }
    }

    if (options.format === 'xlsx') {
      await exportToExcel(allInventory, result.filePath, 'Inventory')
    } else if (options.format === 'csv') {
      await exportToCSV(allInventory, result.filePath)
    } else {
      await exportToJSON(allInventory, result.filePath)
    }

    return { success: true, filePath: result.filePath, recordCount: allInventory.length }
  } catch (error) {
    console.error('Export inventory error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    }
  }
})

/**
 * Export sales to file with date range
 */
ipcMain.handle('db:export:sales', async (_, options: ExportOptions): Promise<ExportResult> => {
  try {
    const db = getDatabase()

    let query = db
      .select({
        id: sales.id,
        invoiceNumber: sales.invoiceNumber,
        customerId: sales.customerId,
        accountId: sales.accountId,
        userId: sales.userId,
        subtotal: sales.subtotal,
        taxAmount: sales.taxAmount,
        discountAmount: sales.discountAmount,
        totalAmount: sales.totalAmount,
        paidAmount: sales.paidAmount,
        changeAmount: sales.changeAmount,
        paymentMethod: sales.paymentMethod,
        status: sales.status,
        pointsRedeemed: sales.pointsRedeemed,
        notes: sales.notes,
        createdAt: sales.createdAt
      })
      .from(sales)

    // Apply date filters if provided
    const conditions: unknown[] = []
    if (options.startDate) {
      conditions.push(gte(sales.createdAt, options.startDate))
    }
    if (options.endDate) {
      conditions.push(lte(sales.createdAt, options.endDate))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query
    }

    const allSales = await query.all()

    const result = await dialog.showSaveDialog({
      title: 'Export Sales',
      defaultPath: `sales_${new Date().toISOString().split('T')[0]}.${options.format}`,
      filters: [
        {
          name:
            options.format === 'xlsx'
              ? 'Excel File'
              : options.format === 'csv'
                ? 'CSV File'
                : 'JSON File',
          extensions: [options.format]
        }
      ]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Export cancelled' }
    }

    if (options.format === 'xlsx') {
      await exportToExcel(allSales, result.filePath, 'Sales')
    } else if (options.format === 'csv') {
      await exportToCSV(allSales, result.filePath)
    } else {
      await exportToJSON(allSales, result.filePath)
    }

    return { success: true, filePath: result.filePath, recordCount: allSales.length }
  } catch (error) {
    console.error('Export sales error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Export failed' }
  }
})

/**
 * Export purchases to file with date range
 */
ipcMain.handle('db:export:purchases', async (_, options: ExportOptions): Promise<ExportResult> => {
  try {
    const db = getDatabase()

    let query = db
      .select({
        id: purchases.id,
        invoiceNumber: purchases.invoiceNumber,
        supplierId: purchases.supplierId,
        accountId: purchases.accountId,
        userId: purchases.userId,
        subtotal: purchases.subtotal,
        taxAmount: purchases.taxAmount,
        discountAmount: purchases.discountAmount,
        totalAmount: purchases.totalAmount,
        paidAmount: purchases.paidAmount,
        dueAmount: purchases.dueAmount,
        paymentStatus: purchases.paymentStatus,
        status: purchases.status,
        notes: purchases.notes,
        createdAt: purchases.createdAt
      })
      .from(purchases)

    // Apply date filters if provided
    const conditions: unknown[] = []
    if (options.startDate) {
      conditions.push(gte(purchases.createdAt, options.startDate))
    }
    if (options.endDate) {
      conditions.push(lte(purchases.createdAt, options.endDate))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query
    }

    const allPurchases = await query.all()

    const result = await dialog.showSaveDialog({
      title: 'Export Purchases',
      defaultPath: `purchases_${new Date().toISOString().split('T')[0]}.${options.format}`,
      filters: [
        {
          name:
            options.format === 'xlsx'
              ? 'Excel File'
              : options.format === 'csv'
                ? 'CSV File'
                : 'JSON File',
          extensions: [options.format]
        }
      ]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Export cancelled' }
    }

    if (options.format === 'xlsx') {
      await exportToExcel(allPurchases, result.filePath, 'Purchases')
    } else if (options.format === 'csv') {
      await exportToCSV(allPurchases, result.filePath)
    } else {
      await exportToJSON(allPurchases, result.filePath)
    }

    return { success: true, filePath: result.filePath, recordCount: allPurchases.length }
  } catch (error) {
    console.error('Export purchases error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    }
  }
})

/**
 * Helper function to export to Excel
 */
async function exportToExcel(data: unknown[], filePath: string, sheetName: string): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  if (data.length === 0) {
    throw new Error('No data to export')
  }

  // Get column headers from first row
  const headers = Object.keys(data[0] as Record<string, unknown>)

  // Add header row with styling
  worksheet.addRow(headers)
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4A90E2' }
  }
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }

  // Add data rows
  data.forEach((row) => {
    const values = headers.map((header) => (row as Record<string, unknown>)[header])
    worksheet.addRow(values)
  })

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 0
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value ? cell.value.toString() : ''
      maxLength = Math.max(maxLength, cellValue.length)
    })
    column.width = Math.min(maxLength + 2, 50) // Max width 50
  })

  await workbook.xlsx.writeFile(filePath)
}

/**
 * Helper function to export to CSV
 */
async function exportToCSV(data: unknown[], filePath: string): Promise<void> {
  if (data.length === 0) {
    throw new Error('No data to export')
  }

  const headers = Object.keys(data[0] as Record<string, unknown>)
  const csvRows = []

  // Add header row
  csvRows.push(headers.map((h) => `"${h}"`).join(','))

  // Add data rows
  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = (row as Record<string, unknown>)[header]
      // Escape quotes and wrap in quotes
      const escaped = value?.toString().replace(/"/g, '""') ?? ''
      return `"${escaped}"`
    })
    csvRows.push(values.join(','))
  })

  await fs.promises.writeFile(filePath, csvRows.join('\n'), 'utf-8')
}

/**
 * Helper function to export to JSON
 */
async function exportToJSON(data: unknown[], filePath: string): Promise<void> {
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

console.log('Export handlers registered')
