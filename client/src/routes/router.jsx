import { createBrowserRouter } from 'react-router-dom'
import { AccountPage } from '@/pages/AccountPage'
import { AdminPage } from '@/pages/AdminPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFound } from '@/pages/NotFound'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/admin', element: <AdminPage /> },
  { path: '/account', element: <AccountPage /> },
  { path: '/profile', element: <AccountPage /> },
  { path: '*', element: <NotFound /> },
])
