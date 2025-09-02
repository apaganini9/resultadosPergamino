import React, { useState, useEffect } from 'react';
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
  Edit3
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const cargarMesas = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const filtroAPI = filtroEstado === 'TODOS' ? undefined : filtroEstado;
      const response = await MesaService.getAllMesas();
      
      if (response.success && response.data) {
        // Simular paginación en el frontend por ahora
        const mesasData = response.data;
        setMesas(mesasData);
        setTotalPages(Math.ceil(mesasData.length / 50));
      } else {
        setError('Error al cargar las mesas');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMesas(currentPage);
  }, [currentPage, filtroEstado]);

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

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'CARGADA':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'VALIDADA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'CARGADA':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDIENTE':
        return <Clock className="h-4 w-4" />;
      case 'VALIDADA':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading && mesas.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estado de mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Estado de Mesas</h1>
        <p className="text-gray-600">Monitoreo del progreso de carga de las 280 mesas electorales</p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Mesas</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticasRapidas.total}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Cargadas</p>
              <p className="text-2xl font-bold text-green-600">{estadisticasRapidas.cargadas}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{estadisticasRapidas.pendientes}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Extranjeros</p>
              <p className="text-2xl font-bold text-blue-600">{estadisticasRapidas.extranjeros}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar mesa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
            </div>

            {/* Filtro por estado */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as any)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="TODOS">Todas las mesas</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="CARGADA">Cargadas</option>
              </select>
            </div>
          </div>

          {/* Botón actualizar */}
          <button
            onClick={() => cargarMesas(currentPage)}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Grid de mesas */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => cargarMesas(currentPage)}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-6">
            {mesasFiltradas.map((mesa) => (
              <div
                key={mesa.id}
                className={`
                  relative border-2 rounded-lg p-4 transition-all duration-200 cursor-pointer hover:shadow-md transform hover:-translate-y-1
                  ${getEstadoColor(mesa.estado)}
                  ${mesa.numero > 277 ? 'ring-2 ring-purple-300' : ''}
                `}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getEstadoIcon(mesa.estado)}
                  </div>
                  
                  <h3 className="font-bold text-lg mb-1">
                    Mesa {mesa.numero}
                  </h3>
                  
                  {mesa.numero > 277 && (
                    <p className="text-xs font-medium text-purple-600 mb-1">
                      EXTRANJEROS
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-600 mb-2">
                    {mesa.ubicacion}
                  </p>
                  
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(mesa.estado)}`}>
                    {mesa.estado}
                  </div>
                  
                  {mesa.fechaCarga && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(mesa.fechaCarga).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center space-x-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVerMesa(mesa);
                    }}
                    className="p-2 bg-white rounded-full text-gray-600 hover:text-blue-600 transition-colors"
                    title="Ver detalles"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCargarActa(mesa);
                    }}
                    className="p-2 bg-white rounded-full text-gray-600 hover:text-green-600 transition-colors"
                    title="Cargar acta"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {mesasFiltradas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron mesas con los filtros aplicados</p>
            </div>
          )}
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">i</span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Información sobre el estado</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Verde:</strong> Mesa con acta cargada y datos guardados</p>
              <p><strong>Amarillo:</strong> Mesa pendiente de carga</p>
              <p><strong>Borde Morado:</strong> Mesas de extranjeros (278-280)</p>
              <p><strong>Hover:</strong> Pasa el mouse sobre una mesa para ver las acciones disponibles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadoMesas;