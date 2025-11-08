/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { AccountBalance, Delete, Edit, TuneOutlined } from '@mui/icons-material'
import {
  Box,
  Chip,
  CircularProgress,
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
import { BankAccount } from '../../types/bankAccount'

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

interface BankAccountsTableProps {
  accounts: BankAccount[]
  loading: boolean
  hasAdjustPermission: boolean
  onEdit: (account: BankAccount) => void
  onDelete: (id: string) => void
  onAdjustBalance: (account: BankAccount) => void
  page?: number
  totalRecords?: number
  limit?: number
  onServerPageChange?: (page: number) => void
}

export default function BankAccountsTable({
  accounts,
  loading,
  hasAdjustPermission,
  onEdit,
  onDelete,
  onAdjustBalance,
  page: serverPage,
  totalRecords,
  limit: serverLimit,
  onServerPageChange
}: BankAccountsTableProps): React.JSX.Element {
  const [localPage, setLocalPage] = useState(0)
  const [localRowsPerPage, setLocalRowsPerPage] = useState(25)

  // Use server pagination if available, otherwise local
  const usingServerPagination = serverPage !== undefined && totalRecords !== undefined
  const currentPage = usingServerPagination ? serverPage - 1 : localPage
  const rowsPerPage = usingServerPagination ? serverLimit || 50 : localRowsPerPage
  const total = usingServerPagination ? totalRecords : accounts.length

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

  const paginatedAccounts = usingServerPagination
    ? accounts
    : accounts.slice(localPage * localRowsPerPage, localPage * localRowsPerPage + localRowsPerPage)

  const getAccountTypeLabel = (type: string): string => {
    switch (type) {
      case 'cash':
        return 'Cash'
      case 'bank':
        return 'Bank Account'
      case 'mobile_banking':
        return 'Mobile Banking'
      default:
        return type
    }
  }

  const getAccountTypeColor = (type: string): 'success' | 'info' | 'secondary' | 'default' => {
    switch (type) {
      case 'cash':
        return 'success'
      case 'bank':
        return 'info'
      case 'mobile_banking':
        return 'secondary'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 12, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    )
  }

  if (paginatedAccounts.length === 0) {
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
            <AccountBalance />
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
          No accounts found
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Get started by creating a new account
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
              <StyledTableCell>Account Name</StyledTableCell>
              <StyledTableCell>Type</StyledTableCell>
              <StyledTableCell>Account Number</StyledTableCell>
              <StyledTableCell>Bank/Provider</StyledTableCell>
              <StyledTableCell align="right">Current Balance</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell align="right">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAccounts.map((account) => (
              <TableRow key={account.id} hover>
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
                        color: 'white'
                      }}
                    >
                      <AccountBalance fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {account.name}
                      </Typography>
                      {account.description && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {account.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getAccountTypeLabel(account.accountType)}
                    size="small"
                    color={getAccountTypeColor(account.accountType)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {account.accountNumber || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {account.bankName || '-'}
                  </Typography>
                  {account.branchName && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {account.branchName}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: account.currentBalance >= 0 ? 'success.main' : 'error.main'
                    }}
                  >
                    ${Math.abs(account.currentBalance).toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={account.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={account.isActive ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Tooltip title="Edit Account">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(account)}
                        sx={{
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.50' }
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {hasAdjustPermission && (
                      <Tooltip title="Adjust Balance">
                        <IconButton
                          size="small"
                          onClick={() => onAdjustBalance(account)}
                          sx={{
                            color: 'secondary.main',
                            '&:hover': { bgcolor: 'secondary.50' }
                          }}
                        >
                          <TuneOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete Account">
                      <IconButton
                        size="small"
                        onClick={() => onDelete(account.id)}
                        sx={{
                          color: 'error.main',
                          '&:hover': { bgcolor: 'error.50' }
                        }}
                      >
                        <Delete fontSize="small" />
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
