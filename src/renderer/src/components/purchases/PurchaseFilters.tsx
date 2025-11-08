/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Add, AssignmentReturn, CloudDownload, Search } from '@mui/icons-material'
import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField
} from '@mui/material'

interface PurchaseFiltersProps {
  searchTerm: string
  statusFilter: string
  paymentFilter: string
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onPaymentFilterChange: (value: string) => void
  onAddPurchase: () => void
  onPurchaseReturn: () => void
  onExportClick: () => void
}

export default function PurchaseFilters({
  searchTerm,
  statusFilter,
  paymentFilter,
  onSearchChange,
  onStatusFilterChange,
  onPaymentFilterChange,
  onAddPurchase,
  onPurchaseReturn,
  onExportClick
}: PurchaseFiltersProps): React.JSX.Element {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
            flex: 1
          }}
        >
          <TextField
            size="small"
            placeholder="Search by invoice or supplier..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{ flex: 1, minWidth: 300, maxWidth: 500 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              )
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Payment</InputLabel>
            <Select
              value={paymentFilter}
              label="Payment"
              onChange={(e) => onPaymentFilterChange(e.target.value)}
            >
              <MenuItem value="all">All Payments</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="partial">Partial</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<CloudDownload />} onClick={onExportClick}>
            Export Data
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={onAddPurchase}>
            New Purchase
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AssignmentReturn />}
            onClick={onPurchaseReturn}
          >
            Purchase Return
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}
