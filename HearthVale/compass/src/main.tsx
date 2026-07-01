import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'
import { CompassState } from './components/layout/CompassState'
import { ProjectProvider } from './context/ProjectContext'

const isMacDesktop =
  typeof navigator !== 'undefined' &&
  /Mac/i.test(navigator.platform) &&
  !/iPhone|iPad|iPod/i.test(navigator.userAgent)

if (isMacDesktop) {
  document.documentElement.classList.add('platform-mac')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProjectProvider>
      <CompassState>
        <App />
      </CompassState>
    </ProjectProvider>
  </StrictMode>,
)
