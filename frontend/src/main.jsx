import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Inter empaquetada con el proyecto (Fontsource), sin depender de un
// CDN: el sistema se entrega en entorno local (RNF-07). Solo los pesos
// que usa la interfaz: 400 (normal), 500, 600 y 700.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
