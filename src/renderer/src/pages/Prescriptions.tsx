/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Container } from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import PrescriptionFilters from '../components/prescriptions/PrescriptionFilters'
import PrescriptionFormModal from '../components/prescriptions/PrescriptionFormModal'
import PrescriptionHeader from '../components/prescriptions/PrescriptionHeader'
import PrescriptionsTable from '../components/prescriptions/PrescriptionsTable'
import PrescriptionStats from '../components/prescriptions/PrescriptionStats'
import PrescriptionViewModal from '../components/prescriptions/PrescriptionViewModal'
import { Prescription } from '../types/prescription'

export default function Prescriptions(): React.JSX.Element {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [limit] = useState(50)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFormModal, setShowFormModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null)
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null)

  useEffect(() => {
    loadPrescriptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm])

  useEffect(() => {
    filterPrescriptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescriptions, statusFilter])

  const loadPrescriptions = async (): Promise<void> => {
    try {
      const response = await window.api.prescriptions.getPaginated({
        page,
        limit,
        search: searchTerm
      })

      console.log('Raw prescription data from API:', response.data)

      // The data is already in the correct format from the handler
      const transformedData = (
        response.data as Array<{
          prescription: Record<string, unknown>
          customer: Record<string, unknown> | null
          sale: Record<string, unknown> | null
        }>
      ).map((item) => {
        console.log('Transforming item:', item)
        const transformed = {
          id: (item.prescription?.id || '') as string,
          customerId: (item.prescription?.customerId || '') as string,
          saleId: item.prescription?.saleId as string | undefined,
          doctorName: item.prescription?.doctorName as string | undefined,
          doctorPhone: item.prescription?.doctorPhone as string | undefined,
          prescriptionNumber: item.prescription?.prescriptionNumber as string | undefined,
          prescriptionDate: (item.prescription?.prescriptionDate || '') as string,
          diagnosis: item.prescription?.diagnosis as string | undefined,
          notes: item.prescription?.notes as string | undefined,
          imageUrl: item.prescription?.imageUrl as string | undefined,
          createdAt: (item.prescription?.createdAt || '') as string,
          customer: item.customer
            ? {
                id: (item.customer.id || '') as string,
                name: (item.customer.name || '') as string,
                phone: (item.customer.phone || '') as string
              }
            : undefined,
          sale: item.sale
            ? {
                id: (item.sale.id || '') as string,
                invoiceNumber: (item.sale.invoiceNumber || '') as string,
                totalAmount: (item.sale.totalAmount || 0) as number
              }
            : undefined
        }
        console.log('Transformed prescription:', transformed)
        return transformed
      }) as Prescription[]

      console.log('Final transformed prescriptions:', transformedData)
      setPrescriptions(transformedData)
      setTotalRecords(response.total)
    } catch (error) {
      console.error('Error loading prescriptions:', error)
      toast.error('Failed to load prescriptions')
    }
  }

  const handleSearchChange = (search: string): void => {
    setSearchTerm(search)
    setPage(1)
  }

  const handlePageChange = (newPage: number): void => {
    setPage(newPage)
  }

  const filterPrescriptions = (): void => {
    let filtered = [...prescriptions]

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (prescription) =>
          prescription.prescriptionNumber?.toLowerCase().includes(search) ||
          prescription.customer?.name?.toLowerCase().includes(search) ||
          prescription.customer?.phone?.toLowerCase().includes(search) ||
          prescription.doctorName?.toLowerCase().includes(search) ||
          prescription.diagnosis?.toLowerCase().includes(search)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'with_image':
          filtered = filtered.filter((p) => p.imageUrl && p.imageUrl.length > 0)
          break
        case 'without_image':
          filtered = filtered.filter((p) => !p.imageUrl || p.imageUrl.length === 0)
          break
        case 'linked':
          filtered = filtered.filter((p) => p.saleId)
          break
        case 'unlinked':
          filtered = filtered.filter((p) => !p.saleId)
          break
      }
    }

    setFilteredPrescriptions(filtered)
  }

  const handleAddNew = (): void => {
    setEditingPrescription(null)
    setShowFormModal(true)
  }

  const handleEdit = (prescription: Prescription): void => {
    setEditingPrescription(prescription)
    setShowFormModal(true)
  }

  const handleView = (prescription: Prescription): void => {
    setViewingPrescription(prescription)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string): Promise<void> => {
    console.log('Attempting to delete prescription with ID:', id)
    if (confirm('Are you sure you want to delete this prescription?')) {
      try {
        await window.api.prescriptions.delete(id)
        toast.success('Prescription deleted successfully')
        await loadPrescriptions()
      } catch (error) {
        console.error('Error deleting prescription:', error)
        toast.error('Failed to delete prescription')
      }
    }
  }

  const handleFormClose = async (reload?: boolean): Promise<void> => {
    setShowFormModal(false)
    setEditingPrescription(null)
    if (reload) {
      await loadPrescriptions()
    }
  }

  // Calculate stats
  const totalPrescriptions = filteredPrescriptions.length
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  const thisMonthPrescriptions = filteredPrescriptions.filter(
    (p) => new Date(p.prescriptionDate) >= thisMonth
  ).length
  const withImages = filteredPrescriptions.filter((p) => p.imageUrl && p.imageUrl.length > 0).length
  const linkedToSales = filteredPrescriptions.filter((p) => p.saleId).length

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
      <PrescriptionHeader />

      <PrescriptionStats
        totalPrescriptions={totalPrescriptions}
        thisMonthPrescriptions={thisMonthPrescriptions}
        withImages={withImages}
        linkedToSales={linkedToSales}
      />

      <PrescriptionFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={handleSearchChange}
        onStatusFilterChange={setStatusFilter}
        onAddClick={handleAddNew}
      />

      <PrescriptionsTable
        prescriptions={filteredPrescriptions}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        onRefresh={loadPrescriptions}
        page={page}
        totalRecords={totalRecords}
        limit={limit}
        onServerPageChange={handlePageChange}
      />

      {showFormModal && (
        <PrescriptionFormModal
          isOpen={showFormModal}
          onClose={handleFormClose}
          prescription={editingPrescription}
        />
      )}

      {showViewModal && viewingPrescription && (
        <PrescriptionViewModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          prescription={viewingPrescription}
        />
      )}
    </Container>
  )
}
