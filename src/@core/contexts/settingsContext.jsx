'use client'

import { createContext, useState, useCallback } from 'react'
import themeConfig from '@configs/themeConfig'

export const defaultSettings = {
  mode: 'light',
  skin: 'default',
  semiDark: false,
  layout: 'vertical',
  navbarContentWidth: 'compact',
  contentWidth: 'wide',
  footerContentWidth: 'compact',
  primaryColor: '#7367F0'
}

export const SettingsContext = createContext({
  settings: defaultSettings,
  updateSettings: () => null,
  resetSettings: () => null
})

export const SettingsProvider = ({ children }) => {
  // State
  const [settings, setSettings] = useState(() => {
    try {
      const storedSettings = typeof window !== 'undefined' ? localStorage.getItem('settings') : null
      return storedSettings ? JSON.parse(storedSettings) : defaultSettings
    } catch (error) {
      console.error('Error loading settings:', error)
      return defaultSettings
    }
  })

  const updateSettings = useCallback((updatedSettings) => {
    setSettings(prevSettings => {
      const newSettings = { ...prevSettings, ...updatedSettings }
      if (typeof window !== 'undefined') {
        localStorage.setItem('settings', JSON.stringify(newSettings))
      }
      return newSettings
    })
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings)
    if (typeof window !== 'undefined') {
      localStorage.setItem('settings', JSON.stringify(defaultSettings))
    }
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}
