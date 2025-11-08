/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Inventory, Visibility } from '@mui/icons-material'
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
import { Sale } from '../../types/sale'

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

interface SalesTableProps {
  sales: Sale[]
  currencySymbol: string
  onViewDetails: (sale: Sale) => void
  onPrint: (sale: Sale) => void
  page?: number
  totalRecords?: number
  limit?: number
  onServerPageChange?: (page: number) => void
}

export default function SalesTable({
  sales,
  currencySymbol,
  onViewDetails,
  page: serverPage,
  totalRecords,
  limit: serverLimit,
  onServerPageChange
}: SalesTableProps): React.JSX.Element {
  const [localPage, setLocalPage] = useState(0)
  const [localRowsPerPage, setLocalRowsPerPage] = useState(25)

  // Use server pagination if available, otherwise local
  const usingServerPagination = serverPage !== undefined && totalRecords !== undefined
  const currentPage = usingServerPagination ? serverPage - 1 : localPage
  const rowsPerPage = usingServerPagination ? serverLimit || 50 : localRowsPerPage
  const total = usingServerPagination ? totalRecords : sales.length

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

  const paginatedSales = usingServerPagination
    ? sales
    : sales.slice(localPage * localRowsPerPage, localPage * localRowsPerPage + localRowsPerPage)

  if (paginatedSales.length === 0) {
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
          No sales items found
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Start by adding sales transactions.
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
              <StyledTableCell>Customer</StyledTableCell>
              <StyledTableCell>Date & Time</StyledTableCell>
              <StyledTableCell>Payment</StyledTableCell>
              <StyledTableCell>Total</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell align="right">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSales.map((sale) => (
              <TableRow key={sale.id} hover>
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
                        {sale.invoiceNumber}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        #{sale.id.slice(0, 8)}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {sale.customerName || 'Walk-in Customer'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {new Date(sale.createdAt).toLocaleTimeString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  {sale.paymentMethod === 'cash' ? (
                    <Chip label="Cash" size="small" color="success" />
                  ) : sale.paymentMethod === 'bank' ? (
                    <Chip label="Bank" size="small" color="info" />
                  ) : sale.paymentMethod === 'mobile_banking' ? (
                    <Chip label="Mobile Banking" size="small" color="warning" />
                  ) : (
                    <Chip label="Other" size="small" color="secondary" />
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {currencySymbol}
                    {sale.totalAmount.toFixed(2)}
                  </Typography>
                  {sale.changeAmount > 0 && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Change: {currencySymbol}
                      {sale.changeAmount.toFixed(2)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {sale.status === 'completed' ? (
                    <Chip label="Completed" size="small" color="success" />
                  ) : sale.status === 'refunded' ? (
                    <Chip label="Refunded" size="small" color="error" />
                  ) : sale.status === 'partially_returned' ? (
                    <Chip label="Partially Returned" size="small" color="warning" />
                  ) : sale.status === 'cancelled' ? (
                    <Chip label="Cancelled" size="small" color="default" />
                  ) : null}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onViewDetails(sale)}
                        sx={{
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.50' }
                        }}
                      >
                        <Visibility fontSize="small" />
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
    </Box>
  )
}
