/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Box, CircularProgress } from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardStats from '../components/dashboard/DashboardStats'
import ExpiryAlertCard from '../components/dashboard/ExpiryAlertCard'
import LowStockAlertsCard from '../components/dashboard/LowStockAlertsCard'
import QuickActionsCard from '../components/dashboard/QuickActionsCard'
import RecentSalesCard from '../components/dashboard/RecentSalesCard'
import RevenueDistributionChart from '../components/dashboard/RevenueDistributionChart'
import SalesTrendChart from '../components/dashboard/SalesTrendChart'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import { LowStockItem, RecentSale, DashboardStats as StatsType } from '../types/dashboard'

export default function Dashboard(): React.JSX.Element {
  const user = useAuthStore((state) => state.user)
  const currency = useSettingsStore((state) => state.currency)

  const [stats, setStats] = useState<StatsType>({
    todaySales: 0,
    todayRevenue: 0,
    lowStockCount: 0,
    totalProducts: 0,
    totalCustomers: 0,
    monthlyRevenue: 0
  })
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [salesTrendData, setSalesTrendData] = useState<
    Array<{ date: string; sales: number; revenue: number }>
  >([])
  const [revenueDistributionData, setRevenueDistributionData] = useState<
    Array<{ category: string; revenue: number; color: string }>
  >([])
  const [loading, setLoading] = useState(true)

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
    const loadDashboardData = async (): Promise<void> => {
      try {
        setLoading(true)

        // Get all sales first
        const allSalesData = await window.api.sales.getAll()
        const allSales = allSalesData as unknown as Array<{
          createdAt: string
          totalAmount: number
        }>

        // Filter today's sales
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todaySales = allSales.filter((sale) => {
          const saleDate = new Date(sale.createdAt)
          saleDate.setHours(0, 0, 0, 0)
          return saleDate.getTime() === today.getTime()
        })
        const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0)

        // Filter monthly sales
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        firstDayOfMonth.setHours(0, 0, 0, 0)
        const endOfToday = new Date()
        endOfToday.setHours(23, 59, 59, 999)

        const monthlySales = allSales.filter((sale) => {
          const saleDate = new Date(sale.createdAt)
          return saleDate >= firstDayOfMonth && saleDate <= endOfToday
        })
        const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + sale.totalAmount, 0)

        // Load low stock items
        const lowStock = await window.api.inventory.getLowStock()

        // Load products
        const products = await window.api.products.getAll()

        // Load customers
        const customers = await window.api.customers.getAll()

        // Get recent 5 sales
        const recentData = allSalesData.slice(0, 5)
        const recent = recentData as unknown as RecentSale[]

        // Map low stock data to LowStockItem format
        const lowStockData = lowStock as unknown as Array<{
          id: string
          productName: string
          quantity: number
          reorderLevel: number
          unitPrice: number
        }>
        const mappedLowStock: LowStockItem[] = lowStockData.map((item) => ({
          id: item.id,
          productName: item.productName,
          currentStock: item.quantity,
          minimumStock: item.reorderLevel,
          unitPrice: item.unitPrice || 0
        }))

        setStats({
          todaySales: todaySales.length,
          todayRevenue: todayRevenue,
          lowStockCount: lowStock.length,
          totalProducts: products.length,
          totalCustomers: customers.length,
          monthlyRevenue: monthlyRevenue
        })

        setRecentSales(recent)
        setLowStockItems(mappedLowStock.slice(0, 5))

        // Calculate sales trend data (last 7 days)
        const trendData: { date: string; sales: number; revenue: number }[] = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          date.setHours(0, 0, 0, 0)

          const dayEnd = new Date(date)
          dayEnd.setHours(23, 59, 59, 999)

          const daySales = allSales.filter((sale) => {
            const saleDate = new Date(sale.createdAt)
            return saleDate >= date && saleDate <= dayEnd
          })

          const dayRevenue = daySales.reduce((sum, sale) => sum + sale.totalAmount, 0)

          trendData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sales: daySales.length,
            revenue: dayRevenue
          })
        }
        setSalesTrendData(trendData)

        // Calculate revenue distribution - simplified version using product count by category
        const categoryRevenue = new Map<string, number>()

        // Get all categories
        const allCategoriesData = await window.api.categories.getAll()
        const allCategories = allCategoriesData as unknown as Array<{ id: string; name: string }>
        const categoryMap = new Map(allCategories.map((cat) => [cat.id, cat.name]))

        // Count products by category and estimate revenue distribution
        const productsData = products as unknown as Array<{
          categoryId: string
          sellingPrice: number
        }>
        productsData.forEach((product) => {
          if (product.categoryId) {
            const categoryName = categoryMap.get(product.categoryId) || 'Uncategorized'
            // Estimate category value based on product prices
            const estimatedValue = product.sellingPrice || 0
            categoryRevenue.set(
              categoryName,
              (categoryRevenue.get(categoryName) || 0) + estimatedValue
            )
          } else {
            const estimatedValue = product.sellingPrice || 0
            categoryRevenue.set(
              'Uncategorized',
              (categoryRevenue.get('Uncategorized') || 0) + estimatedValue
            )
          }
        })

        // Convert to array and sort by revenue
        const sortedCategories = Array.from(categoryRevenue.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5) // Top 5 categories

        // If no categories, create placeholder data
        let distributionData
        if (sortedCategories.length === 0) {
          distributionData = [{ category: 'No Data', revenue: 0, color: '#e0e0e0' }]
        } else {
          // Assign colors
          const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f']
          distributionData = sortedCategories.map(([category, revenue], index) => ({
            category: category.length > 12 ? category.substring(0, 12) + '...' : category,
            revenue,
            color: colors[index] || '#757575'
          }))
        }

        setRevenueDistributionData(distributionData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    )
  }

  const currencySymbol = getCurrencySymbol()

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <DashboardHeader userName={user?.fullName || 'User'} />

      <div data-tour="dashboard-stats">
        <DashboardStats stats={stats} currencySymbol={currencySymbol} />
      </div>

      {/* Charts Section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
          mb: 3
        }}
        data-tour="sales-chart"
      >
        <SalesTrendChart data={salesTrendData} currencySymbol={currencySymbol} />
        <RevenueDistributionChart data={revenueDistributionData} currencySymbol={currencySymbol} />
      </Box>

      {/* Expiry Alerts Section */}
      <Box sx={{ mb: 3 }} data-tour="expiry-alerts">
        <ExpiryAlertCard currencySymbol={currencySymbol} />
      </Box>

      {/* Two Column Layout */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
          mb: 3
        }}
      >
        <div data-tour="recent-sales">
          <RecentSalesCard sales={recentSales} currencySymbol={currencySymbol} />
        </div>
        <div data-tour="low-stock-alerts">
          <LowStockAlertsCard items={lowStockItems} currencySymbol={currencySymbol} />
        </div>
      </Box>

      <div data-tour="quick-actions">
        <QuickActionsCard />
      </div>
    </Box>
  )
}
