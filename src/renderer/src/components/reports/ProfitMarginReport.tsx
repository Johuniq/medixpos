import { TrendingDown, TrendingUp } from '@mui/icons-material'
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

interface ProfitMarginData {
  productId: number
  productName: string
  totalRevenue: number
  totalQuantity: number
  avgSellingPrice: number
  avgCostPrice: number
  profitMargin: number
}

interface ProfitMarginReportProps {
  data: ProfitMarginData[]
}

export default function ProfitMarginReport({ data }: ProfitMarginReportProps): React.ReactElement {
  // Add safety checks
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No profit margin data available</Typography>
      </Paper>
    )
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT'
    }).format(value)
  }

  const getMarginColor = (
    margin: number
  ): 'success' | 'warning' | 'error' | 'default' | 'primary' | 'secondary' | 'info' => {
    if (margin >= 30) return 'success'
    if (margin >= 15) return 'warning'
    return 'error'
  }

  const totalRevenue = data.reduce((sum, item) => sum + (item?.totalRevenue || 0), 0)
  const avgMargin =
    data.reduce((sum, item) => sum + (item?.profitMargin || 0), 0) / (data.length || 1)

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
                Total Revenue
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(totalRevenue)}
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
                Average Profit Margin
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {avgMargin.toFixed(2)}%
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
                Products Analyzed
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {data.length}
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
            Product Profit Margins
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Product Name
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Quantity Sold
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Avg Cost Price
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Avg Selling Price
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Total Revenue
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Profit Margin
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.productId} hover>
                  <TableCell component="th" scope="row">
                    {row.productName}
                  </TableCell>
                  <TableCell align="right">{row.totalQuantity}</TableCell>
                  <TableCell align="right">{formatCurrency(row.avgCostPrice)}</TableCell>
                  <TableCell align="right">{formatCurrency(row.avgSellingPrice)}</TableCell>
                  <TableCell align="right">{formatCurrency(row.totalRevenue)}</TableCell>
                  <TableCell align="right">
                    <Chip
                      icon={row.profitMargin >= 0 ? <TrendingUp /> : <TrendingDown />}
                      label={`${row.profitMargin.toFixed(2)}%`}
                      color={getMarginColor(row.profitMargin)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}
