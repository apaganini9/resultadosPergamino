import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MesaService, Estadisticas } from '../services/api';
import { RefreshCw as Refresh,} from 'lucide-react';
import { 
  Vote, 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  BarChart3
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);

  const cargarEstadisticas = async () => {
    try {
      setError(null);
      const response = await MesaService.getEstadisticas();
      
      if (response.success && response.data) {
        setEstadisticas(response.data);
        setUltimaActualizacion(new Date());
      } else {
        setError('Error al cargar estadísticas');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
    
    const intervalo = setInterval(cargarEstadisticas, 30000);
    return () => clearInterval(intervalo);
  }, []);

  const formatearHora = (fecha: Date) => {
    return fecha.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading && !estadisticas) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error && !estadisticas) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error de Conexión</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={cargarEstadisticas}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const progresoPorcentaje = estadisticas?.progreso || 0;
  const participacionEstimada = estadisticas ? 
    ((estadisticas.votosTotales / 2) / 93000) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Electoral</h1>
          <p className="text-gray-600">Elecciones Provinciales 2025 - Pergamino</p>
        </div>
        <button
          onClick={cargarEstadisticas}
          disabled={loading}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Refresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Vote className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Mesas</p>
              <p className="text-2xl font-bold text-gray-900">
                {estadisticas?.totalMesas || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Mesas Cargadas</p>
              <p className="text-2xl font-bold text-green-600">
                {estadisticas?.mesasCargadas || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Mesas Pendientes</p>
              <p className="text-2xl font-bold text-amber-600">
                {estadisticas?.mesasPendientes || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Votos Computados</p>
              <p className="text-2xl font-bold text-purple-600">
                {(estadisticas?.votosTotales || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progreso y Participación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Progreso de Carga
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <TrendingUp className="h-4 w-4 mr-1" />
              {progresoPorcentaje.toFixed(2)}%
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Mesas procesadas</span>
              <span>{estadisticas?.mesasCargadas || 0} de {estadisticas?.totalMesas || 0}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progresoPorcentaje}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            {estadisticas?.mesasCargadas || 0} mesas procesadas
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Participación Estimada
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <BarChart3 className="h-4 w-4 mr-1" />
              {participacionEstimada.toFixed(2)}%
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Votantes estimados</span>
              <span>{Math.floor((estadisticas?.votosTotales || 0) / 2).toLocaleString()} de 93,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${Math.min(participacionEstimada, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Basado en mesas procesadas
          </div>
        </div>
      </div>

      {/* Información del Sistema */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Información del Sistema
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Última Actualización</p>
            <p className="text-lg text-gray-900">
              {ultimaActualizacion ? formatearHora(ultimaActualizacion) : 'No disponible'}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Estado del Sistema</p>
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              <p className="text-lg text-green-600 font-medium">Operativo</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Usuario Actual</p>
            <p className="text-lg text-gray-900">{user?.nombre}</p>
            <p className="text-sm text-gray-500">{user?.rol}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;