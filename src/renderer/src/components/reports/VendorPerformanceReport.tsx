import { TrendingUp } from '@mui/icons-material'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

interface VendorPerformanceData {
  supplierId: number
  supplierName: string
  totalPurchases: number
  totalAmount: number
  totalPaid: number
  totalDue: number
  avgDeliveryTime: number
}

interface VendorPerformanceReportProps {
  data: VendorPerformanceData[]
}

export default function VendorPerformanceReport({
  data
}: VendorPerformanceReportProps): React.ReactElement {
  // Add safety checks
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No vendor performance data available</Typography>
      </Paper>
    )
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT'
    }).format(value)
  }

  const totalPurchaseAmount = data.reduce((sum, item) => sum + (item?.totalAmount || 0), 0)
  const totalVendors = data.length

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
                Total Vendors
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totalVendors}
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
                Total Purchase Amount
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(totalPurchaseAmount)}
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
                Avg Purchase Value
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(totalPurchaseAmount / (totalVendors || 1))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'grey.200',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'grey.200' }}>
          <Typography variant="h6" fontWeight="bold">
            Vendor Performance
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Vendor Name
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Total Purchases
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Total Amount
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Paid Amount
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Due Amount
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Payment Status
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => {
                const paymentPercentage = (row.totalPaid / row.totalAmount) * 100
                return (
                  <TableRow key={row.supplierId} hover>
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {row.supplierName}
                        {row.totalAmount > totalPurchaseAmount / totalVendors && (
                          <Chip
                            label="Top Vendor"
                            size="small"
                            color="primary"
                            icon={<TrendingUp />}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{row.totalPurchases}</TableCell>
                    <TableCell align="right">{formatCurrency(row.totalAmount)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.totalPaid)}</TableCell>
                    <TableCell align="right">
                      <Typography color={row.totalDue > 0 ? 'error' : 'text.primary'}>
                        {formatCurrency(row.totalDue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: '100px' }}>
                          <LinearProgress
                            variant="determinate"
                            value={paymentPercentage}
                            color={paymentPercentage === 100 ? 'success' : 'warning'}
                          />
                        </Box>
                        <Typography variant="body2">{paymentPercentage.toFixed(0)}%</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}
