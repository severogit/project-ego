import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MainHeader from '../components/MainHeader'
import CollectionPage from '../pages/CollectionPage'
import DraftPage from '../pages/DraftPage'
import GameModesPage from '../pages/GameModesPage'
import HomePage from '../pages/HomePage'

function AppRoutes() {
  return (
    <BrowserRouter>
      <MainHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game-modes" element={<GameModesPage />} />
        <Route path="/campaign" element={<DraftPage />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/draft" element={<DraftPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
