import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Students from './pages/Students.jsx'
import StudentDetail from './pages/StudentDetail.jsx'
import Analytics from './pages/Analytics.jsx'
import Interventions from './pages/Interventions.jsx'
import NotFound from './pages/NotFound.jsx'
import { isLoggedIn } from './auth/session.js'

function RequireSession({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/app"
        element={
          <RequireSession>
            <Layout>
              <Dashboard />
            </Layout>
          </RequireSession>
        }
      />

      <Route
        path="/app/students"
        element={
          <RequireSession>
            <Layout>
              <Students />
            </Layout>
          </RequireSession>
        }
      />

      <Route
        path="/app/students/:id"
        element={
          <RequireSession>
            <Layout>
              <StudentDetail />
            </Layout>
          </RequireSession>
        }
      />

      <Route
        path="/app/analytics"
        element={
          <RequireSession>
            <Layout>
              <Analytics />
            </Layout>
          </RequireSession>
        }
      />

      <Route
        path="/app/interventions"
        element={
          <RequireSession>
            <Layout>
              <Interventions />
            </Layout>
          </RequireSession>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
