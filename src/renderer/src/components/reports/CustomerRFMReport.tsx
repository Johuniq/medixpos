import { AccessTime, MonetizationOn, TrendingUp } from '@mui/icons-material'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

interface CustomerRFMData {
  customerId: number
  customerName: string
  recency: number
  frequency: number
  monetary: number
  lastPurchaseDate: string
  avgPurchaseValue: number
}

interface CustomerRFMReportProps {
  data: CustomerRFMData[]
}

export default function CustomerRFMReport({ data }: CustomerRFMReportProps): React.ReactElement {
  // Add safety checks
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No customer RFM data available</Typography>
      </Paper>
    )
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT'
    }).format(value)
  }

  const getRFMSegment = (recency: number, frequency: number, monetary: number): string => {
    if (recency <= 30 && frequency >= 10 && monetary >= 50000) return 'Champions'
    if (recency <= 30 && frequency >= 5) return 'Loyal Customers'
    if (recency <= 60 && monetary >= 30000) return 'Potential Loyalists'
    if (recency <= 90) return 'Recent Customers'
    if (frequency >= 5) return 'At Risk'
    if (recency > 180) return 'Lost'
    return 'Regular'
  }

  const getSegmentColor = (
    segment: string
  ): 'success' | 'primary' | 'warning' | 'error' | 'default' | 'info' | 'secondary' => {
    if (segment === 'Champions') return 'success'
    if (segment === 'Loyal Customers') return 'primary'
    if (segment === 'Potential Loyalists') return 'info'
    if (segment === 'At Risk') return 'warning'
    if (segment === 'Lost') return 'error'
    return 'default'
  }

  const totalMonetary = data.reduce((sum, item) => sum + (item?.monetary || 0), 0)
  const avgFrequency =
    data.reduce((sum, item) => sum + (item?.frequency || 0), 0) / (data.length || 1)

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
                Total Customer Value
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(totalMonetary)}
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
                Active Customers
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {data.length}
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
                Avg Purchase Frequency
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {avgFrequency.toFixed(1)}
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
            Customer RFM Analysis
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Customer Name
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Recency (days)
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Frequency
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Monetary Value
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Avg Purchase
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Segment
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => {
                const segment = getRFMSegment(row.recency, row.frequency, row.monetary)
                return (
                  <TableRow key={row.customerId} hover>
                    <TableCell component="th" scope="row">
                      {row.customerName}
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 0.5
                        }}
                      >
                        <AccessTime fontSize="small" />
                        {row.recency}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 0.5
                        }}
                      >
                        <TrendingUp fontSize="small" />
                        {row.frequency}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 0.5
                        }}
                      >
                        <MonetizationOn fontSize="small" />
                        {formatCurrency(row.monetary)}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(row.avgPurchaseValue)}</TableCell>
                    <TableCell align="right">
                      <Chip label={segment} size="small" color={getSegmentColor(segment)} />
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
