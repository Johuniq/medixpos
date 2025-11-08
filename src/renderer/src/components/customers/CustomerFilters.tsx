/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Add, CloudDownload, Search } from '@mui/icons-material'
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

interface CustomerFiltersProps {
  searchTerm: string
  statusFilter: string
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onAddClick: () => void
  onExportClick: () => void
}

export default function CustomerFilters({
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onAddClick,
  onExportClick
}: CustomerFiltersProps): React.JSX.Element {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 2
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'center' },
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            flex: 1
          }}
        >
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{ flex: 1, maxWidth: { sm: 400 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'grey.400' }} />
                </InputAdornment>
              )
            }}
          />

          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Action Buttons */}
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
            startIcon={<Add />}
            onClick={onAddClick}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add Customer
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}
