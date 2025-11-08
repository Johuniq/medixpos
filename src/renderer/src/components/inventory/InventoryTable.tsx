/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Edit, Inventory, Visibility, Warning } from '@mui/icons-material'
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  styled,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'
import { useState } from 'react'
import medicinePlaceholder from '../../assets/medicine.png'
import { Category, InventoryWithProduct } from '../../types/inventory'
import { formatExpiryDate, getExpiryStatus } from '../../utils/expiryHelpers'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.text.secondary,
    fontWeight: 600,
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '0.5px'
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14
  }
}))

interface InventoryTableProps {
  inventory: InventoryWithProduct[]
  categories: Category[]
  loading: boolean
  currencySymbol: string
  onEdit: (item: InventoryWithProduct) => void
  onViewDetails: (item: InventoryWithProduct) => void
  page?: number
  totalRecords?: number
  limit?: number
  onPageChange?: (page: number) => void
}

export default function InventoryTable({
  inventory,
  categories,
  loading,
  currencySymbol,
  onEdit,
  onViewDetails,
  page: serverPage,
  totalRecords,
  limit: serverLimit,
  onPageChange
}: InventoryTableProps): React.JSX.Element {
  const [localPage, setLocalPage] = useState(0)
  const [localRowsPerPage, setLocalRowsPerPage] = useState(10)

  // Use server pagination if available, otherwise local
  const usingServerPagination = serverPage !== undefined && totalRecords !== undefined
  const currentPage = usingServerPagination ? serverPage - 1 : localPage
  const rowsPerPage = usingServerPagination ? serverLimit || 50 : localRowsPerPage
  const total = usingServerPagination ? totalRecords : inventory.length

  const handleChangePage = (_: unknown, newPage: number): void => {
    if (usingServerPagination && onPageChange) {
      onPageChange(newPage + 1)
    } else {
      setLocalPage(newPage)
    }
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setLocalRowsPerPage(parseInt(event.target.value, 10))
    setLocalPage(0)
  }

  if (loading) {
    return (
      <Paper sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
        <CircularProgress />
      </Paper>
    )
  }

  if (inventory.length === 0) {
    return (
      <Paper sx={{ p: 12, textAlign: 'center' }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            bgcolor: 'grey.200',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2
          }}
        >
          <Typography variant="h5" sx={{ color: 'text.secondary' }}>
            <Inventory />
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
          No inventory items found
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Start by adding stock to your products.
        </Typography>
      </Paper>
    )
  }

  // For server pagination, inventory is already paginated
  const paginatedInventory = usingServerPagination
    ? inventory
    : inventory.slice(localPage * localRowsPerPage, localPage * localRowsPerPage + localRowsPerPage)

  return (
    <Box>
      <TableContainer component={Paper} sx={{ maxHeight: 540, bgcolor: 'white' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell>Product</StyledTableCell>
              <StyledTableCell>SKU</StyledTableCell>
              <StyledTableCell>Category</StyledTableCell>
              <StyledTableCell>Current Stock</StyledTableCell>
              <StyledTableCell>Reorder Level</StyledTableCell>
              <StyledTableCell>Expiry Date</StyledTableCell>
              <StyledTableCell>Value</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell align="right">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedInventory.map((item) => {
              const product = item.product!
              const category = categories.find((c) => c.id === product.categoryId)
              const isLowStock = item.quantity > 0 && item.quantity <= product.reorderLevel
              const isOutOfStock = item.quantity === 0
              const stockValue = item.quantity * product.costPrice
              const expiryStatus = getExpiryStatus(item.expiryDate)

              return (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        component="img"
                        src={product.imageUrl || medicinePlaceholder}
                        alt={product.name}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          objectFit: 'contain',
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'grey.50',
                          p: 0.5
                        }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {product.name}
                        </Typography>
                        {product.genericName && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {product.genericName}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{product.sku}</Typography>
                    {product.barcode && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {product.barcode}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={category?.name || 'Uncategorized'} size="small" color="primary" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: isOutOfStock
                            ? 'error.main'
                            : isLowStock
                              ? 'warning.main'
                              : 'success.main'
                        }}
                      >
                        {item.quantity} {product.unit}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{product.reorderLevel}</Typography>
                  </TableCell>
                  <TableCell>
                    {expiryStatus ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {expiryStatus.shouldAlert && (
                          <Tooltip title={expiryStatus.label}>
                            <Warning
                              sx={{
                                fontSize: 18,
                                color: `${expiryStatus.color}.main`
                              }}
                            />
                          </Tooltip>
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: `${expiryStatus.color}.main`,
                            fontWeight: expiryStatus.shouldAlert ? 600 : 400
                          }}
                        >
                          {formatExpiryDate(item.expiryDate)}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No expiry
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {currencySymbol}
                      {stockValue.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      @{currencySymbol}
                      {product.costPrice.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {isOutOfStock ? (
                      <Chip label="Out of Stock" size="small" color="error" />
                    ) : isLowStock ? (
                      <Chip label="Low Stock" size="small" color="warning" />
                    ) : (
                      <Chip label="In Stock" size="small" color="success" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small" color="info" onClick={() => onViewDetails(item)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Adjust Stock">
                      <IconButton size="small" color="primary" onClick={() => onEdit(item)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Paper>
        <TablePagination
          rowsPerPageOptions={usingServerPagination ? [] : [10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={currentPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  )
}
