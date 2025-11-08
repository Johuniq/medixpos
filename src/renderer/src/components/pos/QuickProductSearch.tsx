/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Inventory, Search } from '@mui/icons-material'
import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Product } from '../../types/pos'

interface QuickProductSearchProps {
  open: boolean
  onClose: () => void
  products: Product[]
  onProductSelect: (product: Product) => void
  currencySymbol: string
}

export default function QuickProductSearch({
  open,
  onClose,
  products,
  onProductSelect,
  currencySymbol
}: QuickProductSearchProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products.slice(0, 10)) // Show top 10 products when no search
    } else {
      const filtered = products
        .filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.genericName &&
              product.genericName.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .slice(0, 10)
      setFilteredProducts(filtered)
    }
  }, [searchTerm, products])

  const handleProductSelect = (product: Product): void => {
    onProductSelect(product)
    setSearchTerm('')
    onClose()
  }

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter' && filteredProducts.length > 0) {
      handleProductSelect(filteredProducts[0])
    } else if (event.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    if (open) {
      setSearchTerm('')
    }
  }, [open])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 2,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Search sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Quick Product Search
        </Typography>
        <Chip label="F2" size="small" sx={{ bgcolor: 'primary.100', color: 'primary.dark' }} />
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search by name, barcode, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'grey.300' },
                '&:hover fieldset': { borderColor: 'primary.main' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' }
              }
            }}
          />
        </Box>

        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredProducts.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Inventory sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {searchTerm ? 'No products found' : 'No products available'}
              </Typography>
            </Box>
          ) : (
            filteredProducts.map((product, index) => (
              <ListItem
                key={product.id}
                onClick={() => handleProductSelect(product)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'primary.50' },
                  borderLeft: index === 0 ? 3 : 0,
                  borderColor: 'primary.main'
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.100', color: 'primary.dark' }}>
                    {product.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {product.name}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {product.genericName || 'Generic'} • Barcode: {product.barcode || 'N/A'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {currencySymbol}
                          {product.sellingPrice.toFixed(2)}
                        </Typography>
                        {product.strength && (
                          <Chip
                            label={product.strength}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
                {index === 0 && (
                  <Chip
                    label="Enter"
                    size="small"
                    sx={{ bgcolor: 'success.100', color: 'success.dark', ml: 1 }}
                  />
                )}
              </ListItem>
            ))
          )}
        </List>

        <Box
          sx={{
            p: 2,
            bgcolor: 'grey.50',
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Press Enter to add highlighted product, Esc to cancel
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {filteredProducts.length} product(s)
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
