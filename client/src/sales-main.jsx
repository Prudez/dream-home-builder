import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SalesPage from './SalesPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SalesPage />
  </StrictMode>,
)
