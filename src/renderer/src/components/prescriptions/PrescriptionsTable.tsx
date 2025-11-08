/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { AttachFile, Delete, Description, Edit, Link, Visibility } from '@mui/icons-material'
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
import { Prescription } from '../../types/prescription'
import SaleLinkModal from './SaleLinkModal'

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

interface PrescriptionsTableProps {
  prescriptions: Prescription[]
  onEdit: (prescription: Prescription) => void
  onView: (prescription: Prescription) => void
  onDelete: (id: string) => void
  onRefresh?: () => void
  page?: number
  totalRecords?: number
  limit?: number
  onServerPageChange?: (page: number) => void
}

export default function PrescriptionsTable({
  prescriptions,
  onEdit,
  onView,
  onDelete,
  onRefresh,
  page: serverPage,
  totalRecords,
  limit: serverLimit,
  onServerPageChange
}: PrescriptionsTableProps): React.JSX.Element {
  const [localPage, setLocalPage] = useState(0)
  const [localRowsPerPage, setLocalRowsPerPage] = useState(25)
  const [showSaleLinkModal, setShowSaleLinkModal] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)

  // Use server pagination if available, otherwise local
  const usingServerPagination = serverPage !== undefined && totalRecords !== undefined
  const currentPage = usingServerPagination ? serverPage - 1 : localPage
  const rowsPerPage = usingServerPagination ? serverLimit || 50 : localRowsPerPage
  const total = usingServerPagination ? totalRecords : prescriptions.length

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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const handleLinkSale = (prescription: Prescription): void => {
    setSelectedPrescription(prescription)
    setShowSaleLinkModal(true)
  }

  const handleSaleLinkModalClose = (): void => {
    setShowSaleLinkModal(false)
    setSelectedPrescription(null)
  }

  const handleSaleLinked = (): void => {
    if (onRefresh) {
      onRefresh()
    }
  }

  const paginatedPrescriptions = usingServerPagination
    ? prescriptions
    : prescriptions.slice(
        localPage * localRowsPerPage,
        localPage * localRowsPerPage + localRowsPerPage
      )

  if (paginatedPrescriptions.length === 0) {
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
            <Description />
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
          No prescriptions found
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Get started by adding a new prescription.
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
              <StyledTableCell>Prescription</StyledTableCell>
              <StyledTableCell>Customer</StyledTableCell>
              <StyledTableCell>Doctor</StyledTableCell>
              <StyledTableCell>Diagnosis</StyledTableCell>
              <StyledTableCell>Prescription Date</StyledTableCell>
              <StyledTableCell>Document</StyledTableCell>
              <StyledTableCell>Linked Sale</StyledTableCell>
              <StyledTableCell align="right">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPrescriptions.map((prescription) => (
              <TableRow key={prescription.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: 'info.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}
                    >
                      <Description fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {prescription.prescriptionNumber || 'RX-' + prescription.id.slice(0, 6)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        #{prescription.id.slice(0, 8)}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {prescription.customer?.name || 'Unknown'}
                  </Typography>
                  {prescription.customer?.phone && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {prescription.customer.phone}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: 'text.primary',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {prescription.doctorName || 'N/A'}
                  </Typography>
                  {prescription.doctorPhone && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {prescription.doctorPhone}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: 'text.primary',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {prescription.diagnosis || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {formatDate(prescription.prescriptionDate)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {new Date(prescription.createdAt).toLocaleTimeString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {prescription.imageUrl ? (
                      <>
                        <AttachFile sx={{ fontSize: 18, color: 'success.main' }} />
                        <Chip label="Attached" size="small" color="success" />
                      </>
                    ) : (
                      <Chip label="No Document" size="small" variant="outlined" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {prescription.sale ? (
                      <>
                        <Link sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Chip
                          label={prescription.sale.invoiceNumber}
                          size="small"
                          color="primary"
                        />
                      </>
                    ) : (
                      <Chip label="No Sale" size="small" variant="outlined" />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onView(prescription)}
                        sx={{
                          color: 'info.main',
                          '&:hover': { bgcolor: 'info.50' }
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Link to Sale">
                      <IconButton
                        size="small"
                        onClick={() => handleLinkSale(prescription)}
                        sx={{
                          color: prescription.sale ? 'success.main' : 'warning.main',
                          '&:hover': { bgcolor: prescription.sale ? 'success.50' : 'warning.50' }
                        }}
                      >
                        <Link fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Prescription">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(prescription)}
                        sx={{
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.50' }
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Prescription">
                      <IconButton
                        size="small"
                        onClick={() => onDelete(prescription.id)}
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

      {/* Sale Link Modal */}
      {showSaleLinkModal && selectedPrescription && (
        <SaleLinkModal
          isOpen={showSaleLinkModal}
          onClose={handleSaleLinkModalClose}
          prescription={selectedPrescription}
          onSaleLinked={handleSaleLinked}
        />
      )}
    </Box>
  )
}
