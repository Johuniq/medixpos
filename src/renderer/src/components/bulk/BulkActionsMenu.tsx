/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { AttachMoney, Cancel, Category, CheckCircle, Delete } from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import React, { useState } from 'react'
import { useAuthStore } from '../../store/authStore'

interface BulkActionsMenuProps {
  anchorEl: HTMLElement | null
  open: boolean
  onClose: () => void
  selectedIds: string[]
  entityType: 'products' | 'customers'
  onSuccess?: () => void
}

const BulkActionsMenu: React.FC<BulkActionsMenuProps> = ({
  anchorEl,
  open,
  onClose,
  selectedIds,
  entityType,
  onSuccess
}) => {
  const user = useAuthStore((state) => state.user)
  const [priceUpdateOpen, setPriceUpdateOpen] = useState(false)
  const [categoryAssignOpen, setCategoryAssignOpen] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

  const [priceType, setPriceType] = useState<'purchase' | 'sale'>('sale')
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage')
  const [adjustmentValue, setAdjustmentValue] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')

  const handlePriceUpdate = async (): Promise<void> => {
    if (!user || !adjustmentValue) return

    try {
      const result = await window.api.bulk.updatePrices({
        productIds: selectedIds,
        priceType,
        adjustmentType,
        adjustmentValue: parseFloat(adjustmentValue),
        userId: user.id,
        username: user.username
      })

      if (result.success) {
        alert(`Updated ${result.updated} products successfully`)
        onSuccess?.()
        setPriceUpdateOpen(false)
        onClose()
      } else {
        alert('Failed to update prices')
      }
    } catch (error) {
      console.error('Price update error:', error)
      alert('Failed to update prices')
    }
  }

  const handleCategoryAssign = async (): Promise<void> => {
    if (!selectedCategoryId) return

    try {
      const result = await window.api.bulk.assignCategories({
        productIds: selectedIds,
        categoryId: selectedCategoryId
      })

      if (result.success) {
        alert(`Updated ${result.updated} products successfully`)
        onSuccess?.()
        setCategoryAssignOpen(false)
        onClose()
      } else {
        alert('Failed to assign category')
      }
    } catch (error) {
      console.error('Category assign error:', error)
      alert('Failed to assign category')
    }
  }

  const handleActivate = async (): Promise<void> => {
    try {
      const result = await window.api.bulk.activate({
        entityType,
        entityIds: selectedIds
      })

      if (result.success) {
        alert(`Activated ${result.updated} items successfully`)
        onSuccess?.()
        onClose()
      } else {
        alert('Failed to activate items')
      }
    } catch (error) {
      console.error('Activate error:', error)
      alert('Failed to activate items')
    }
  }

  const handleDeactivate = async (): Promise<void> => {
    try {
      const result = await window.api.bulk.deactivate({
        entityType,
        entityIds: selectedIds
      })

      if (result.success) {
        alert(`Deactivated ${result.updated} items successfully`)
        onSuccess?.()
        onClose()
      } else {
        alert('Failed to deactivate items')
      }
    } catch (error) {
      console.error('Deactivate error:', error)
      alert('Failed to deactivate items')
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) return

    try {
      const result = await window.api.bulk.deleteEntities({
        entityType,
        entityIds: selectedIds
      })

      if (result.success) {
        alert(`Deleted ${result.deleted} items successfully`)
        onSuccess?.()
        onClose()
      } else {
        alert('Failed to delete items')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete items')
    }
  }

  const handleOpenPriceUpdate = async (): Promise<void> => {
    setPriceUpdateOpen(true)
    onClose()
  }

  const handleOpenCategoryAssign = async (): Promise<void> => {
    // Load categories
    try {
      const result = await window.api.categories.getAll()
      setCategories(result as Array<{ id: string; name: string }>)
      setCategoryAssignOpen(true)
      onClose()
    } catch (error) {
      console.error('Failed to load categories:', error)
      alert('Failed to load categories')
    }
  }

  return (
    <>
      <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
        {entityType === 'products' && (
          <>
            <MenuItem onClick={handleOpenPriceUpdate}>
              <ListItemIcon>
                <AttachMoney fontSize="small" />
              </ListItemIcon>
              <ListItemText>Update Prices</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleOpenCategoryAssign}>
              <ListItemIcon>
                <Category fontSize="small" />
              </ListItemIcon>
              <ListItemText>Assign Category</ListItemText>
            </MenuItem>
          </>
        )}

        <MenuItem onClick={handleActivate}>
          <ListItemIcon>
            <CheckCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText>Activate</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleDeactivate}>
          <ListItemIcon>
            <Cancel fontSize="small" />
          </ListItemIcon>
          <ListItemText>Deactivate</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Price Update Dialog */}
      <Dialog
        open={priceUpdateOpen}
        onClose={() => setPriceUpdateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Prices</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Update prices for {selectedIds.length} selected products
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Price Type</InputLabel>
              <Select
                value={priceType}
                label="Price Type"
                onChange={(e) => setPriceType(e.target.value as 'purchase' | 'sale')}
              >
                <MenuItem value="purchase">Purchase Price</MenuItem>
                <MenuItem value="sale">Selling Price</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Adjustment Type</InputLabel>
              <Select
                value={adjustmentType}
                label="Adjustment Type"
                onChange={(e) => setAdjustmentType(e.target.value as 'percentage' | 'fixed')}
              >
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="fixed">Fixed Amount</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={adjustmentType === 'percentage' ? 'Percentage (%)' : 'Amount'}
              type="number"
              value={adjustmentValue}
              onChange={(e) => setAdjustmentValue(e.target.value)}
              sx={{ mt: 2 }}
              helperText={
                adjustmentType === 'percentage'
                  ? 'Positive for increase, negative for decrease'
                  : 'Positive for increase, negative for decrease'
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPriceUpdateOpen(false)}>Cancel</Button>
          <Button onClick={handlePriceUpdate} variant="contained" disabled={!adjustmentValue}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Assign Dialog */}
      <Dialog
        open={categoryAssignOpen}
        onClose={() => setCategoryAssignOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Category</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Assign category to {selectedIds.length} selected products
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategoryId}
                label="Category"
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryAssignOpen(false)}>Cancel</Button>
          <Button onClick={handleCategoryAssign} variant="contained" disabled={!selectedCategoryId}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default BulkActionsMenu
