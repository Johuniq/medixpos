/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import {
  AccountBalance,
  Assessment,
  AssignmentReturn,
  Business,
  Dashboard,
  Description,
  Inventory,
  Logout,
  People,
  Person,
  Settings,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  ViewInAr
} from '@mui/icons-material'
import {
  Avatar,
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography
} from '@mui/material'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import { Permission } from '../utils/permissions'

const drawerWidth = 260

export default function Layout(): React.JSX.Element {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const storeName = useSettingsStore((state) => state.storeName)
  const { hasPermission } = usePermissions()
  const location = useLocation()

  const isActive = (path: string): boolean => {
    return location.pathname === path
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/',
      permission: 'view_dashboard' as Permission,
      icon: <Dashboard />
    },
    {
      name: 'POS',
      path: '/pos',
      permission: 'create_sale' as Permission,
      icon: <ShoppingCart />
    },
    {
      name: 'Products',
      path: '/products',
      permission: 'view_products' as Permission,
      icon: <ViewInAr />
    },
    {
      name: 'Inventory',
      path: '/inventory',
      permission: 'view_inventory' as Permission,
      icon: <Inventory />
    },
    {
      name: 'Sales',
      path: '/sales',
      permission: 'view_sales' as Permission,
      icon: <TrendingUp />
    },
    {
      name: 'Purchases',
      path: '/purchases',
      permission: 'view_purchases' as Permission,
      icon: <ShoppingBag />
    },
    {
      name: 'Returns',
      path: '/returns',
      permission: 'view_purchases' as Permission,
      icon: <AssignmentReturn />
    },
    {
      name: 'Suppliers',
      path: '/suppliers',
      permission: 'view_products' as Permission,
      icon: <Business />
    },
    {
      name: 'Customers',
      path: '/customers',
      permission: 'view_customers' as Permission,
      icon: <People />
    },
    {
      name: 'Accounts',
      path: '/bank-accounts',
      permission: 'view_reports' as Permission,
      icon: <AccountBalance />
    },
    {
      name: 'Reports',
      path: '/reports',
      permission: 'view_reports' as Permission,
      icon: <Assessment />
    },
    {
      name: 'Users',
      path: '/users',
      permission: 'view_users' as Permission,
      icon: <Person />
    },
    {
      name: 'Audit Logs',
      path: '/audit-logs',
      permission: 'view_users' as Permission,
      icon: <Description />
    },
    {
      name: 'Settings',
      path: '/settings',
      permission: 'view_settings' as Permission,
      icon: <Settings />
    }
  ]

  // Filter navigation based on permissions
  const navigation = navigationItems.filter((item) => hasPermission(item.permission))

  return (
    <Box sx={{ display: 'flex', height: '100vh', background: '#f3f4f6' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)',
            color: 'white',
            borderRight: 'none'
          }
        }}
      >
        {/* Logo Section */}
        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 0.5 }}>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: 'white',
                color: 'primary.main',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              {(storeName || 'POS').substring(0, 2).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                {storeName || 'MedixPOS'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Pharmacy Management
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Navigation */}
        <List
          sx={{
            flex: 1,
            px: 1.5,
            py: 2,
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {navigation.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isActive(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: 'white',
                    color: 'primary.main',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    '&:hover': {
                      bgcolor: 'white'
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main'
                    }
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive(item.path) ? 'primary.main' : 'rgba(255,255,255,0.8)'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{
                    fontWeight: isActive(item.path) ? 600 : 500,
                    fontSize: '0.875rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* User Section */}
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              mb: 1.5,
              bgcolor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.light',
                fontWeight: 'bold'
              }}
            >
              {user?.fullName?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ ml: 1.5, flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: 'white',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {user?.fullName}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}
              >
                {user?.role?.replace('_', ' ')}
              </Typography>
            </Box>
          </Paper>
          <Button
            fullWidth
            variant="contained"
            color="error"
            startIcon={<Logout />}
            onClick={logout}
            sx={{
              py: 1.25,
              fontWeight: 600,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          bgcolor: 'background.default'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
