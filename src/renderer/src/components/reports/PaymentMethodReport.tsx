import { Grid, Box, Card, CardContent, Paper, Typography } from '@mui/material'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface PaymentMethodData {
  paymentMethod: string
  totalSales: number
  totalAmount: number
  avgTransaction: number
}

interface PaymentMethodReportProps {
  data: PaymentMethodData[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function PaymentMethodReport({
  data
}: PaymentMethodReportProps): React.ReactElement {
  // Add safety checks
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No payment method data available</Typography>
      </Paper>
    )
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT'
    }).format(value)
  }

  const totalAmount = data.reduce((sum, item) => sum + (item?.totalAmount || 0), 0)
  const totalTransactions = data.reduce((sum, item) => sum + (item?.totalSales || 0), 0)

  const chartData = data.map((item) => ({
    name: item.paymentMethod,
    value: item.totalAmount
  }))

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              border: '1px solid',
              borderColor: 'grey.200',
              borderRadius: 2
            }}
          >
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(totalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              border: '1px solid',
              borderColor: 'grey.200',
              borderRadius: 2
            }}
          >
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Transactions
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totalTransactions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              border: '1px solid',
              borderColor: 'grey.200',
              borderRadius: 2
            }}
          >
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Payment Methods
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {data.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'grey.200',
            borderRadius: 2,
            p: 3
          }}
        >
          <Typography gutterBottom variant="h6" fontWeight="bold">
            Payment Distribution
          </Typography>
          <ResponsiveContainer height={300} width="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'grey.200',
            borderRadius: 2,
            p: 3
          }}
        >
          <Typography gutterBottom variant="h6" fontWeight="bold">
            Payment Method Details
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {data.map((method, index) => (
              <Card
                key={method.paymentMethod}
                sx={{
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: COLORS[index % COLORS.length],
                        borderRadius: 1
                      }}
                    />
                    <Typography variant="h6">{method.paymentMethod}</Typography>
                  </Box>
                  <Typography color="text.secondary" variant="body2">
                    Transactions: {method.totalSales}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Amount: {formatCurrency(method.totalAmount)}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Avg: {formatCurrency(method.avgTransaction)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
