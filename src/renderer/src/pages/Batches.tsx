/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import {
  CheckCircle,
  Delete,
  Edit,
  Error as ErrorIcon,
  FilterList,
  Refresh,
  Warning
} from '@mui/icons-material'
import {
  Badge,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'

interface Batch {
  id: string
  batchNumber: string
  quantity: number
  expiryDate: string
  manufactureDate?: string
  unitCost?: number
  version: number
  createdAt: string
  productId: string
  productName?: string
  productSku?: string
  productBarcode?: string
  isExpired?: boolean
  daysUntilExpiry?: number
  expiryStatus?: 'expired' | 'critical' | 'warning' | 'alert' | 'good'
}

export default function Batches(): JSX.Element {
  const [batches, setBatches] = useState<Batch[]>([])
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expiring' | 'expired'>('all')
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editQuantity, setEditQuantity] = useState(0)
  const [editReason, setEditReason] = useState('')

  useEffect(() => {
    loadBatches()
  }, [])

  useEffect(() => {
    filterBatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batches, searchTerm, expiryFilter])

  const loadBatches = async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await window.api.batches.getAll({ page: 1, limit: 50 })
      if (result.success && result.batches) {
        setBatches(result.batches as Batch[])
      }
    } catch (error) {
      console.error('Error loading batches:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterBatches = (): void => {
    let filtered = [...batches]

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.productName?.toLowerCase().includes(search) ||
          b.batchNumber?.toLowerCase().includes(search) ||
          b.productSku?.toLowerCase().includes(search)
      )
    }

    // Expiry filter
    if (expiryFilter === 'expired') {
      filtered = filtered.filter((b) => b.isExpired)
    } else if (expiryFilter === 'expiring') {
      filtered = filtered.filter((b) => !b.isExpired && (b.daysUntilExpiry || 0) <= 90)
    }

    setFilteredBatches(filtered)
  }

  const handleEdit = (batch: Batch): void => {
    setSelectedBatch(batch)
    setEditQuantity(batch.quantity)
    setEditReason('')
    setEditDialogOpen(true)
  }

  const handleUpdateQuantity = async (): Promise<void> => {
    if (!selectedBatch) return

    try {
      const result = await window.api.batches.update({
        id: selectedBatch.id,
        quantity: editQuantity,
        version: selectedBatch.version,
        reason: editReason
      })

      if (result.success) {
        setEditDialogOpen(false)
        loadBatches()
      } else {
        alert(result.error || 'Failed to update batch')
      }
    } catch (error) {
      console.error('Error updating batch:', error)
      alert('Failed to update batch')
    }
  }

  const handleDelete = async (batch: Batch): Promise<void> => {
    if (batch.quantity > 0) {
      alert('Cannot delete batch with remaining quantity. Adjust quantity to 0 first.')
      return
    }

    if (!confirm(`Delete batch ${batch.batchNumber}?`)) return

    try {
      const result = await window.api.batches.delete(batch.id)
      if (result.success) {
        loadBatches()
      } else {
        alert(result.error || 'Failed to delete batch')
      }
    } catch (error) {
      console.error('Error deleting batch:', error)
      alert('Failed to delete batch')
    }
  }

  const getExpiryBadge = (batch: Batch): JSX.Element => {
    if (batch.isExpired) {
      return (
        <Chip icon={<ErrorIcon />} label="Expired" color="error" size="small" variant="filled" />
      )
    }

    const days = batch.daysUntilExpiry || 0
    if (days <= 7) {
      return (
        <Chip icon={<Warning />} label={`${days}d`} color="error" size="small" variant="outlined" />
      )
    } else if (days <= 30) {
      return (
        <Chip
          icon={<Warning />}
          label={`${days}d`}
          color="warning"
          size="small"
          variant="outlined"
        />
      )
    } else if (days <= 90) {
      return (
        <Chip
          label={`${days}d`}
          color="warning"
          size="small"
          variant="outlined"
          sx={{ borderStyle: 'dashed' }}
        />
      )
    } else {
      return (
        <Chip icon={<CheckCircle />} label="Good" color="success" size="small" variant="outlined" />
      )
    }
  }

  const getRowColor = (batch: Batch): string => {
    if (batch.isExpired) return '#ffebee'
    const days = batch.daysUntilExpiry || 0
    if (days <= 7) return '#fff3e0'
    if (days <= 30) return '#fff9c4'
    return 'transparent'
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Batch Management</Typography>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={loadBatches}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search products or batch numbers"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Select
              fullWidth
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value as 'all' | 'expiring' | 'expired')}
              size="small"
              startAdornment={<FilterList sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">All Batches</MenuItem>
              <MenuItem value="expiring">Expiring Soon (90d)</MenuItem>
              <MenuItem value="expired">Expired Only</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              Total: {filteredBatches.length} batches
            </Typography>
          </Grid>
        </Grid>
      </Card>

      {/* Batches Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Batch Number</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Manufacture Date</TableCell>
              <TableCell align="right">Unit Cost</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Loading batches...
                </TableCell>
              </TableRow>
            ) : filteredBatches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No batches found
                </TableCell>
              </TableRow>
            ) : (
              filteredBatches.map((batch) => (
                <TableRow key={batch.id} sx={{ backgroundColor: getRowColor(batch) }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {batch.productName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {batch.productSku}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Badge
                      badgeContent={batch.batchNumber}
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          position: 'static',
                          transform: 'none',
                          fontFamily: 'monospace'
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={batch.quantity > 0 ? 'text.primary' : 'text.secondary'}
                    >
                      {batch.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(batch.expiryDate), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>{getExpiryBadge(batch)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {batch.manufactureDate
                        ? format(new Date(batch.manufactureDate), 'MMM dd, yyyy')
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {batch.unitCost ? `$${batch.unitCost.toFixed(2)}` : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit Quantity">
                      <IconButton size="small" color="primary" onClick={() => handleEdit(batch)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(batch)}
                        disabled={batch.quantity > 0}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Batch Quantity</DialogTitle>
        <DialogContent>
          {selectedBatch && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Product:</strong> {selectedBatch.productName}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Batch:</strong> {selectedBatch.batchNumber}
              </Typography>
              <Typography variant="body2" gutterBottom mb={3}>
                <strong>Current Quantity:</strong> {selectedBatch.quantity}
              </Typography>

              <TextField
                fullWidth
                label="New Quantity"
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(Number(e.target.value))}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Reason for Adjustment"
                multiline
                rows={3}
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="e.g., Stock take adjustment, damaged items removed..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateQuantity} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
