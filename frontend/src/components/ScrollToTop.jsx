import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Resets scroll to the top whenever the route changes, so a new page always
// starts from the top instead of inheriting the previous page's scroll position.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
