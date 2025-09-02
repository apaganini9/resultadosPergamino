import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MesaService, Estadisticas } from '../services/api';
import { 
  RefreshCw as Refresh, 
  Vote, 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  BarChart3,
  Activity,
  Eye,
  Timer,
  Award,
  MapPin,
  Calendar
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const [animateCards, setAnimateCards] = useState(false);

  const cargarEstadisticas = async () => {
    try {
      setError(null);
      const response = await MesaService.getEstadisticas();
      
      if (response.success && response.data) {
        setEstadisticas(response.data);
        setUltimaActualizacion(new Date());
        setAnimateCards(true);
        setTimeout(() => setAnimateCards(false), 600);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-500/30 border-t-purple-400 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-blue-500/20 border-r-blue-400 animate-pulse mx-auto"></div>
          </div>
          <p className="text-purple-200 text-lg font-medium">Cargando datos electorales...</p>
          <p className="text-purple-400 text-sm mt-2">Conectando con el sistema</p>
        </div>
      </div>
    );
  }

  if (error && !estadisticas) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-red-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-red-900/20 backdrop-blur-xl rounded-2xl border border-red-500/20">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6 animate-pulse" />
          <h2 className="text-2xl font-bold text-red-100 mb-3">Sistema No Disponible</h2>
          <p className="text-red-200 mb-6">{error}</p>
          <button
            onClick={cargarEstadisticas}
            className="bg-red-600/80 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-red-500 transition-all duration-300 font-medium shadow-lg hover:shadow-red-500/25"
          >
            Reconectar Sistema
          </button>
        </div>
      </div>
    );
  }

  const progresoPorcentaje = estadisticas?.progreso || 0;
  const participacionEstimada = estadisticas ? 
    ((estadisticas.votosTotales / 2) / 93000) * 100 : 0;

  const velocidadCarga = estadisticas?.mesasCargadas ? 
    (estadisticas.mesasCargadas / ((Date.now() - (ultimaActualizacion?.getTime() || Date.now())) / 60000)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Header con glassmorphism */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-3 rounded-2xl">
                <Vote className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                  Centro de Control Electoral
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-blue-300" />
                    <span className="text-blue-200 font-medium">Pergamino, Buenos Aires</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-300" />
                    <span className="text-purple-200">Elecciones 2025</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-white/90 font-medium">{user?.nombre}</div>
                <div className="text-white/70 text-sm">{user?.rol}</div>
              </div>
              <button
                onClick={cargarEstadisticas}
                disabled={loading}
                className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 disabled:opacity-50 border border-white/20 group"
              >
                <Refresh className={`h-5 w-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-300`} />
                <span className="font-medium">Actualizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Métricas Principales con animaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Mesas */}
          <div className={`group bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 ${animateCards ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium mb-2">Total de Mesas</p>
                <p className="text-3xl font-bold text-white mb-1">
                  {estadisticas?.totalMesas || 0}
                </p>
                <p className="text-blue-300 text-xs">Mesas habilitadas</p>
              </div>
              <div className="bg-blue-500/30 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Vote className="h-8 w-8 text-blue-300" />
              </div>
            </div>
            <div className="mt-4 h-1 bg-blue-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Mesas Cargadas */}
          <div className={`group bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-400/20 hover:border-emerald-400/40 transition-all duration-500 ${animateCards ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-sm font-medium mb-2">Mesas Procesadas</p>
                <p className="text-3xl font-bold text-white mb-1">
                  {estadisticas?.mesasCargadas || 0}
                </p>
                <p className="text-emerald-300 text-xs">Completadas exitosamente</p>
              </div>
              <div className="bg-emerald-500/30 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-8 w-8 text-emerald-300" />
              </div>
            </div>
            <div className="mt-4 h-1 bg-emerald-900/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${progresoPorcentaje}%` }}
              ></div>
            </div>
          </div>

          {/* Mesas Pendientes */}
          <div className={`group bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-400/20 hover:border-amber-400/40 transition-all duration-500 ${animateCards ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-200 text-sm font-medium mb-2">Pendientes de Carga</p>
                <p className="text-3xl font-bold text-white mb-1">
                  {estadisticas?.mesasPendientes || 0}
                </p>
                <p className="text-amber-300 text-xs">Esperando procesamiento</p>
              </div>
              <div className="bg-amber-500/30 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-8 w-8 text-amber-300" />
              </div>
            </div>
            <div className="mt-4 h-1 bg-amber-900/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000"
                style={{ width: `${100 - progresoPorcentaje}%` }}
              ></div>
            </div>
          </div>

          {/* Votos Computados */}
          <div className={`group bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/20 hover:border-purple-400/40 transition-all duration-500 ${animateCards ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium mb-2">Votos Computados</p>
                <p className="text-3xl font-bold text-white mb-1">
                  {(estadisticas?.votosTotales || 0).toLocaleString()}
                </p>
                <p className="text-purple-300 text-xs">Total registrados</p>
              </div>
              <div className="bg-purple-500/30 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-purple-300" />
              </div>
            </div>
            <div className="mt-4 h-1 bg-purple-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Panel de Progreso Avanzado */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Progreso Principal */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center">
                <TrendingUp className="h-6 w-6 mr-3 text-blue-400" />
                Progreso de Carga en Tiempo Real
              </h3>
              <div className="bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-400/30">
                <span className="text-blue-200 font-bold text-lg">{progresoPorcentaje.toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-white/80 text-sm">
                <span>Mesas procesadas</span>
                <span className="font-medium">{estadisticas?.mesasCargadas || 0} de {estadisticas?.totalMesas || 0}</span>
              </div>
              
              {/* Barra de progreso mejorada */}
              <div className="relative">
                <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${progresoPorcentaje}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-3 h-6 bg-white rounded-sm shadow-lg transition-all duration-1000"
                  style={{ left: `calc(${progresoPorcentaje}% - 6px)` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">{estadisticas?.mesasCargadas || 0}</div>
                  <div className="text-emerald-200 text-xs">Completadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{estadisticas?.mesasPendientes || 0}</div>
                  <div className="text-amber-200 text-xs">Pendientes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{velocidadCarga.toFixed(1)}</div>
                  <div className="text-blue-200 text-xs">Mesas/min</div>
                </div>
              </div>
            </div>
          </div>

          {/* Participación Ciudadana */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-400" />
                Participación
              </h3>
              <div className="bg-purple-500/20 px-3 py-1 rounded-lg border border-purple-400/30">
                <span className="text-purple-200 font-bold">{participacionEstimada.toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <svg className="w-32 h-32 mx-auto transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="rgb(71, 85, 105, 0.3)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - participacionEstimada / 100)}`}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{participacionEstimada.toFixed(0)}%</div>
                    <div className="text-purple-200 text-xs">Participación</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/80">
                  <span>Votantes estimados</span>
                  <span className="font-medium">{Math.floor((estadisticas?.votosTotales || 0) / 2).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Padrón electoral</span>
                  <span>93,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Estado del Sistema */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <Activity className="h-6 w-6 mr-3 text-green-400" />
            Estado del Sistema en Vivo
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse mr-2"></div>
                <Timer className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-green-200 text-sm font-medium">Última Actualización</p>
                <p className="text-white font-bold">
                  {ultimaActualizacion ? formatearHora(ultimaActualizacion) : '--:--:--'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-blue-400 rounded-full animate-pulse mr-2"></div>
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-blue-200 text-sm font-medium">Estado del Sistema</p>
                <p className="text-white font-bold">Operativo</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-purple-400 rounded-full animate-pulse mr-2"></div>
                <Eye className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-purple-200 text-sm font-medium">Monitoreo</p>
                <p className="text-white font-bold">Activo 24/7</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-yellow-400 rounded-full animate-pulse mr-2"></div>
                <Award className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-yellow-200 text-sm font-medium">Confiabilidad</p>
                <p className="text-white font-bold">99.9%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;