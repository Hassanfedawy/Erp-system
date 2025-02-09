'use client'

import { useContext } from 'react'
import { SettingsContext, defaultSettings } from '@core/contexts/settingsContext'

export const useSettings = () => {
  const context = useContext(SettingsContext)
  
  if (!context) {
    console.warn('useSettings: context not found, using default settings')
    return {
      settings: defaultSettings,
      updateSettings: () => null,
      resetSettings: () => null
    }
  }

  return context
}
