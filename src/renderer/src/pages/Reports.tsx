/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Box, CircularProgress, Container, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ExportModal from '../components/export/ExportModal'
import FeatureGuard from '../components/FeatureGuard'
import CustomerReport from '../components/reports/CustomerReport'
import CustomerRFMReport from '../components/reports/CustomerRFMReport'
import EmployeePerformanceReport from '../components/reports/EmployeePerformanceReport'
import InventoryReport from '../components/reports/InventoryReport'
import OverviewReport from '../components/reports/OverviewReport'
import PaymentMethodReport from '../components/reports/PaymentMethodReport'
import PeakHoursReport from '../components/reports/PeakHoursReport'
import ProfitMarginReport from '../components/reports/ProfitMarginReport'
import ReportFilters from '../components/reports/ReportFilters'
import SalesReport from '../components/reports/SalesReport'
import SlowMovingStockReport from '../components/reports/SlowMovingStockReport'
import VendorPerformanceReport from '../components/reports/VendorPerformanceReport'
import YearOverYearReport from '../components/reports/YearOverYearReport'
import { useSettingsStore } from '../store/settingsStore'
import { ReportData } from '../types/report'

export default function Reports(): React.JSX.Element {
  const currency = useSettingsStore((state) => state.currency)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [dateRange, setDateRange] = useState('30')
  const [reportType, setReportType] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [showExportModal, setShowExportModal] = useState(false)

  // Advanced reports data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [advancedReportData, setAdvancedReportData] = useState<any>(null)

  // Get currency symbol
  const getCurrencySymbol = (): string => {
    switch (currency) {
      case 'USD':
        return '$'
      case 'EUR':
        return '€'
      case 'GBP':
        return '£'
      case 'BDT':
        return '৳'
      case 'INR':
        return '₹'
      default:
        return '$'
    }
  }

  useEffect(() => {
    loadReportData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, reportType])

  const loadReportData = async (): Promise<void> => {
    setLoading(true)
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(dateRange))

      // Fetch all sales and filter in JavaScript for accuracy
      const allSalesData = await window.api.sales.getAll()

      // Filter sales by date range
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allSales = allSalesData.filter((sale: any) => {
        const saleDate = new Date(sale.createdAt)
        return saleDate >= startDate && saleDate <= endDate
      })

      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      // Load data from database in parallel
      const [salesSummary, topProducts, allCustomers, allProducts, inventoryData] =
        await Promise.all([
          window.api.reports.salesSummary(startDateStr, endDateStr),
          window.api.reports.topProducts(startDateStr, endDateStr, 5),
          window.api.customers.getAll(),
          window.api.products.getAll(),
          window.api.inventory.getAll()
        ])

      // Process inventory data
      const lowStockProducts = inventoryData.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => item.quantity <= item.reorderLevel && item.quantity > 0
      )
      const outOfStockProducts = inventoryData.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => item.quantity === 0
      )
      const lowStockItems = lowStockProducts.length
      const outOfStockItems = outOfStockProducts.length

      // Get recent sales (last 5)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recentSales = allSales.slice(0, 5).map((sale: any) => ({
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customerName || 'Walk-in Customer',
        total: parseFloat(sale.totalAmount || 0),
        date: sale.createdAt
      }))

      // Calculate total revenue directly from sales array
      const totalRevenue = allSales.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sum, sale: any) => sum + parseFloat(sale.totalAmount || 0),
        0
      )
      const totalSalesCount = allSales.length

      // Calculate monthly sales for the last 6 months
      const monthlySalesMap = new Map<string, { revenue: number; sales: number }>()
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ]

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthlySalesMap.set(monthKey, { revenue: 0, sales: 0 })
      }

      // Aggregate sales by month
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allSales.forEach((sale: any) => {
        const saleDate = new Date(sale.createdAt)
        const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`

        if (monthlySalesMap.has(monthKey)) {
          const current = monthlySalesMap.get(monthKey)!
          current.revenue += parseFloat(sale.totalAmount || 0)
          current.sales += 1
        }
      })

      // Convert to array format
      const monthlySales = Array.from(monthlySalesMap.entries()).map(([key, data]) => {
        const month = key.split('-')[1]
        const monthIndex = parseInt(month) - 1
        return {
          month: monthNames[monthIndex],
          revenue: data.revenue,
          sales: data.sales
        }
      })

      console.log('Sales Summary:', salesSummary)
      console.log('Top Products:', topProducts)
      console.log('All Sales Count:', allSales.length)
      console.log('Total Revenue Calculated:', totalRevenue)
      console.log('First Sale:', allSales[0])
      console.log('Monthly Sales:', monthlySales)

      const reportDataObj: ReportData = {
        totalRevenue: totalRevenue,
        totalSales: totalSalesCount,
        totalCustomers: allCustomers.length,
        totalProducts: allProducts.length,
        lowStockItems,
        outOfStockItems,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lowStockProducts: lowStockProducts.map((item: any) => ({
          id: item.productId,
          name: item.productName,
          quantity: item.quantity,
          reorderLevel: item.reorderLevel
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        outOfStockProducts: outOfStockProducts.map((item: any) => ({
          id: item.productId,
          name: item.productName,
          quantity: item.quantity,
          reorderLevel: item.reorderLevel
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        topSellingProducts: topProducts.map((p: any) => ({
          id: p.productId,
          name: p.productName,
          quantity: parseInt(p.totalQuantity) || 0,
          revenue: parseFloat(p.totalRevenue) || 0
        })),
        recentSales,
        monthlySales
      }

      setReportData(reportDataObj)

      // Load advanced reports data based on report type
      if (reportType === 'profitMargin') {
        const data = await window.api.reports.profitMargin(startDateStr, endDateStr)
        setAdvancedReportData(data)
      } else if (reportType === 'vendorPerformance') {
        const data = await window.api.reports.vendorPerformance(startDateStr, endDateStr)
        setAdvancedReportData(data)
      } else if (reportType === 'employeePerformance') {
        const data = await window.api.reports.employeePerformance(startDateStr, endDateStr)
        setAdvancedReportData(data)
      } else if (reportType === 'slowMovingStock') {
        const data = await window.api.reports.slowMovingStock(startDateStr, endDateStr)
        setAdvancedReportData(data)
      } else if (reportType === 'paymentMethod') {
        const data = await window.api.reports.paymentMethodAnalysis(startDateStr, endDateStr)
        setAdvancedReportData(data)
      } else if (reportType === 'peakHours') {
        const data = await window.api.reports.peakHoursAnalysis(startDateStr, endDateStr)
        setAdvancedReportData(data)
      } else if (reportType === 'customerRFM') {
        const data = await window.api.reports.customerRFMAnalysis()
        setAdvancedReportData(data)
      } else if (reportType === 'yearOverYear') {
        const data = await window.api.reports.yearOverYear()
        setAdvancedReportData(data)
      }
    } catch (error) {
      console.error('Failed to load report data:', error)
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = (): void => {
    setShowExportModal(true)
  }

  const printReport = (): void => {
    // Create a print-friendly version of the current report
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow popups to print reports')
      return
    }

    const reportTitle = getReportTitle(reportType)
    const dateRangeText = getDateRangeText(dateRange)
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Get the report content
    const reportContent = document.querySelector('[data-tour^="reports-"]')?.innerHTML || ''

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle} - ${dateRangeText}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 20px;
              color: #333;
            }
            .print-header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #1976d2;
            }
            .print-header h1 {
              font-size: 28px;
              color: #1976d2;
              margin-bottom: 10px;
            }
            .print-header .subtitle {
              font-size: 16px;
              color: #666;
              margin-bottom: 5px;
            }
            .print-header .date {
              font-size: 14px;
              color: #999;
            }
            .report-content {
              margin: 20px 0;
            }
            .MuiPaper-root {
              border: 1px solid #ddd;
              padding: 20px;
              margin-bottom: 20px;
              border-radius: 8px;
              box-shadow: none !important;
              page-break-inside: avoid;
            }
            .MuiCard-root {
              border: 1px solid #ddd;
              padding: 15px;
              margin: 10px 0;
              border-radius: 8px;
              box-shadow: none !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #f5f5f5;
              font-weight: 600;
              color: #1976d2;
            }
            button, .no-print {
              display: none !important;
            }
            canvas {
              max-width: 100%;
              height: auto !important;
            }
            @media print {
              body {
                padding: 10px;
              }
              .MuiPaper-root, .MuiCard-root {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              @page {
                margin: 1.5cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${reportTitle}</h1>
            <div class="subtitle">Period: ${dateRangeText}</div>
            <div class="date">Generated on: ${currentDate}</div>
          </div>
          <div class="report-content">
            ${reportContent}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const getReportTitle = (type: string): string => {
    const titles: Record<string, string> = {
      overview: 'Overview Report',
      sales: 'Sales Report',
      inventory: 'Inventory Report',
      customer: 'Customer Report',
      profitMargin: 'Profit Margin Analysis',
      vendorPerformance: 'Vendor Performance Report',
      employeePerformance: 'Employee Performance Report',
      slowMovingStock: 'Slow Moving Stock Report',
      paymentMethod: 'Payment Method Analysis',
      peakHours: 'Peak Hours Analysis',
      customerRFM: 'Customer RFM Analysis',
      yearOverYear: 'Year-over-Year Comparison'
    }
    return titles[type] || 'Report'
  }

  const getDateRangeText = (range: string): string => {
    const days = parseInt(range)
    if (days === 7) return 'Last 7 Days'
    if (days === 30) return 'Last 30 Days'
    if (days === 90) return 'Last 90 Days'
    if (days === 365) return 'Last Year'
    return `Last ${days} Days`
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px'
          }}
        >
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Loading reports...
          </Typography>
        </Box>
      </Container>
    )
  }

  if (!reportData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px'
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No data available
          </Typography>
        </Box>
      </Container>
    )
  }

  const currencySymbol = getCurrencySymbol()

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
      {/* Page Header */}
      <Box
        sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        data-tour="reports-header"
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Reports & Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your pharmacy performance and insights
          </Typography>
        </Box>
      </Box>

      <div data-tour="reports-filters">
        <ReportFilters
          reportType={reportType}
          dateRange={dateRange}
          onReportTypeChange={setReportType}
          onDateRangeChange={setDateRange}
          onPrint={printReport}
          onExport={exportReport}
        />
      </div>

      {reportType === 'overview' && (
        <div data-tour="reports-overview">
          <OverviewReport
            reportData={reportData}
            currencySymbol={currencySymbol}
            dateRange={dateRange}
          />
        </div>
      )}
      {reportType === 'sales' && (
        <div data-tour="reports-sales">
          <SalesReport
            reportData={reportData}
            currencySymbol={currencySymbol}
            dateRange={dateRange}
          />
        </div>
      )}
      {reportType === 'inventory' && (
        <FeatureGuard featureId="advanced_inventory">
          <div data-tour="reports-inventory">
            <InventoryReport reportData={reportData} />
          </div>
        </FeatureGuard>
      )}
      {reportType === 'customer' && (
        <FeatureGuard featureId="comprehensive_reports">
          <div data-tour="reports-customer">
            <CustomerReport reportData={reportData} currencySymbol={currencySymbol} />
          </div>
        </FeatureGuard>
      )}

      {/* Advanced Reports */}
      {reportType === 'profitMargin' && advancedReportData && (
        <FeatureGuard featureId="comprehensive_reports">
          <div data-tour="reports-profit-margin">
            <ProfitMarginReport data={advancedReportData} />
          </div>
        </FeatureGuard>
      )}
      {reportType === 'vendorPerformance' && advancedReportData && (
        <FeatureGuard featureId="comprehensive_reports">
          <div data-tour="reports-vendor-performance">
            <VendorPerformanceReport data={advancedReportData} />
          </div>
        </FeatureGuard>
      )}
      {reportType === 'employeePerformance' && advancedReportData && (
        <FeatureGuard featureId="comprehensive_reports">
          <div data-tour="reports-employee-performance">
            <EmployeePerformanceReport data={advancedReportData} />
          </div>
        </FeatureGuard>
      )}
      {reportType === 'slowMovingStock' && advancedReportData && (
        <FeatureGuard featureId="comprehensive_reports">
          <div data-tour="reports-slow-moving-stock">
            <SlowMovingStockReport data={advancedReportData} />
          </div>
        </FeatureGuard>
      )}
      {reportType === 'paymentMethod' && advancedReportData && (
        <FeatureGuard featureId="comprehensive_reports">
          <div data-tour="reports-payment-method">
            <PaymentMethodReport data={advancedReportData} />
          </div>
        </FeatureGuard>
      )}
      {reportType === 'peakHours' && advancedReportData && (
        <FeatureGuard featureId="comprehensive_reports">
          <div data-tour="reports-peak-hours">
            <PeakHoursReport data={advancedReportData} />
          </div>
        </FeatureGuard>
      )}
      {reportType === 'customerRFM' && advancedReportData && (
        <FeatureGuard featureId="comprehensive_reports">
          <div data-tour="reports-customer-rfm">
            <CustomerRFMReport data={advancedReportData} />
          </div>
        </FeatureGuard>
      )}
      {reportType === 'yearOverYear' && advancedReportData && (
        <FeatureGuard featureId="comprehensive_reports">
          <div data-tour="reports-year-over-year">
            <YearOverYearReport data={advancedReportData} />
          </div>
        </FeatureGuard>
      )}

      {/* Export Modal - Show sales by default for reports */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultExportType="sales"
      />
    </Container>
  )
}
