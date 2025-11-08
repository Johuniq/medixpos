/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Delete, Inventory, Visibility } from '@mui/icons-material'
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
import { Purchase } from '../../types/purchase'

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

interface PurchasesTableProps {
  purchases: Purchase[]
  currencySymbol: string
  onViewDetails: (purchase: Purchase) => void
  onDelete: (purchase: Purchase) => void
  page?: number
  totalRecords?: number
  limit?: number
  onServerPageChange?: (page: number) => void
}

export default function PurchasesTable({
  purchases,
  currencySymbol,
  onViewDetails,
  onDelete,
  page: serverPage,
  totalRecords,
  limit: serverLimit,
  onServerPageChange
}: PurchasesTableProps): React.JSX.Element {
  const [localPage, setLocalPage] = useState(0)
  const [localRowsPerPage, setLocalRowsPerPage] = useState(25)

  // Use server pagination if available, otherwise local
  const usingServerPagination = serverPage !== undefined && totalRecords !== undefined
  const currentPage = usingServerPagination ? serverPage - 1 : localPage
  const rowsPerPage = usingServerPagination ? serverLimit || 50 : localRowsPerPage
  const total = usingServerPagination ? totalRecords : purchases.length

  const handleChangePage = (_: unknown, newPage: number): void => {
    if (usingServerPagination && onServerPageChange) {
      onServerPageChange(newPage + 1)
    } else {
      setLocalPage(newPage)
    }
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newRowsPerPage = parseInt(event.target.value, 10)
    setLocalRowsPerPage(newRowsPerPage)
    setLocalPage(0)
  }

  const paginatedPurchases = usingServerPagination
    ? purchases
    : purchases.slice(localPage * localRowsPerPage, localPage * localRowsPerPage + localRowsPerPage)

  if (paginatedPurchases.length === 0) {
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
          No purchases found
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Get started by creating a new purchase order.
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
              <StyledTableCell>Invoice</StyledTableCell>
              <StyledTableCell>Supplier</StyledTableCell>
              <StyledTableCell>Date</StyledTableCell>
              <StyledTableCell>Total Amount</StyledTableCell>
              <StyledTableCell>Paid</StyledTableCell>
              <StyledTableCell>Due</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell align="right">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPurchases.map((purchase) => (
              <TableRow key={purchase.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: 'secondary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'secondary.main'
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        style={{ color: '#ffffff' }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {purchase.invoiceNumber}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        #{purchase.id.slice(0, 8)}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {purchase.supplierName || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {new Date(purchase.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {new Date(purchase.createdAt).toLocaleTimeString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {currencySymbol}
                    {purchase.totalAmount.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {currencySymbol}
                    {purchase.paidAmount.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                    {currencySymbol}
                    {purchase.dueAmount.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {purchase.status === 'received' ? (
                      <Chip label="Received" size="small" color="success" />
                    ) : purchase.status === 'pending' ? (
                      <Chip label="Pending" size="small" color="warning" />
                    ) : purchase.status === 'cancelled' ? (
                      <Chip label="Cancelled" size="small" color="error" />
                    ) : null}
                    {purchase.paymentStatus === 'paid' ? (
                      <Chip label="Paid" size="small" color="success" />
                    ) : purchase.paymentStatus === 'partial' ? (
                      <Chip label="Partial" size="small" color="info" />
                    ) : purchase.paymentStatus === 'pending' ? (
                      <Chip label="Pending" size="small" color="warning" />
                    ) : null}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => onViewDetails(purchase)}
                      sx={{
                        color: 'secondary.main',
                        '&:hover': { bgcolor: 'secondary.50' }
                      }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Purchase">
                    <IconButton
                      size="small"
                      onClick={() => onDelete(purchase)}
                      sx={{
                        color: 'error.main',
                        '&:hover': { bgcolor: 'error.lighter' }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
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
    </Box>
  )
}
