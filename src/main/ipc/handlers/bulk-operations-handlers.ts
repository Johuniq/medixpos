/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { randomUUID } from 'crypto'
import { eq, inArray } from 'drizzle-orm'
import { dialog, ipcMain } from 'electron'
import ExcelJS from 'exceljs'
import { getDatabase } from '../../database'
import { categories, customers, products } from '../../database/schema'

// Bulk import products from CSV/Excel
ipcMain.handle('bulk:import-products', async (_, filePath: string) => {
  const db = getDatabase()
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ row: number; error: string; data?: unknown }>
  }

  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filePath)
    const worksheet = workbook.worksheets[0]

    if (!worksheet) {
      return { success: false, error: 'No worksheet found in file' }
    }

    // Get all categories for validation
    const allCategories = await db.select().from(categories).execute()

    const categoryMap = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]))

    // Start from row 2 (skip header)
    const rows: unknown[] = []
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // Skip header
      rows.push({ row, rowNumber })
    })

    // Process in transaction
    for (const { row, rowNumber } of rows as Array<{ row: ExcelJS.Row; rowNumber: number }>) {
      try {
        const name = row.getCell(1).value?.toString().trim()
        const barcode = row.getCell(2).value?.toString().trim()
        const categoryName = row.getCell(3).value?.toString().trim()
        const sellingPrice = parseFloat(row.getCell(4).value?.toString() || '0')
        const costPrice = parseFloat(row.getCell(5).value?.toString() || '0')
        const minStock = parseFloat(row.getCell(6).value?.toString() || '10')
        const shelf = row.getCell(7).value?.toString().trim() || 'A1'
        const description = row.getCell(8).value?.toString().trim() || ''

        // Validation
        if (!name || name.length < 2) {
          throw new Error('Product name is required (min 2 characters)')
        }

        if (!categoryName) {
          throw new Error('Category is required')
        }

        if (sellingPrice <= 0) {
          throw new Error('Selling price must be greater than 0')
        }

        // Get category ID
        const categoryId = categoryMap.get(categoryName.toLowerCase())

        if (!categoryId) {
          throw new Error(`Category "${categoryName}" not found`)
        }

        // Check if product with barcode already exists
        if (barcode) {
          const [existing] = await db
            .select()
            .from(products)
            .where(eq(products.barcode, barcode))
            .execute()

          if (existing) {
            throw new Error(`Product with barcode "${barcode}" already exists`)
          }
        }

        // Insert product
        await db
          .insert(products)
          .values({
            id: randomUUID(),
            name,
            sku: barcode || randomUUID().slice(0, 8), // Use barcode as SKU or generate
            barcode: barcode || null,
            categoryId,
            unit: 'piece', // Default unit
            unitsPerPackage: 1,
            sellingPrice,
            costPrice,
            reorderLevel: minStock || 10,
            shelf: shelf || 'A1',
            description: description || null,
            isActive: true
          })
          .execute()

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: {
            name: row.getCell(1).value,
            barcode: row.getCell(2).value
          }
        })
      }
    }

    return { success: true, results }
  } catch (error) {
    console.error('Bulk import error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import products'
    }
  }
})

// Bulk import customers from CSV/Excel
ipcMain.handle('bulk:import-customers', async (_, filePath: string) => {
  const db = getDatabase()
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ row: number; error: string; data?: unknown }>
  }

  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filePath)
    const worksheet = workbook.worksheets[0]

    if (!worksheet) {
      return { success: false, error: 'No worksheet found in file' }
    }

    const rows: unknown[] = []
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // Skip header
      rows.push({ row, rowNumber })
    })

    for (const { row, rowNumber } of rows as Array<{ row: ExcelJS.Row; rowNumber: number }>) {
      try {
        const name = row.getCell(1).value?.toString().trim()
        const phone = row.getCell(2).value?.toString().trim()
        const email = row.getCell(3).value?.toString().trim()
        const address = row.getCell(4).value?.toString().trim()
        const loyaltyPoints = parseInt(row.getCell(5).value?.toString() || '0')

        // Validation
        if (!name || name.length < 2) {
          throw new Error('Customer name is required (min 2 characters)')
        }

        if (!phone) {
          throw new Error('Phone number is required')
        }

        // Check if customer with phone already exists
        const [existing] = await db
          .select()
          .from(customers)
          .where(eq(customers.phone, phone))
          .execute()

        if (existing) {
          throw new Error(`Customer with phone "${phone}" already exists`)
        }

        // Insert customer
        await db
          .insert(customers)
          .values({
            id: randomUUID(),
            name,
            phone,
            email: email || null,
            address: address || null,
            loyaltyPoints: loyaltyPoints || 0,
            totalPurchases: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .execute()

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: {
            name: row.getCell(1).value,
            phone: row.getCell(2).value
          }
        })
      }
    }

    return { success: true, results }
  } catch (error) {
    console.error('Bulk import customers error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import customers'
    }
  }
})

