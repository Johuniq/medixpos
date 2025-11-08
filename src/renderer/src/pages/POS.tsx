/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Box, Button, Chip, Typography } from '@mui/material'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import CartList from '../components/pos/CartList'
import CustomerSearch from '../components/pos/CustomerSearch'
import KeyboardHelpDialog from '../components/pos/KeyboardHelpDialog'
import PaymentPanel from '../components/pos/PaymentPanel'
import ProductGrid from '../components/pos/ProductGrid'
import QuickProductSearch from '../components/pos/QuickProductSearch'
import SaleCompleteDialog from '../components/pos/SaleCompleteDialog'
import { useKeyboardShortcuts, useKeyboardWorkflow } from '../hooks/useKeyboardWorkflow'
import { usePOS } from '../hooks/usePOS'
import { useSettingsStore } from '../store/settingsStore'
import { printPDFReceipt } from '../utils/pdfPrint'
import { printThermalReceipt } from '../utils/thermalPrint'

export default function POS(): React.JSX.Element {
  const receiptAutoPrint = useSettingsStore((state) => state.receiptAutoPrint)
  const {
    // State
    searchTerm,
    products,
    inventory,
    accounts,
    customerSearch,
    customers,
    selectedCustomer,
    showCustomerDropdown,
    loading,
    cashReceived,
    selectedAccount,
    discountPercent,
    pointsToRedeem,
    searchInputRef,
    cart,
    taxRate,
    showSaleCompleteDialog,
    completedSaleDetails,
    storeName,
    storeAddress,
    storePhone,

    // Computed values
    currencySymbol,
    total,
    change,
    maxRedeemablePoints,
    pointValue,

    // Handlers
    setSearchTerm,
    setCustomerSearch,
    setCashReceived,
    setDiscountPercent,
    setPointsToRedeem,
    setShowCustomerDropdown,
    setShowSaleCompleteDialog,
    addToCart,
    selectCustomer,
    clearCustomer,
    handleCheckout,
    handleReset,
    handleAccountSelect
  } = usePOS()

  // Keyboard workflow hooks
  const keyboard = useKeyboardWorkflow()

  // Define keyboard shortcuts
  const shortcuts = {
    F1: () => keyboard.setShowHelpDialog(true),
    F2: () => keyboard.focusQuickProduct(),
    F3: () => keyboard.focusCustomer(),
    F4: () => keyboard.focusPayment(),
    F5: () => {
      if (cart.items.length > 0 && parseFloat(cashReceived) >= total) {
        handleCheckout()
      } else {
        toast.error('Cannot checkout: Cart empty or insufficient payment')
      }
    },
    F6: () => keyboard.focusDiscount(),
    F7: () => {
      cart.clearCart()
      toast.success('Cart cleared')
    },
    F8: () => {
      handleReset()
      toast.success('All fields reset')
    },
    F9: () => {
      if (completedSaleDetails) {
        handleThermalPrint()
      } else {
        toast.error('No receipt to print')
      }
    },
    F10: () => keyboard.focusQuantity(),
    F11: () => toast('Hold transaction feature coming soon', { icon: '⏸️' }),
    F12: () => toast('Settings shortcut - Feature coming soon', { icon: '⚙️' }),
    Enter: () => {
      if (keyboard.currentMode === 'normal' && products.length > 0) {
        addToCart(products[0])
      }
    },
    Escape: () => {
      if (keyboard.currentMode !== 'normal') {
        keyboard.setMode('normal')
        keyboard.setActiveInput('')
      }
    },
    Plus: () => {
      if (cart.items.length > 0) {
        const lastItem = cart.items[cart.items.length - 1]
        cart.updateQuantity(lastItem.productId, lastItem.quantity + 1)
      }
    },
    Minus: () => {
      if (cart.items.length > 0) {
        const lastItem = cart.items[cart.items.length - 1]
        if (lastItem.quantity > 1) {
          cart.updateQuantity(lastItem.productId, lastItem.quantity - 1)
        }
      }
    },
    Star: () => keyboard.focusDiscount(),
    Slash: () => keyboard.focusQuickProduct()
  }

  // Enable keyboard shortcuts
  useKeyboardShortcuts(shortcuts, true)

  const handlePdfPrint = (): void => {
    if (!completedSaleDetails) {
      toast.error('No sale details available')
      return
    }

    try {
      const receiptData = {
        ...completedSaleDetails,
        storeName,
        storeAddress,
        storePhone
      }
      printPDFReceipt(receiptData, currencySymbol)
      toast.success('PDF receipt opened in new window')
    } catch {
      toast.error('Failed to generate PDF receipt')
    }
  }

  const handleThermalPrint = (): void => {
    if (!completedSaleDetails) {
      toast.error('No sale details available')
      return
    }

    try {
      const receiptData = {
        ...completedSaleDetails,
        storeName,
        storeAddress,
        storePhone
      }
      printThermalReceipt(receiptData, currencySymbol)
      toast.success('Thermal receipt sent to printer')
    } catch {
      toast.error('Failed to print thermal receipt')
    }
  }

  // Auto-print receipt when sale is completed (if enabled in settings)
  useEffect(() => {
    if (receiptAutoPrint && showSaleCompleteDialog && completedSaleDetails) {
      // Automatically trigger thermal print when dialog opens
      try {
        const receiptData = {
          ...completedSaleDetails,
          storeName,
          storeAddress,
          storePhone
        }
        printThermalReceipt(receiptData, currencySymbol)
      } catch {
        toast.error('Auto-print error')
      }
    }
  }, [
    receiptAutoPrint,
    showSaleCompleteDialog,
    completedSaleDetails,
    storeName,
    storeAddress,
    storePhone,
    currencySymbol
  ])

  return (
    <Box
      sx={{ p: 3, height: '100vh', bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}
    >
      {/* Page Header */}
      <Box
        sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Point of Sale
            </Typography>
            <Chip
              label="Press F1 for shortcuts"
              size="small"
              sx={{
                bgcolor: 'primary.100',
                color: 'primary.dark',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'primary.200' }
              }}
              onClick={() => keyboard.setShowHelpDialog(true)}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Process sales transactions and manage customer purchases
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          onClick={handleReset}
          sx={{ textTransform: 'none', mt: 0.5 }}
        >
          Reset All
        </Button>
      </Box>

      {/* Customer Search Field */}
      <div data-tour="customer-select">
        <CustomerSearch
          customerSearch={customerSearch}
          selectedCustomer={selectedCustomer}
          customers={customers}
          showDropdown={showCustomerDropdown}
          onSearchChange={setCustomerSearch}
          onCustomerSelect={selectCustomer}
          onCustomerClear={clearCustomer}
          onDropdownClose={() => setShowCustomerDropdown(false)}
          onFocus={() => {
            if (customers.length > 0) {
              setShowCustomerDropdown(true)
            }
          }}
        />
      </div>

      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0 }}>
        {/* Left Side - Products */}
        <div data-tour="product-search">
          <ProductGrid
            products={products}
            inventory={inventory}
            loading={loading}
            searchTerm={searchTerm}
            currencySymbol={currencySymbol}
            onSearchChange={setSearchTerm}
            onProductClick={addToCart}
            searchInputRef={searchInputRef}
          />
        </div>

        {/* Middle - Cart Items */}
        <div data-tour="cart-items">
          <CartList
            items={cart.items}
            currencySymbol={currencySymbol}
            onQuantityUpdate={cart.updateQuantity}
            onItemRemove={cart.removeItem}
            onClearCart={cart.clearCart}
          />
        </div>

        {/* Right Side - Payment & Summary */}
        <div data-tour="payment-section">
          <PaymentPanel
            accounts={accounts}
            selectedAccount={selectedAccount}
            cashReceived={cashReceived}
            discountPercent={discountPercent}
            pointsToRedeem={pointsToRedeem}
            selectedCustomer={selectedCustomer}
            subtotal={cart.getSubtotal()}
            taxRate={taxRate}
            total={total}
            change={change}
            maxRedeemablePoints={maxRedeemablePoints}
            pointValue={pointValue}
            currencySymbol={currencySymbol}
            cartItemsCount={cart.items.length}
            onAccountSelect={handleAccountSelect}
            onCashChange={setCashReceived}
            onDiscountChange={setDiscountPercent}
            onPointsChange={setPointsToRedeem}
            onCheckout={handleCheckout}
          />
        </div>
      </Box>

      {/* Sale Complete Dialog */}
      <SaleCompleteDialog
        open={showSaleCompleteDialog}
        saleDetails={completedSaleDetails}
        currencySymbol={currencySymbol}
        onClose={() => setShowSaleCompleteDialog(false)}
        onPdfPrint={handlePdfPrint}
        onThermalPrint={handleThermalPrint}
      />

      {/* Keyboard Help Dialog */}
      <KeyboardHelpDialog
        open={keyboard.showHelpDialog}
        onClose={() => keyboard.setShowHelpDialog(false)}
      />

      {/* Quick Product Search */}
      <QuickProductSearch
        open={keyboard.activeInput === 'product'}
        onClose={() => {
          keyboard.setActiveInput('')
          keyboard.setMode('normal')
        }}
        products={products}
        onProductSelect={addToCart}
        currencySymbol={currencySymbol}
      />

      {/* Keyboard Mode Status Bar */}
      {keyboard.currentMode !== 'normal' && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            right: 16,
            p: 1,
            bgcolor: 'warning.100',
            border: 1,
            borderColor: 'warning.300',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300
          }}
        >
          <Typography variant="body2" sx={{ color: 'warning.dark', fontWeight: 600 }}>
            ⌨️ Keyboard Mode: {keyboard.currentMode.toUpperCase()} | Press Escape to cancel
          </Typography>
        </Box>
      )}
    </Box>
  )
}
