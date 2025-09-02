import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MesaService, Mesa } from '../services/api';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  FileText, 
  Edit3, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Users
} from 'lucide-react';

// Interfaces para el tipado
interface Lista {
  id: string;
  nombre: string;
  tipo: 'LOCAL' | 'PROVINCIAL';
}

interface Voto {
  id: string;
  cantidad: number;
  lista: Lista;
}

interface Acta {
  sobresRecibidos: number;
  usuario: {
    nombre: string;
    email: string;
  };
  fechaCarga: string;
  observaciones?: string;
}

interface MesaConVotos extends Mesa {
  votos?: Voto[];
  acta?: Acta;
}

const DetalleMesa: React.FC = () => {
  const { numero } = useParams<{ numero: string }>();
  const navigate = useNavigate();
  const [mesa, setMesa] = useState<MesaConVotos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDetalleMesa = async () => {
    if (!numero) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await MesaService.getMesa(parseInt(numero));
      
      if (response.success && response.data) {
        setMesa(response.data);
      } else {
        setError('Mesa no encontrada');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los datos de la mesa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDetalleMesa();
  }, [numero]);

  const handleEditar = () => {
    navigate(`/cargar-acta?mesa=${numero}`);
  };

  const calcularTotales = () => {
    if (!mesa?.votos) return { locales: 0, provinciales: 0, total: 0 };

    const votosLocales = mesa.votos.filter((v: Voto) => v.lista.tipo === 'LOCAL');
    const votosProvinciales = mesa.votos.filter((v: Voto) => v.lista.tipo === 'PROVINCIAL');
    
    const totalLocales = votosLocales.reduce((sum: number, v: Voto) => sum + v.cantidad, 0);
    const totalProvinciales = votosProvinciales.reduce((sum: number, v: Voto) => sum + v.cantidad, 0);
    
    return {
      locales: totalLocales,
      provinciales: totalProvinciales,
      total: totalLocales + totalProvinciales
    };
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'CARGADA':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'VALIDADA':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'CARGADA':
        return <CheckCircle className="h-5 w-5" />;
      case 'PENDIENTE':
        return <AlertTriangle className="h-5 w-5" />;
      case 'VALIDADA':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles de la mesa...</p>
        </div>
      </div>
    );
  }

  if (error || !mesa) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Mesa no encontrada'}</p>
          <button
            onClick={() => navigate('/estado-mesas')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Estado de Mesas
          </button>
        </div>
      </div>
    );
  }

  const totales = calcularTotales();
  const esExtranjeros = mesa.numero > 277;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/estado-mesas')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Mesa {mesa.numero}
                {esExtranjeros && (
                  <span className="ml-2 text-lg text-purple-600 font-medium">
                    (Extranjeros)
                  </span>
                )}
              </h1>
              <p className="text-gray-600">{mesa.ubicacion}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`inline-flex items-center px-3 py-2 rounded-full border ${getEstadoColor(mesa.estado)}`}>
              {getEstadoIcon(mesa.estado)}
              <span className="ml-2 font-medium">{mesa.estado}</span>
            </div>
            
            <button
              onClick={handleEditar}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span>Editar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información general */}
        <div className="lg:col-span-1 space-y-6">
          {/* Estado de la mesa */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información General</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Número de Mesa</label>
                <p className="text-lg font-bold text-gray-900">{mesa.numero}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Ubicación</label>
                <p className="text-gray-900">{mesa.ubicacion}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Estado</label>
                <div className={`inline-flex items-center px-2 py-1 rounded-full ${getEstadoColor(mesa.estado)}`}>
                  {getEstadoIcon(mesa.estado)}
                  <span className="ml-2 text-sm font-medium">{mesa.estado}</span>
                </div>
              </div>

              {mesa.fechaCarga && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Carga</label>
                  <div className="flex items-center text-gray-900">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(mesa.fechaCarga).toLocaleString('es-AR')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Datos del acta */}
          {mesa.acta && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos del Acta</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Sobres Recibidos</label>
                  <p className="text-xl font-bold text-blue-600">{mesa.acta.sobresRecibidos}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Cargada por</label>
                  <div className="flex items-center text-gray-900">
                    <User className="h-4 w-4 mr-2" />
                    <span>{mesa.acta.usuario.nombre}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Carga</label>
                  <div className="flex items-center text-gray-900">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(mesa.acta.fechaCarga).toLocaleString('es-AR')}</span>
                  </div>
                </div>

                {mesa.acta.observaciones && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Observaciones</label>
                    <div className="flex items-start text-gray-900">
                      <FileText className="h-4 w-4 mr-2 mt-0.5" />
                      <span className="text-sm">{mesa.acta.observaciones}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resumen de votos */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Votos</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-800">Provinciales</span>
                </div>
                <span className="text-xl font-bold text-blue-600">{totales.provinciales}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">Locales</span>
                </div>
                <span className="text-xl font-bold text-green-600">{totales.locales}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-t border-gray-200">
                <span className="font-semibold text-gray-800">Total General</span>
                <span className="text-2xl font-bold text-gray-900">{totales.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detalle de votos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Detalle de Votos por Lista</h3>
            
            {mesa.votos && mesa.votos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Votos Provinciales */}
                <div>
                  <h4 className="font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">
                    Diputados Provinciales
                  </h4>
                  <div className="space-y-2">
                    {mesa.votos
                      .filter((v: Voto) => v.lista.tipo === 'PROVINCIAL')
                      .sort((a: Voto, b: Voto) => b.cantidad - a.cantidad)
                      .map((voto: Voto) => (
                        <div key={voto.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm font-medium text-blue-800">
                            {voto.lista.nombre}
                          </span>
                          <span className="font-bold text-blue-600">
                            {voto.cantidad.toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Votos Locales */}
                <div>
                  <h4 className="font-semibold text-green-800 mb-3 pb-2 border-b border-green-200">
                    Concejales y Consejeros
                  </h4>
                  <div className="space-y-2">
                    {mesa.votos
                      .filter((v: Voto) => v.lista.tipo === 'LOCAL')
                      .sort((a: Voto, b: Voto) => b.cantidad - a.cantidad)
                      .map((voto: Voto) => (
                        <div key={voto.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <span className="text-sm font-medium text-green-800">
                            {voto.lista.nombre}
                          </span>
                          <span className="font-bold text-green-600">
                            {voto.cantidad.toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-600">No hay votos registrados para esta mesa</p>
                <button
                  onClick={handleEditar}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Cargar Acta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleMesa;