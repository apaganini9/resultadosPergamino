import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MesaService, Mesa } from '../services/api';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Users, 
  Eye,
  Edit3,
  MapPin,
  Calendar,
  TrendingUp,
  AlertCircle,
  Activity
} from 'lucide-react';

interface MesaExtendida extends Mesa {
  totalVotos?: number;
}

const EstadoMesas: React.FC = () => {
  const navigate = useNavigate();
  const [mesas, setMesas] = useState<MesaExtendida[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTE' | 'CARGADA'>('TODOS');
  const [error, setError] = useState<string | null>(null);
  const [animateCards, setAnimateCards] = useState(false);

  const cargarMesas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await MesaService.getAllMesas();
      
      if (response.success && response.data) {
        const mesasData = response.data;
        setMesas(mesasData);
        setAnimateCards(true);
        setTimeout(() => setAnimateCards(false), 600);
      } else {
        setError('Error al cargar las mesas');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión con el servidor');
      
      // Generar datos de ejemplo para desarrollo
      const mesasEjemplo: MesaExtendida[] = Array.from({ length: 280 }, (_, i) => ({
        id: i + 1,
        numero: i + 1,
        ubicacion: `Escuela ${Math.floor(i / 10) + 1} - Pergamino`,
        estado: Math.random() > 0.7 ? 'CARGADA' : 'PENDIENTE',
        fechaCarga: Math.random() > 0.5 ? new Date().toISOString() : undefined,
        totalVotos: Math.random() > 0.5 ? Math.floor(Math.random() * 300) + 100 : undefined
      }));
      
      setMesas(mesasEjemplo);
      setAnimateCards(true);
      setTimeout(() => setAnimateCards(false), 600);
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarMesas();
  }, [cargarMesas]);

  const mesasFiltradas = mesas.filter(mesa => {
    const matchSearch = searchTerm === '' || 
                       mesa.numero.toString().includes(searchTerm) ||
                       mesa.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchEstado = filtroEstado === 'TODOS' || mesa.estado === filtroEstado;
    
    return matchSearch && matchEstado;
  });

  const handleVerMesa = (mesa: MesaExtendida) => {
    navigate(`/mesa/${mesa.numero}`);
  };

  const handleCargarActa = (mesa: MesaExtendida) => {
    navigate(`/cargar-acta?mesa=${mesa.numero}`);
  };

  const estadisticasRapidas = {
    total: mesas.length,
    cargadas: mesas.filter(m => m.estado === 'CARGADA').length,
    pendientes: mesas.filter(m => m.estado === 'PENDIENTE').length,
    extranjeros: mesas.filter(m => m.numero > 277).length
  };

  const progresoPorcentaje = estadisticasRapidas.total > 0 
    ? (estadisticasRapidas.cargadas / estadisticasRapidas.total) * 100 
    : 0;

  const getEstadoColors = (estado: string) => {
    switch (estado) {
      case 'CARGADA':
        return {
          bg: 'from-emerald-500/30 to-green-600/30',
          border: 'border-emerald-400/30',
          text: 'text-emerald-100',
          icon: 'text-emerald-300'
        };
      case 'PENDIENTE':
        return {
          bg: 'from-amber-500/30 to-orange-600/30',
          border: 'border-amber-400/30',
          text: 'text-amber-100',
          icon: 'text-amber-300'
        };
      case 'VALIDADA':
        return {
          bg: 'from-blue-500/30 to-blue-600/30',
          border: 'border-blue-400/30',
          text: 'text-blue-100',
          icon: 'text-blue-300'
        };
      default:
        return {
          bg: 'from-slate-500/30 to-gray-600/30',
          border: 'border-gray-400/30',
          text: 'text-gray-100',
          icon: 'text-gray-300'
        };
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'CARGADA':
        return <CheckCircle className="h-5 w-5" />;
      case 'PENDIENTE':
        return <Clock className="h-5 w-5" />;
      case 'VALIDADA':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  if (loading && mesas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-500/30 border-t-purple-400 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-blue-500/20 border-r-blue-400 animate-pulse mx-auto"></div>
          </div>
          <p className="text-purple-200 text-lg font-medium">Cargando Estado de Mesas...</p>
          <p className="text-purple-400 text-sm mt-2">Sincronizando datos electorales</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Header con glassmorphism */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-3 rounded-2xl">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                  Estado de Mesas Electorales
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-blue-300" />
                    <span className="text-blue-200 font-medium">Pergamino, Buenos Aires</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-300" />
                    <span className="text-purple-200">Monitoreo en Tiempo Real</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={cargarMesas}
              disabled={loading}
              className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 disabled:opacity-50 border border-white/20 group"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-300`} />
              <span className="font-medium">Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Estadísticas rápidas con animaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`group bg-gradient-to-br from-blue-500/30 to-blue-600/30 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-500 ${animateCards ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-2">Total de Mesas</p>
                <p className="text-3xl font-bold text-white mb-1">{estadisticasRapidas.total}</p>
                <p className="text-blue-200 text-xs">mesas habilitadas</p>
              </div>
              <div className="bg-blue-500/40 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </div>
          </div>

          <div className={`group bg-gradient-to-br from-emerald-500/30 to-green-600/30 backdrop-blur-xl rounded-2xl p-6 border border-emerald-400/30 hover:border-emerald-400/50 transition-all duration-500 ${animateCards ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-2">Mesas Cargadas</p>
                <p className="text-3xl font-bold text-white mb-1">{estadisticasRapidas.cargadas}</p>
                <p className="text-emerald-200 text-xs">datos procesados</p>
              </div>
              <div className="bg-emerald-500/40 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-8 w-8 text-emerald-200" />
              </div>
            </div>
          </div>

          <div className={`group bg-gradient-to-br from-amber-500/30 to-orange-600/30 backdrop-blur-xl rounded-2xl p-6 border border-amber-400/30 hover:border-amber-400/50 transition-all duration-500 ${animateCards ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium mb-2">Pendientes</p>
                <p className="text-3xl font-bold text-white mb-1">{estadisticasRapidas.pendientes}</p>
                <p className="text-amber-200 text-xs">esperando carga</p>
              </div>
              <div className="bg-amber-500/40 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-8 w-8 text-amber-200" />
              </div>
            </div>
          </div>

          <div className={`group bg-gradient-to-br from-purple-500/30 to-pink-600/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30 hover:border-purple-400/50 transition-all duration-500 ${animateCards ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-2">Progreso</p>
                <p className="text-3xl font-bold text-white mb-1">{progresoPorcentaje.toFixed(1)}%</p>
                <p className="text-purple-200 text-xs">completado</p>
              </div>
              <div className="bg-purple-500/40 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/30 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <TrendingUp className="h-6 w-6 mr-3 text-blue-300" />
              Progreso General de Carga
            </h3>
            <div className="bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-400/30">
              <span className="text-blue-100 font-bold text-lg">{progresoPorcentaje.toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-white/80 text-sm">
              <span>Mesas procesadas</span>
              <span className="font-medium">{estadisticasRapidas.cargadas} de {estadisticasRapidas.total}</span>
            </div>
            
            <div className="relative">
              <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
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
          </div>
        </div>

        {/* Controles de búsqueda y filtros */}
        <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/30 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar mesa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 w-full sm:w-64 text-white placeholder-white/60"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value as any)}
                  className="pl-10 pr-8 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white appearance-none cursor-pointer"
                >
                  <option value="TODOS" className="bg-slate-800 text-white">Todas las mesas</option>
                  <option value="PENDIENTE" className="bg-slate-800 text-white">Pendientes</option>
                  <option value="CARGADA" className="bg-slate-800 text-white">Cargadas</option>
                </select>
              </div>
            </div>

            <div className="text-white/80 text-sm">
              Mostrando <span className="font-bold text-white">{mesasFiltradas.length}</span> de <span className="font-bold text-white">{mesas.length}</span> mesas
            </div>
          </div>
        </div>

        {/* Grid de mesas */}
        {error && mesas.length === 0 ? (
          <div className="bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-2xl p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <p className="text-red-100 text-xl font-semibold mb-4">{error}</p>
            <button
              onClick={cargarMesas}
              className="bg-red-500/30 text-red-100 px-6 py-3 rounded-xl hover:bg-red-500/40 transition-all duration-300 font-medium"
            >
              Reintentar Carga
            </button>
          </div>
        ) : (
          <div className="bg-white/15 backdrop-blur-xl rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                {mesasFiltradas.map((mesa) => {
                  const colors = getEstadoColors(mesa.estado);
                  return (
                    <div
                      key={mesa.id}
                      className={`
                        group relative bg-gradient-to-br ${colors.bg} backdrop-blur-sm rounded-xl p-4 border ${colors.border} 
                        transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20
                        ${mesa.numero > 277 ? 'ring-2 ring-purple-400/50' : ''}
                      `}
                    >
                      <div className="text-center relative z-10">
                        <div className={`flex items-center justify-center mb-3 ${colors.icon}`}>
                          {getEstadoIcon(mesa.estado)}
                        </div>
                        
                        <h3 className="font-bold text-lg mb-1 text-white">
                          Mesa {mesa.numero}
                        </h3>
                        
                        {mesa.numero > 277 && (
                          <div className="bg-purple-500/30 px-2 py-1 rounded-full mb-2">
                            <p className="text-xs font-bold text-purple-200">
                              EXTRANJEROS
                            </p>
                          </div>
                        )}
                        
                        <p className="text-xs text-white/70 mb-3 line-clamp-2">
                          {mesa.ubicacion}
                        </p>
                        
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm ${colors.text}`}>
                          {mesa.estado}
                        </div>
                        
                        {mesa.fechaCarga && (
                          <p className="text-xs text-white/60 mt-2">
                            {new Date(mesa.fechaCarga).toLocaleDateString()}
                          </p>
                        )}

                        {mesa.totalVotos && (
                          <p className="text-xs text-white/80 font-medium mt-1">
                            {mesa.totalVotos} votos
                          </p>
                        )}
                      </div>

                      {/* Overlay de acciones */}
                      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-xl flex items-center justify-center space-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerMesa(mesa);
                          }}
                          className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-blue-500/30 hover:text-blue-200 transition-all duration-200 border border-white/30"
                          title="Ver detalles"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCargarActa(mesa);
                          }}
                          className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-emerald-500/30 hover:text-emerald-200 transition-all duration-200 border border-white/30"
                          title="Cargar acta"
                        >
                          <Edit3 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {mesasFiltradas.length === 0 && (
                <div className="text-center py-16">
                  <Search className="h-16 w-16 text-white/40 mx-auto mb-4" />
                  <p className="text-white/70 text-lg">No se encontraron mesas con los filtros aplicados</p>
                  <p className="text-white/50 text-sm mt-2">Prueba modificando los términos de búsqueda</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-8 bg-blue-500/20 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">i</span>
              </div>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-blue-100 mb-3">Guía de Estados y Acciones</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-200">
                <div className="space-y-2">
                  <p className="flex items-center"><span className="w-3 h-3 bg-emerald-400 rounded-full mr-2"></span><strong>Verde:</strong> Mesa con acta cargada y datos guardados</p>
                  <p className="flex items-center"><span className="w-3 h-3 bg-amber-400 rounded-full mr-2"></span><strong>Amarillo:</strong> Mesa pendiente de carga</p>
                </div>
                <div className="space-y-2">
                  <p className="flex items-center"><span className="w-3 h-3 bg-purple-400 rounded-full mr-2"></span><strong>Borde Morado:</strong> Mesas de extranjeros (278-280)</p>
                  <p><strong>Hover:</strong> Pasa el mouse sobre una mesa para ver las acciones disponibles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadoMesas;