/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Search, Visibility } from '@mui/icons-material'
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  styled,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { PurchaseReturn } from '../../types/return'

interface PurchaseReturnsTableProps {
  returns: PurchaseReturn[]
  searchTerm: string
  onSearchChange: (term: string) => void
  currentPage: number
  totalPages: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
  onViewDetails: (returnItem: PurchaseReturn) => Promise<void>
  page?: number
  totalRecords?: number
  limit?: number
  onServerPageChange?: (page: number) => void
}

export default function PurchaseReturnsTable({
  returns,
  searchTerm,
  onSearchChange,
  onViewDetails
}: PurchaseReturnsTableProps): React.JSX.Element {
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRefundStatusColor = (status: string): 'warning' | 'info' | 'success' | 'default' => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'partial':
        return 'info'
      case 'refunded':
        return 'success'
      default:
        return 'default'
    }
  }

  if (returns.length === 0) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <TextField
            size="small"
            placeholder="Search by return number, supplier, or reason..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{ maxWidth: 500 }}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </Box>
        <Paper sx={{ p: 12, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
            No purchase returns found
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Purchase returns will appear here.
          </Typography>
        </Paper>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search by return number, supplier, or reason..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ maxWidth: 500 }}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            )
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Return #</StyledTableCell>
              <StyledTableCell>Supplier</StyledTableCell>
              <StyledTableCell>Total Amount</StyledTableCell>
              <StyledTableCell>Refund Status</StyledTableCell>
              <StyledTableCell>Reason</StyledTableCell>
              <StyledTableCell>Date</StyledTableCell>
              <StyledTableCell align="right">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {returns.map((returnItem) => (
              <TableRow key={returnItem.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {returnItem.returnNumber}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{returnItem.supplierName}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(returnItem.totalAmount)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      returnItem.refundStatus.charAt(0).toUpperCase() +
                      returnItem.refundStatus.slice(1)
                    }
                    size="small"
                    color={getRefundStatusColor(returnItem.refundStatus)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{returnItem.reason || '-'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {formatDate(returnItem.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => onViewDetails(returnItem)}
                      sx={{
                        color: 'primary.main',
                        '&:hover': { bgcolor: 'primary.50' }
                      }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
