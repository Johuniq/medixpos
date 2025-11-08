/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Add, Search, Visibility } from '@mui/icons-material'
import {
  Box,
  Button,
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
  Typography
} from '@mui/material'
import { DamagedItem } from '../../types/return'

interface DamagedItemsTableProps {
  items: DamagedItem[]
  searchTerm: string
  onSearchChange: (term: string) => void
  currentPage: number
  totalPages: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
  onAddDamagedItem: () => void
  onViewDetails: (item: DamagedItem) => void
  page?: number
  totalRecords?: number
  limit?: number
  onServerPageChange?: (page: number) => void
}

export default function DamagedItemsTable({
  items,
  searchTerm,
  onSearchChange,
  onAddDamagedItem,
  onViewDetails
}: DamagedItemsTableProps): React.JSX.Element {
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getReasonColor = (reason: string): 'warning' | 'error' | 'info' => {
    switch (reason) {
      case 'expired':
        return 'warning'
      case 'damaged':
        return 'error'
      default:
        return 'info'
    }
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}
      >
        <TextField
          size="small"
          placeholder="Search by product, reason, or batch number..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ maxWidth: 500, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            )
          }}
        />
        <Button variant="contained" color="error" startIcon={<Add />} onClick={onAddDamagedItem}>
          Report Damaged/Expired Item
        </Button>
      </Box>

      {items.length === 0 ? (
        <Paper sx={{ p: 12, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
            No damaged/expired items found
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Damaged or expired items will appear here.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell>Product</StyledTableCell>
                <StyledTableCell>Quantity</StyledTableCell>
                <StyledTableCell>Reason</StyledTableCell>
                <StyledTableCell>Batch Number</StyledTableCell>
                <StyledTableCell>Expiry Date</StyledTableCell>
                <StyledTableCell>Reported By</StyledTableCell>
                <StyledTableCell>Date Reported</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.productName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.quantity}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.reason.charAt(0).toUpperCase() + item.reason.slice(1)}
                      size="small"
                      color={getReasonColor(item.reason)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {item.batchNumber || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {item.reportedBy}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {formatDate(item.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => onViewDetails(item)}
                      title="View Details"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
