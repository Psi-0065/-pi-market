import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentPosition, reverseGeocode } from './geo'

const LocationContext = createContext(null)

const STORAGE_KEY = 'pimarket_location'

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null) // { latitude, longitude, label }
  const [radiusKm, setRadiusKm] = useState(5)
  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const [error, setError] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setLocation(JSON.parse(saved))
        setStatus('ready')
        return
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    refreshLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refreshLocation() {
    setStatus('loading')
    setError(null)
    try {
      const pos = await getCurrentPosition()
      const label = await reverseGeocode(pos.latitude, pos.longitude)
      const loc = { ...pos, label }
      setLocation(loc)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'GPS 위치를 가져올 수 없습니다.')
      setStatus('error')
    }
  }

  return (
    <LocationContext.Provider
      value={{ location, radiusKm, setRadiusKm, status, error, refreshLocation }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  return useContext(LocationContext)
}
