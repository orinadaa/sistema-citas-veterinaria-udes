import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Poppins empaquetada con el proyecto (Fontsource), sin depender de un
// CDN: el sistema se entrega en entorno local (RNF-07). Solo los pesos
// que usa la interfaz: 400 (normal), 500, 600 y 700.
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
