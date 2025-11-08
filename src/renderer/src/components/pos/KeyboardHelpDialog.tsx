/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Close, Keyboard } from '@mui/icons-material'
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
  useTheme
} from '@mui/material'

interface KeyboardShortcut {
  key: string
  description: string
  category: string
}

interface KeyboardHelpDialogProps {
  open: boolean
  onClose: () => void
}

const shortcuts: KeyboardShortcut[] = [
  // Function Keys
  { key: 'F1', description: 'Show this help dialog', category: 'Navigation' },
  { key: 'F2', description: 'Quick product search', category: 'Navigation' },
  { key: 'F3', description: 'Customer search', category: 'Navigation' },
  { key: 'F4', description: 'Focus payment field', category: 'Navigation' },
  { key: 'F5', description: 'Process checkout', category: 'Actions' },
  { key: 'F6', description: 'Apply discount', category: 'Actions' },
  { key: 'F7', description: 'Clear cart', category: 'Actions' },
  { key: 'F8', description: 'Reset all fields', category: 'Actions' },
  { key: 'F9', description: 'Print last receipt', category: 'Actions' },
  { key: 'F10', description: 'Quantity mode', category: 'Navigation' },
  { key: 'F11', description: 'Hold current transaction', category: 'Actions' },
  { key: 'F12', description: 'Open settings', category: 'Navigation' },

  // Quick Actions
  { key: 'Enter', description: 'Add selected product to cart', category: 'Quick Actions' },
  { key: 'Escape', description: 'Cancel current action', category: 'Quick Actions' },
  { key: 'Delete', description: 'Remove selected cart item', category: 'Quick Actions' },
  { key: '+', description: 'Increase quantity of last item', category: 'Quick Actions' },
  { key: '-', description: 'Decrease quantity of last item', category: 'Quick Actions' },
  { key: '*', description: 'Apply discount to cart', category: 'Quick Actions' },
  { key: '/', description: 'Focus product search', category: 'Quick Actions' },

  // Number Pad
  { key: '0-9', description: 'Quick quantity/amount entry', category: 'Number Pad' },
  { key: '.', description: 'Decimal point for amounts', category: 'Number Pad' }
]

export default function KeyboardHelpDialog({
  open,
  onClose
}: KeyboardHelpDialogProps): React.JSX.Element {
  const theme = useTheme()

  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = []
      }
      acc[shortcut.category].push(shortcut)
      return acc
    },
    {} as Record<string, KeyboardShortcut[]>
  )

  const getKeyStyle = (key: string): object => {
    if (key.startsWith('F')) {
      return { bgcolor: 'primary.100', color: 'primary.dark', fontWeight: 600 }
    }
    if (key.length === 1 || key === 'Enter' || key === 'Escape' || key === 'Delete') {
      return { bgcolor: 'success.100', color: 'success.dark', fontWeight: 600 }
    }
    return { bgcolor: 'grey.200', color: 'text.primary', fontWeight: 600 }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'primary.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Keyboard sx={{ color: 'primary.main', fontSize: 24 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Keyboard Shortcuts
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Use these keyboard shortcuts to work faster and more efficiently in the POS system.
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <Box key={category} sx={{ flex: '1 1 300px', minWidth: 0 }}>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box
                    sx={{
                      width: 4,
                      height: 16,
                      bgcolor: 'primary.main',
                      borderRadius: 2
                    }}
                  />
                  {category}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {categoryShortcuts.map((shortcut, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        '&:hover': {
                          bgcolor: 'grey.100'
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'text.primary', flex: 1 }}>
                        {shortcut.description}
                      </Typography>
                      <Chip
                        label={shortcut.key}
                        size="small"
                        sx={{
                          ...getKeyStyle(shortcut.key),
                          minWidth: 45,
                          fontFamily: 'monospace',
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
              {category !== 'Number Pad' && <Divider sx={{ my: 2 }} />}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: theme.palette.info.light + '20',
            border: 1,
            borderColor: 'info.200'
          }}
        >
          <Typography variant="body2" sx={{ color: 'info.dark', fontWeight: 500, mb: 1 }}>
            💡 Pro Tips:
          </Typography>
          <Typography variant="body2" sx={{ color: 'info.dark', lineHeight: 1.6 }}>
            • Function keys work from anywhere in the POS system
            <br />
            • Use the number pad for quick quantity and payment entry
            <br />
            • Press F1 anytime to see this help dialog
            <br />• Combine shortcuts for lightning-fast checkout workflows
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
