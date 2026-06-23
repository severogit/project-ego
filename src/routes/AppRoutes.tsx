import { BrowserRouter, Route, Routes } from 'react-router-dom'
import DraftPage from '../pages/DraftPage'
import HomePage from '../pages/HomePage'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/draft" element={<DraftPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
