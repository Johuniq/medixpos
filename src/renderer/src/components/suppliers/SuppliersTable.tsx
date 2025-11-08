/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Delete, Edit, Group, Payment } from '@mui/icons-material'
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
import { Supplier } from '../../types/supplier'

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

interface SuppliersTableProps {
  suppliers: Supplier[]
  loading: boolean
  currentPage: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
  onEdit: (supplier: Supplier) => void
  onDelete: (id: string) => void
  onRecordPayment: (supplier: Supplier) => void
  page?: number
  totalRecords?: number
  limit?: number
  onServerPageChange?: (page: number) => void
}

export default function SuppliersTable({
  suppliers,
  loading,
  onPageChange,
  onItemsPerPageChange,
  onEdit,
  onDelete,
  onRecordPayment,
  page: serverPage,
  totalRecords,
  limit: serverLimit,
  onServerPageChange
}: SuppliersTableProps): React.JSX.Element {
  const [localPage, setLocalPage] = useState(0)
  const [localRowsPerPage, setLocalRowsPerPage] = useState(25)

  // Use server pagination if available, otherwise local
  const usingServerPagination = serverPage !== undefined && totalRecords !== undefined
  const currentPage = usingServerPagination ? serverPage - 1 : localPage
  const rowsPerPage = usingServerPagination ? serverLimit || 50 : localRowsPerPage
  const total = usingServerPagination ? totalRecords : suppliers.length

  const handleChangePage = (_: unknown, newPage: number): void => {
    if (usingServerPagination && onServerPageChange) {
      onServerPageChange(newPage + 1)
    } else {
      setLocalPage(newPage)
      onPageChange(newPage + 1)
    }
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newRowsPerPage = parseInt(event.target.value, 10)
    setLocalRowsPerPage(newRowsPerPage)
    onItemsPerPageChange(newRowsPerPage)
    setLocalPage(0)
    onPageChange(1)
  }

  const paginatedSuppliers = usingServerPagination
    ? suppliers
    : suppliers.slice(localPage * localRowsPerPage, localPage * localRowsPerPage + localRowsPerPage)

  if (loading) {
    return (
      <Paper sx={{ p: 12, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading suppliers...
        </Typography>
      </Paper>
    )
  }

  if (paginatedSuppliers.length === 0 && suppliers.length === 0) {
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
          <Group sx={{ color: 'text.secondary' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
          No suppliers found
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Get started by creating a new supplier
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
              <StyledTableCell>Supplier</StyledTableCell>
              <StyledTableCell>Contact Person</StyledTableCell>
              <StyledTableCell>Phone</StyledTableCell>
              <StyledTableCell>Email</StyledTableCell>
              <StyledTableCell align="right">Balance</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell align="right">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSuppliers.map((supplier) => {
              const totalBalance = (supplier.openingBalance || 0) + (supplier.currentBalance || 0)

              return (
                <TableRow key={supplier.id} hover>
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
                          color: 'primary.main'
                        }}
                      >
                        <Group
                          sx={{
                            color: '#ffffff'
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {supplier.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {supplier.code}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {supplier.contactPerson || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {supplier.phone || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {supplier.email || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color:
                          totalBalance > 0
                            ? 'error.main'
                            : totalBalance < 0
                              ? 'success.main'
                              : 'text.primary'
                      }}
                    >
                      ${Math.abs(totalBalance).toFixed(2)}
                    </Typography>
                    {totalBalance !== 0 && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {totalBalance > 0 ? 'Payable' : 'Receivable'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={supplier.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={supplier.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {totalBalance > 0 && (
                        <Tooltip title="Record Payment">
                          <IconButton
                            size="small"
                            onClick={() => onRecordPayment(supplier)}
                            sx={{
                              color: 'success.main',
                              '&:hover': { bgcolor: 'success.50' }
                            }}
                          >
                            <Payment fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit Supplier">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(supplier)}
                          sx={{
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.50' }
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Supplier">
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this supplier?')) {
                              onDelete(supplier.id)
                            }
                          }}
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
              )
            })}
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
    </Box>
  )
}
