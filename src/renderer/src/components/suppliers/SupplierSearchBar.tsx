/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Add, CloudDownload, Receipt, Search } from '@mui/icons-material'
import { Box, Button, InputAdornment, Paper, TextField } from '@mui/material'
import { Link } from 'react-router-dom'

interface SupplierSearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onAddClick: () => void
  onExportClick: () => void
}

export default function SupplierSearchBar({
  searchTerm,
  onSearchChange,
  onAddClick,
  onExportClick
}: SupplierSearchBarProps): React.JSX.Element {
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
        <TextField
          size="small"
          placeholder="Search by name, code, phone or email..."
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

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<CloudDownload />} onClick={onExportClick}>
            Export Data
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={onAddClick}>
            Add Supplier
          </Button>
          <Button
            component={Link}
            to="/supplier-ledger"
            variant="contained"
            startIcon={<Receipt />}
            sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
          >
            Supplier Ledger
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}
