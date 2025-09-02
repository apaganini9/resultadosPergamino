import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import CargarActa from './pages/CargarActa';
import EstadoMesas from './pages/EstadoMesas';
import Resultados from './pages/Resultados';
import GestionUsuarios from './pages/GestionUsuarios';
import DetalleMesa from './pages/DetalleMesa';

import './index.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/" 
        element={<Navigate to="/dashboard" replace />} 
      />
      <Route
        path="/cargar-acta"
        element={
      <PrivateRoute>
        <Layout>
          <CargarActa />
        </Layout>
      </PrivateRoute>
}
/>
<Route
  path="/resultados"
  element={
    <PrivateRoute>
      <Layout>
        <Resultados />
      </Layout>
    </PrivateRoute>
  }
/>
      <Route
  path="/estado-mesas"
  element={
    <PrivateRoute>
      <Layout>
        <EstadoMesas />
      </Layout>
    </PrivateRoute>
  }
  
  
/>

<Route
  path="/mesa/:numero"
  element={
    <PrivateRoute>
      <Layout>
        <DetalleMesa />
      </Layout>
    </PrivateRoute>
  }
/>

<Route
  path="/usuarios"
  element={
    <PrivateRoute>
      <Layout>
        <GestionUsuarios />
      </Layout>
    </PrivateRoute>
  }
/>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;