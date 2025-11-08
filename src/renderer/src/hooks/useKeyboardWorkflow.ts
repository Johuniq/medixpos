/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

type KeyboardMode = 'normal' | 'quantity' | 'discount' | 'payment' | 'customer'

interface KeyboardWorkflowHook {
  currentMode: KeyboardMode
  setMode: (mode: KeyboardMode) => void
  activeInput: string
  setActiveInput: (input: string) => void
  quickProductRef: React.RefObject<HTMLInputElement | null>
  quantityRef: React.RefObject<HTMLInputElement | null>
  discountRef: React.RefObject<HTMLInputElement | null>
  paymentRef: React.RefObject<HTMLInputElement | null>
  customerRef: React.RefObject<HTMLInputElement | null>
  showHelpDialog: boolean
  setShowHelpDialog: (show: boolean) => void
  numpadInput: string
  setNumpadInput: (input: string) => void
  focusQuickProduct: () => void
  focusQuantity: () => void
  focusDiscount: () => void
  focusPayment: () => void
  focusCustomer: () => void
}

export interface KeyboardShortcuts {
  // Navigation
  F1?: () => void // Help
  F2?: () => void // Quick Product Search
  F3?: () => void // Customer Search
  F4?: () => void // Payment
  F5?: () => void // Checkout
  F6?: () => void // Discount
  F7?: () => void // Clear Cart
  F8?: () => void // Reset All
  F9?: () => void // Print Last Receipt
  F10?: () => void // Quantity Mode
  F11?: () => void // Hold Transaction
  F12?: () => void // Settings

  // Quick actions
  Enter?: () => void // Confirm/Add to cart
  Escape?: () => void // Cancel/Back
  Delete?: () => void // Remove item
  Plus?: () => void // Increase quantity
  Minus?: () => void // Decrease quantity
  Star?: () => void // Apply discount
  Slash?: () => void // Search products

  // Number pad for quick operations
  Num0?: () => void
  Num1?: () => void
  Num2?: () => void
  Num3?: () => void
  Num4?: () => void
  Num5?: () => void
  Num6?: () => void
  Num7?: () => void
  Num8?: () => void
  Num9?: () => void
  NumDot?: () => void
}

export function useKeyboardWorkflow(): KeyboardWorkflowHook {
  const [currentMode, setCurrentMode] = useState<KeyboardMode>('normal')
  const [activeInput, setActiveInput] = useState('')
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [numpadInput, setNumpadInput] = useState('')

  // Refs for different input fields
  const quickProductRef = useRef<HTMLInputElement>(null)
  const quantityRef = useRef<HTMLInputElement>(null)
  const discountRef = useRef<HTMLInputElement>(null)
  const paymentRef = useRef<HTMLInputElement>(null)
  const customerRef = useRef<HTMLInputElement>(null)

  const setMode = useCallback((mode: KeyboardMode) => {
    setCurrentMode(mode)
    setNumpadInput('')
  }, [])

  const focusQuickProduct = useCallback(() => {
    setMode('normal')
    setActiveInput('product')
    setTimeout(() => quickProductRef.current?.focus(), 100)
  }, [setMode])

  const focusQuantity = useCallback(() => {
    setMode('quantity')
    setActiveInput('quantity')
    setTimeout(() => quantityRef.current?.focus(), 100)
  }, [setMode])

  const focusDiscount = useCallback(() => {
    setMode('normal')
    setActiveInput('discount')
    setTimeout(() => discountRef.current?.focus(), 100)
  }, [setMode])

  const focusPayment = useCallback(() => {
    setMode('payment')
    setActiveInput('payment')
    setTimeout(() => paymentRef.current?.focus(), 100)
  }, [setMode])

  const focusCustomer = useCallback(() => {
    setMode('customer')
    setActiveInput('customer')
    setTimeout(() => customerRef.current?.focus(), 100)
  }, [setMode])

  return {
    currentMode,
    setMode,
    activeInput,
    setActiveInput,
    quickProductRef,
    quantityRef,
    discountRef,
    paymentRef,
    customerRef,
    showHelpDialog,
    setShowHelpDialog,
    numpadInput,
    setNumpadInput,
    focusQuickProduct,
    focusQuantity,
    focusDiscount,
    focusPayment,
    focusCustomer
  }
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts, enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent): void => {
      // Don't trigger shortcuts when typing in input fields (unless specifically handled)
      const target = event.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      // Function keys work everywhere
      const functionKeyMap: Record<string, keyof KeyboardShortcuts> = {
        F1: 'F1',
        F2: 'F2',
        F3: 'F3',
        F4: 'F4',
        F5: 'F5',
        F6: 'F6',
        F7: 'F7',
        F8: 'F8',
        F9: 'F9',
        F10: 'F10',
        F11: 'F11',
        F12: 'F12'
      }

      if (functionKeyMap[event.key]) {
        event.preventDefault()
        const shortcut = shortcuts[functionKeyMap[event.key]]
        if (shortcut) {
          shortcut()
          toast.success(`${event.key} activated`, { duration: 1000 })
        }
        return
      }

      // Other shortcuts only work when not in input fields
      if (isInputField) return

      const keyMap: Record<string, keyof KeyboardShortcuts> = {
        Enter: 'Enter',
        Escape: 'Escape',
        Delete: 'Delete',
        '+': 'Plus',
        '-': 'Minus',
        '*': 'Star',
        '/': 'Slash',
        '0': 'Num0',
        '1': 'Num1',
        '2': 'Num2',
        '3': 'Num3',
        '4': 'Num4',
        '5': 'Num5',
        '6': 'Num6',
        '7': 'Num7',
        '8': 'Num8',
        '9': 'Num9',
        '.': 'NumDot'
      }

      if (keyMap[event.key]) {
        event.preventDefault()
        const shortcut = shortcuts[keyMap[event.key]]
        if (shortcut) {
          shortcut()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}
