/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { SerialPort } from 'serialport'

/**
 * Cash Drawer Service
 * Manages serial port communication with cash drawer
 */
export class CashDrawerService {
  private static instance: CashDrawerService
  private port: SerialPort | null = null
  private isConnected = false
  private portPath: string | null = null
  private baudRate = 9600

  // ESC/POS kick drawer commands
  private readonly KICK_COMMANDS = {
    // Standard ESC/POS command: ESC p m t1 t2
    // ESC (27) + p (112) + pin (0 or 1) + on time + off time
    STANDARD: Buffer.from([0x1b, 0x70, 0x00, 0x19, 0x19]), // ESC p 0 25 25 (pin 2)
    ALTERNATIVE: Buffer.from([0x1b, 0x70, 0x01, 0x19, 0x19]), // ESC p 1 25 25 (pin 5)
    EPSON: Buffer.from([0x1b, 0x70, 0x00, 0x32, 0xfa]), // Epson specific
    STAR: Buffer.from([0x1b, 0x07]) // Star Micronics
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static getInstance(): CashDrawerService {
    if (!CashDrawerService.instance) {
      CashDrawerService.instance = new CashDrawerService()
    }
    return CashDrawerService.instance
  }

  /**
   * List available serial ports
   */
  public async listPorts(): Promise<Array<{ path: string; manufacturer?: string }>> {
    try {
      const ports = await SerialPort.list()
      return ports.map((port) => ({
        path: port.path,
        manufacturer: port.manufacturer
      }))
    } catch (error) {
      console.error('[CashDrawer] Error listing ports:', error)
      return []
    }
  }

  /**
   * Connect to cash drawer via serial port
   */
  public async connect(portPath: string, baudRate = 9600): Promise<boolean> {
    try {
      // Close existing connection if any
      if (this.port && this.isConnected) {
        await this.disconnect()
      }

      console.log(`[CashDrawer] Connecting to ${portPath} at ${baudRate} baud`)

      this.port = new SerialPort({
        path: portPath,
        baudRate: baudRate,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        autoOpen: false
      })

      // Setup error handling
      this.port.on('error', (err) => {
        console.error('[CashDrawer] Serial port error:', err.message)
        this.isConnected = false
      })

      this.port.on('close', () => {
        console.log('[CashDrawer] Serial port closed')
        this.isConnected = false
      })

      // Open the port
      return new Promise((resolve, reject) => {
        this.port!.open((err) => {
          if (err) {
            console.error('[CashDrawer] Failed to open port:', err.message)
            reject(err)
            return
          }

          this.isConnected = true
          this.portPath = portPath
          this.baudRate = baudRate
          console.log('[CashDrawer] Connected successfully')
          resolve(true)
        })
      })
    } catch (error) {
      console.error('[CashDrawer] Connection error:', error)
      return false
    }
  }

  /**
   * Disconnect from cash drawer
   */
  public async disconnect(): Promise<void> {
    if (this.port && this.port.isOpen) {
      return new Promise((resolve) => {
        this.port!.close(() => {
          this.isConnected = false
          this.port = null
          console.log('[CashDrawer] Disconnected')
          resolve()
        })
      })
    }
  }

  /**
   * Open cash drawer with specified command
   */
  public async openDrawer(
    commandType: 'STANDARD' | 'ALTERNATIVE' | 'EPSON' | 'STAR' = 'STANDARD'
  ): Promise<boolean> {
    if (!this.isConnected || !this.port) {
      console.warn('[CashDrawer] Not connected. Cannot open drawer.')
      return false
    }

    try {
      const command = this.KICK_COMMANDS[commandType]
      console.log(`[CashDrawer] Sending ${commandType} kick command:`, Array.from(command))

      return new Promise((resolve, reject) => {
        this.port!.write(command, (err) => {
          if (err) {
            console.error('[CashDrawer] Error sending kick command:', err.message)
            reject(err)
            return
          }

          // Wait for the command to be transmitted
          this.port!.drain((drainErr) => {
            if (drainErr) {
              console.error('[CashDrawer] Error draining buffer:', drainErr.message)
              reject(drainErr)
              return
            }

            console.log('[CashDrawer] Drawer opened successfully')
            resolve(true)
          })
        })
      })
    } catch (error) {
      console.error('[CashDrawer] Failed to open drawer:', error)
      return false
    }
  }

  /**
   * Test cash drawer connection by opening it
   */
  public async testDrawer(): Promise<boolean> {
    if (!this.isConnected) {
      console.warn('[CashDrawer] Not connected. Cannot test drawer.')
      return false
    }

    console.log('[CashDrawer] Testing drawer...')
    return this.openDrawer('STANDARD')
  }

  /**
   * Get connection status
   */
  public getStatus(): {
    isConnected: boolean
    portPath: string | null
    baudRate: number
  } {
    return {
      isConnected: this.isConnected,
      portPath: this.portPath,
      baudRate: this.baudRate
    }
  }

  /**
   * Check if drawer is connected
   */
  public isDrawerConnected(): boolean {
    return this.isConnected
  }

  /**
   * Reconnect to last used port
   */
  public async reconnect(): Promise<boolean> {
    if (!this.portPath) {
      console.warn('[CashDrawer] No previous port to reconnect to')
      return false
    }

    return this.connect(this.portPath, this.baudRate)
  }

  /**
   * Auto-detect and connect to first available serial port
   */
  public async autoConnect(): Promise<boolean> {
    const ports = await this.listPorts()

    if (ports.length === 0) {
      console.warn('[CashDrawer] No serial ports found')
      return false
    }

    // Try to connect to first port
    console.log(`[CashDrawer] Auto-connecting to ${ports[0].path}`)
    return this.connect(ports[0].path)
  }
}
