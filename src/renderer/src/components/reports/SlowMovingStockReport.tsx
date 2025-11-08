import { TrendingDown, Warning } from '@mui/icons-material'
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

interface SlowMovingStockData {
  productId: number
  productName: string
  currentStock: number
  quantitySold: number
  costPrice: number
  sellingPrice: number
  stockValue: number
  turnoverRatio: string
}

interface SlowMovingStockReportProps {
  data: SlowMovingStockData[]
}

export default function SlowMovingStockReport({
  data
}: SlowMovingStockReportProps): React.ReactElement {
  // Add safety checks
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No slow moving stock data available</Typography>
      </Paper>
    )
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT'
    }).format(value)
  }

  const totalStockValue = data.reduce((sum, item) => sum + (item?.stockValue || 0), 0)
  const slowMovingCount = data.filter((item) => Number(item?.turnoverRatio || 0) < 0.5).length

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
                Total Stock Value
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(totalStockValue)}
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
                Slow Moving Items
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error">
                {slowMovingCount}
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
            Slow Moving Stock Analysis
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
                    Current Stock
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Quantity Sold
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Stock Value
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Turnover Ratio
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Status
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => {
                const turnoverValue = Number(row.turnoverRatio)
                const isSlowMoving = turnoverValue < 0.5
                const isCritical = turnoverValue < 0.2
                return (
                  <TableRow key={row.productId} hover>
                    <TableCell component="th" scope="row">
                      {row.productName}
                    </TableCell>
                    <TableCell align="right">{row.currentStock}</TableCell>
                    <TableCell align="right">{row.quantitySold}</TableCell>
                    <TableCell align="right">{formatCurrency(row.stockValue)}</TableCell>
                    <TableCell align="right">{row.turnoverRatio}</TableCell>
                    <TableCell align="right">
                      {isCritical ? (
                        <Chip label="Critical" size="small" color="error" icon={<Warning />} />
                      ) : isSlowMoving ? (
                        <Chip
                          label="Slow Moving"
                          size="small"
                          color="warning"
                          icon={<TrendingDown />}
                        />
                      ) : (
                        <Chip label="Normal" size="small" color="success" />
                      )}
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
