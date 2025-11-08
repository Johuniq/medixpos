import { TrendingDown, TrendingUp } from '@mui/icons-material'
import { Box, Card, CardContent, Paper, Typography } from '@mui/material'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

interface YearOverYearData {
  currentYear: {
    year: number
    totalSales: number
    totalRevenue: number
    avgSaleValue: number
  }
  lastYear: {
    year: number
    totalSales: number
    totalRevenue: number
    avgSaleValue: number
  }
  growth: {
    salesGrowth: number
    revenueGrowth: number
  }
}

interface YearOverYearReportProps {
  data: YearOverYearData
}

export default function YearOverYearReport({ data }: YearOverYearReportProps): React.ReactElement {
  // Add safety checks
  if (!data || !data.currentYear || !data.lastYear || !data.growth) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Insufficient data to generate year-over-year comparison
        </Typography>
      </Paper>
    )
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT'
    }).format(value)
  }

  const chartData = [
    {
      name: `${data.lastYear.year}`,
      Sales: data.lastYear.totalSales,
      Revenue: data.lastYear.totalRevenue
    },
    {
      name: `${data.currentYear.year}`,
      Sales: data.currentYear.totalSales,
      Revenue: data.currentYear.totalRevenue
    }
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Sales Growth
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {data.growth.salesGrowth >= 0 ? (
                <TrendingUp color="success" />
              ) : (
                <TrendingDown color="error" />
              )}
              <Typography
                variant="h5"
                color={data.growth.salesGrowth >= 0 ? 'success.main' : 'error.main'}
              >
                {data.growth.salesGrowth.toFixed(2)}%
              </Typography>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Revenue Growth
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {data.growth.revenueGrowth >= 0 ? (
                <TrendingUp color="success" />
              ) : (
                <TrendingDown color="error" />
              )}
              <Typography
                variant="h5"
                color={data.growth.revenueGrowth >= 0 ? 'success.main' : 'error.main'}
              >
                {data.growth.revenueGrowth.toFixed(2)}%
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography color="text.secondary" variant="h6">
            {data.lastYear.year} Performance
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Total Sales
            </Typography>
            <Typography variant="h6">{data.lastYear.totalSales}</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
              Total Revenue
            </Typography>
            <Typography variant="h6">{formatCurrency(data.lastYear.totalRevenue)}</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
              Avg Sale Value
            </Typography>
            <Typography variant="h6">{formatCurrency(data.lastYear.avgSaleValue)}</Typography>
          </Box>
        </Paper>

        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography color="text.secondary" variant="h6">
            {data.currentYear.year} Performance
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Total Sales
            </Typography>
            <Typography variant="h6">{data.currentYear.totalSales}</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
              Total Revenue
            </Typography>
            <Typography variant="h6">{formatCurrency(data.currentYear.totalRevenue)}</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
              Avg Sale Value
            </Typography>
            <Typography variant="h6">{formatCurrency(data.currentYear.avgSaleValue)}</Typography>
          </Box>
        </Paper>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography gutterBottom variant="h6">
          Year-over-Year Comparison
        </Typography>
        <ResponsiveContainer height={400} width="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="Sales" fill="#8884d8" />
            <Bar yAxisId="right" dataKey="Revenue" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  )
}
