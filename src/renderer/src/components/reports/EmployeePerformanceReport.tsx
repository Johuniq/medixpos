import { Star } from '@mui/icons-material'
import {
  Avatar,
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

interface EmployeePerformanceData {
  userId: number
  userName: string
  totalSales: number
  totalRevenue: number
  avgSaleValue: number
  totalDiscounts: number
}

interface EmployeePerformanceReportProps {
  data: EmployeePerformanceData[]
}

export default function EmployeePerformanceReport({
  data
}: EmployeePerformanceReportProps): React.ReactElement {
  // Add safety checks
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No employee performance data available</Typography>
      </Paper>
    )
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT'
    }).format(value)
  }

  const totalRevenue = data.reduce((sum, item) => sum + (item?.totalRevenue || 0), 0)
  const totalSales = data.reduce((sum, item) => sum + (item?.totalSales || 0), 0)

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
                Total Employees
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
                Total Sales
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totalSales}
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
                Total Revenue
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(totalRevenue)}
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
            Employee Performance
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Employee Name
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Total Sales
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Total Revenue
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Avg Sale Value
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Total Discounts
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Performance
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => {
                const contributionPercentage = ((row.totalRevenue / totalRevenue) * 100).toFixed(1)
                const isTopPerformer = index === 0
                return (
                  <TableRow key={row.userId} hover>
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {row.userName.charAt(0).toUpperCase()}
                        </Avatar>
                        {row.userName}
                        {isTopPerformer && (
                          <Chip
                            label="Top Performer"
                            size="small"
                            color="success"
                            icon={<Star />}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{row.totalSales}</TableCell>
                    <TableCell align="right">{formatCurrency(row.totalRevenue)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.avgSaleValue)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.totalDiscounts)}</TableCell>
                    <TableCell align="right">
                      <Chip label={`${contributionPercentage}%`} size="small" color="primary" />
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
