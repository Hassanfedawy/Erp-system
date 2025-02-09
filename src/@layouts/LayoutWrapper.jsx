'use client'

// Hook Imports
import { SettingsProvider } from '@core/contexts/settingsContext'
import useLayoutInit from '@core/hooks/useLayoutInit'

const LayoutWrapper = props => {
  // Props
  const { systemMode, verticalLayout, horizontalLayout, settings } = props

  // Hooks
  useLayoutInit(systemMode)

  return (
    <SettingsProvider settings={settings}>
      <div className='flex flex-col flex-auto' data-skin={settings.skin}>
        {settings.layout === 'horizontal' ? horizontalLayout : verticalLayout}
      </div>
    </SettingsProvider>
  )
}

export default LayoutWrapper
