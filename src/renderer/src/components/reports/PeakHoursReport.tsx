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

interface PeakHoursData {
  hour: number
  displayHour: string
  salesCount: number
  revenue: number
}

interface PeakHoursReportProps {
  data: PeakHoursData[]
}

export default function PeakHoursReport({ data }: PeakHoursReportProps): React.ReactElement {
  // Add safety checks
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No sales data available for peak hours analysis
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

  const totalSales = data.reduce((sum, item) => sum + (item?.salesCount || 0), 0)
  const totalRevenue = data.reduce((sum, item) => sum + (item?.revenue || 0), 0)
  const peakHour = data.reduce((prev, current) =>
    (current?.salesCount || 0) > (prev?.salesCount || 0) ? current : prev
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Total Sales
            </Typography>
            <Typography variant="h5">{totalSales}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Total Revenue
            </Typography>
            <Typography variant="h5">{formatCurrency(totalRevenue)}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Peak Hour
            </Typography>
            <Typography variant="h5">{peakHour.displayHour}</Typography>
            <Typography color="text.secondary" variant="caption">
              {peakHour.salesCount} sales
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography gutterBottom variant="h6">
          Sales by Hour
        </Typography>
        <ResponsiveContainer height={400} width="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="displayHour" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip
              formatter={(value: number, name: string) => [
                name === 'revenue' ? formatCurrency(value) : value,
                name === 'salesCount' ? 'Sales' : 'Revenue'
              ]}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="salesCount" fill="#8884d8" name="Sales Count" />
            <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  )
}
