/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Delete, Edit, Group, Star, Visibility } from '@mui/icons-material'
import {
  Box,
  Chip,
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
import { Customer } from '../../types/customer'
import ConfirmationDialog from '../common/ConfirmationDialog'

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

interface CustomersTableProps {
  customers: Customer[]
  currencySymbol: string
  onEdit: (customer: Customer) => void
  onView: (customer: Customer) => void
  onDelete: (id: string) => void
  page?: number
  totalRecords?: number
  limit?: number
  onPageChange?: (page: number) => void
}

export default function CustomersTable({
  customers,
  currencySymbol,
  onEdit,
  onView,
  onDelete,
  page: serverPage,
  totalRecords,
  limit: serverLimit,
  onPageChange
}: CustomersTableProps): React.JSX.Element {
  const [localPage, setLocalPage] = useState(0)
  const [localRowsPerPage, setLocalRowsPerPage] = useState(25)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)

  // Use server pagination if available, otherwise local
  const usingServerPagination = serverPage !== undefined && totalRecords !== undefined
  const currentPage = usingServerPagination ? serverPage - 1 : localPage
  const rowsPerPage = usingServerPagination ? serverLimit || 50 : localRowsPerPage
  const total = usingServerPagination ? totalRecords : customers.length

  const handleChangePage = (_: unknown, newPage: number): void => {
    if (usingServerPagination && onPageChange) {
      onPageChange(newPage + 1) // Convert to 1-based for server
    } else {
      setLocalPage(newPage)
    }
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setLocalRowsPerPage(parseInt(event.target.value, 10))
    setLocalPage(0)
  }

  const handleDeleteClick = (customer: Customer): void => {
    setCustomerToDelete(customer)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = (): void => {
    if (customerToDelete) {
      onDelete(customerToDelete.id)
      setCustomerToDelete(null)
    }
  }

  const handleDeleteCancel = (): void => {
    setShowDeleteDialog(false)
    setCustomerToDelete(null)
  }

  // For server pagination, customers are already paginated
  const paginatedCustomers = usingServerPagination
    ? customers
    : customers.slice(localPage * localRowsPerPage, localPage * localRowsPerPage + localRowsPerPage)

  if (paginatedCustomers.length === 0) {
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
            <Group />
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
          No customers found
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Get started by adding a new customer.
        </Typography>
      </Paper>
    )
  }

  return (
    <Box>
      <TableContainer component={Paper} sx={{ maxHeight: 540, bgcolor: 'white' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell>Customer</StyledTableCell>
              <StyledTableCell>Contact</StyledTableCell>
              <StyledTableCell>Address</StyledTableCell>
              <StyledTableCell>Member Since</StyledTableCell>
              <StyledTableCell>Loyalty Points</StyledTableCell>
              <StyledTableCell>Total Purchases</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell align="right">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCustomers.map((customer) => (
              <TableRow key={customer.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}
                    >
                      {customer.name.charAt(0).toUpperCase()}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {customer.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        #{customer.id.slice(0, 8)}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {customer.phone}
                  </Typography>
                  {customer.email && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {customer.email}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: 'text.primary',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {customer.address || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {new Date(customer.createdAt).toLocaleTimeString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Star sx={{ fontSize: 18, color: 'warning.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {customer.loyaltyPoints}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {currencySymbol}
                    {customer.totalPurchases.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={customer.status === 'active' ? 'Active' : 'Inactive'}
                    size="small"
                    color={customer.status === 'active' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onView(customer)}
                        sx={{
                          color: 'info.main',
                          '&:hover': { bgcolor: 'info.50' }
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Customer">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(customer)}
                        sx={{
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.50' }
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Customer">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(customer)}
                        sx={{
                          color: 'error.main',
                          '&:hover': { bgcolor: 'error.50' }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Paper>
        <TablePagination
          component="div"
          count={total}
          page={currentPage}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={usingServerPagination ? [] : [10, 25, 50, 100]}
        />
      </Paper>

      <ConfirmationDialog
        open={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        message={`Are you sure you want to delete "${customerToDelete?.name}"? This will mark them as inactive and they will no longer appear in the active customers list.`}
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
      />
    </Box>
  )
}
