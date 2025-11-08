/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

export interface InventoryItem {
  id: string
  productId: string
  quantity: number
  batchNumber?: string
  expiryDate?: string
  version: number // Optimistic locking version
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  genericName?: string
  strength?: string
  sku: string
  barcode?: string
  categoryId?: string
  unit: string
  reorderLevel: number
  sellingPrice: number
  costPrice: number
  imageUrl?: string
}

export interface Category {
  id: string
  name: string
}

export interface InventoryWithProduct extends InventoryItem {
  product?: Product
}

export interface StockAdjustmentFormData {
  productId: string
  quantity: number
  batchNumber: string
  expiryDate: string
}
