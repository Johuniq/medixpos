/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { AssignmentReturn, CloudDownload, Search } from '@mui/icons-material'
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

interface SalesFiltersProps {
  searchTerm: string
  statusFilter: string
  paymentFilter: string
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onPaymentFilterChange: (value: string) => void
  onReturnClick: () => void
  onExportClick: () => void
}

export default function SalesFilters({
  searchTerm,
  statusFilter,
  paymentFilter,
  onSearchChange,
  onStatusFilterChange,
  onPaymentFilterChange,
  onReturnClick,
  onExportClick
}: SalesFiltersProps): React.JSX.Element {
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
        <Box sx={{ display: 'flex', gap: 2, flex: 1, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search by invoice or customer..."
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
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
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
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="mobile">Mobile</MenuItem>
              <MenuItem value="credit">Credit</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CloudDownload />}
            onClick={onExportClick}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Export Data
          </Button>
          <Button
            variant="contained"
            startIcon={<AssignmentReturn />}
            onClick={onReturnClick}
            sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
          >
            Sales Return
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}