// Bulk update product prices
ipcMain.handle(
  'bulk:update-prices',
  async (_, productIds: string[], priceUpdate: { type: 'fixed' | 'percentage'; value: number }) => {
    const db = getDatabase()

    try {
      if (productIds.length === 0) {
        return { success: false, error: 'No products selected' }
      }

      // Get current products
      const productsToUpdate = await db
        .select()
        .from(products)
        .where(inArray(products.id, productIds))
        .execute()

      let updated = 0

      for (const product of productsToUpdate) {
        let newPrice = product.sellingPrice

        if (priceUpdate.type === 'fixed') {
          newPrice = priceUpdate.value
        } else {
          // Percentage increase/decrease
          newPrice = product.sellingPrice * (1 + priceUpdate.value / 100)
        }

        // Ensure price is positive
        if (newPrice <= 0) {
          continue
        }

        await db
          .update(products)
          .set({
            sellingPrice: newPrice,
            updatedAt: new Date().toISOString()
          })
          .where(eq(products.id, product.id))
          .execute()

        updated++
      }

      return { success: true, updated }
    } catch (error) {
      console.error('Bulk update prices error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update prices'
      }
    }
  }
)

// Bulk update product categories
ipcMain.handle('bulk:update-category', async (_, productIds: string[], categoryId: string) => {
  const db = getDatabase()

  try {
    if (productIds.length === 0) {
      return { success: false, error: 'No products selected' }
    }

    // Verify category exists
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .execute()

    if (!category) {
      return { success: false, error: 'Category not found' }
    }

    // Update products
    for (const productId of productIds) {
      await db
        .update(products)
        .set({
          categoryId,
          updatedAt: new Date().toISOString()
        })
        .where(eq(products.id, productId))
        .execute()
    }

    return { success: true, updated: productIds.length }
  } catch (error) {
    console.error('Bulk update category error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update category'
    }
  }
})

// Bulk activate/deactivate products
ipcMain.handle('bulk:toggle-status', async (_, productIds: string[], isActive: boolean) => {
  const db = getDatabase()

  try {
    if (productIds.length === 0) {
      return { success: false, error: 'No products selected' }
    }

    for (const productId of productIds) {
      await db
        .update(products)
        .set({
          isActive,
          updatedAt: new Date().toISOString()
        })
        .where(eq(products.id, productId))
        .execute()
    }

    return { success: true, updated: productIds.length }
  } catch (error) {
    console.error('Bulk toggle status error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status'
    }
  }
})

// Bulk delete products
ipcMain.handle('bulk:delete-products', async (_, productIds: string[]) => {
  const db = getDatabase()

  try {
    if (productIds.length === 0) {
      return { success: false, error: 'No products selected' }
    }

    // Soft delete by setting isActive to false
    for (const productId of productIds) {
      await db
        .update(products)
        .set({
          isActive: false,
          updatedAt: new Date().toISOString()
        })
        .where(eq(products.id, productId))
        .execute()
    }

    return { success: true, deleted: productIds.length }
  } catch (error) {
    console.error('Bulk delete products error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete products'
    }
  }
})

// Download template for product import
ipcMain.handle('bulk:download-product-template', async () => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Save Product Import Template',
      defaultPath: 'product_import_template.xlsx',
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Save cancelled' }
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Products')

    // Add headers
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Barcode', key: 'barcode', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Unit', key: 'unit', width: 15 },
      { header: 'Selling Price', key: 'sellingPrice', width: 15 },
      { header: 'Cost Price', key: 'costPrice', width: 15 },
      { header: 'Current Stock', key: 'currentStock', width: 15 },
      { header: 'Min Stock', key: 'minStock', width: 15 },
      { header: 'Shelf', key: 'shelf', width: 15 },
      { header: 'Description', key: 'description', width: 40 }
    ]

    // Style header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4A90E2' }
    }

    // Add sample row
    worksheet.addRow({
      name: 'Paracetamol 500mg',
      barcode: '1234567890123',
      category: 'Tablets',
      unit: 'Box',
      sellingPrice: 50,
      costPrice: 30,
      currentStock: 100,
      minStock: 20,
      shelf: 'A1',
      description: 'Pain reliever and fever reducer'
    })

    await workbook.xlsx.writeFile(result.filePath)

    return { success: true, path: result.filePath }
  } catch (error) {
    console.error('Download template error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download template'
    }
  }
})

// Download template for customer import
ipcMain.handle('bulk:download-customer-template', async () => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Save Customer Import Template',
      defaultPath: 'customer_import_template.xlsx',
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Save cancelled' }
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Customers')

    // Add headers
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Loyalty Points', key: 'loyaltyPoints', width: 15 }
    ]

    // Style header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4A90E2' }
    }

    // Add sample row
    worksheet.addRow({
      name: 'John Doe',
      phone: '01712345678',
      email: 'john@example.com',
      address: '123 Main Street, Dhaka',
      loyaltyPoints: 0
    })

    await workbook.xlsx.writeFile(result.filePath)

    return { success: true, path: result.filePath }
  } catch (error) {
    console.error('Download template error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download template'
    }
  }
})

export function registerBulkOperationsHandlers(): void {
  console.log('Bulk operations handlers registered')
}
