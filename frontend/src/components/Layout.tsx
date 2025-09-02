import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  Menu, 
  X, 
  BarChart3, 
  Vote, 
  FileText, 
  Users, 
  Settings,
  Home
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('¿Está seguro que desea cerrar sesión?')) {
      logout();
    }
  };

  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: false },
    { name: 'Cargar Acta', href: '/cargar-acta', icon: Vote, current: false },
    { name: 'Estado de Mesas', href: '/estado-mesas', icon: BarChart3, current: false },
    { name: 'Resultados', href: '/resultados', icon: FileText, current: false },
  ];

  if (isAdmin) {
    navigation.push(
      { name: 'Usuarios', href: '/usuarios', icon: Users, current: false },
      { name: 'Configuración', href: '#', icon: Settings, current: false }
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sidebar móvil */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Vote className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-800">
                Centro Electoral
              </span>
            </div>
            <nav className="mt-8 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                    location.pathname === item.href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-4 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white shadow-lg">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6">
              <Vote className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-800">
                Centro Electoral
              </span>
            </div>
            <nav className="mt-8 flex-1 px-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                    item.current
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* User section */}
          <div className="flex-shrink-0 border-t border-gray-200">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.nombre?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.nombre}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email}
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    {user?.rol}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-4 w-full flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation móvil */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                Centro de Cómputos
              </h1>
            </div>
            
            <div className="ml-4 flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.nombre?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.nombre}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;