import React, { useState, useEffect, useCallback } from 'react';
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
  // Comentar temporalmente estos iconos no utilizados
  // BarChart3,
  // Users
} from 'lucide-react';

// Interfaces para el tipado
interface Lista {
  id: string;
  numero: string;
  nombre: string;
  tipo: 'LOCAL' | 'PROVINCIAL';
}

interface Voto {
  id: string;
  cantidad: number;
  lista: Lista;
}

interface Acta {
  electoresVotaron: number;
  sobresRecibidos: number;
  diferencia: number;
  votosEnBlanco: number;
  votosImpugnados: number;
  votosSobreNro3: number;
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

// Listas oficiales según el acta real (igual que en CargarActa)
const LISTAS_OFICIALES = [
  { numero: '2200', nombre: 'FUERZA PATRIA', habilitadaLocal: true, habilitadaProvincial: true },
  { numero: '2201', nombre: 'POTENCIA', habilitadaLocal: true, habilitadaProvincial: true },
  { numero: '2202', nombre: 'ES CON VOS ES CON NOSOTROS', habilitadaLocal: false, habilitadaProvincial: true },
  { numero: '2203', nombre: 'FTE DE IZQ. Y DE TRABAJADORES - UNIDAD', habilitadaLocal: true, habilitadaProvincial: true },
  { numero: '2206', nombre: 'LA LIBERTAD AVANZA', habilitadaLocal: true, habilitadaProvincial: true },
  { numero: '2207', nombre: 'UNION Y LIBERTAD', habilitadaLocal: false, habilitadaProvincial: true },
  { numero: '2208', nombre: 'UNION LIBERAL', habilitadaLocal: true, habilitadaProvincial: true },
  { numero: '91', nombre: 'ESP. ABIERTO PARA EL DES. Y LA INT. SOCIAL', habilitadaLocal: true, habilitadaProvincial: true },
  { numero: '959', nombre: 'MOVIMIENTO AVANZADA SOCIALISTA', habilitadaLocal: false, habilitadaProvincial: true },
  { numero: '963', nombre: 'FRENTE PATRIOTA FEDERAL', habilitadaLocal: false, habilitadaProvincial: true },
  { numero: '974', nombre: 'POLITICA OBRERA', habilitadaLocal: true, habilitadaProvincial: true },
  { numero: '980', nombre: 'PARTIDO TIEMPO DE TODOS', habilitadaLocal: false, habilitadaProvincial: true },
  { numero: '1003', nombre: 'CONSTRUYENDO PORVENIR', habilitadaLocal: false, habilitadaProvincial: true },
  { numero: '1006', nombre: 'PARTIDO LIBERTARIO', habilitadaLocal: true, habilitadaProvincial: true },
  { numero: '1008', nombre: 'VALORES REPUBLICANOS', habilitadaLocal: false, habilitadaProvincial: true },
  { numero: '615', nombre: 'IDEAR PERGAMINO', habilitadaLocal: true, habilitadaProvincial: false }
];

const DetalleMesa: React.FC = () => {
  const { numero } = useParams<{ numero: string }>();
  const navigate = useNavigate();
  const [mesa, setMesa] = useState<MesaConVotos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDetalleMesa = useCallback(async () => {
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
  }, [numero]);

  useEffect(() => {
    cargarDetalleMesa();
  }, [cargarDetalleMesa]);

  const handleEditar = () => {
    navigate(`/cargar-acta?mesa=${numero}`);
  };

  // Obtener listas según habilitación
  const listasProvinciales = LISTAS_OFICIALES.filter(l => l.habilitadaProvincial);
  const listasLocales = LISTAS_OFICIALES.filter(l => l.habilitadaLocal);

  // Organizar votos por lista
  const obtenerVotos = () => {
    if (!mesa?.votos) return { provinciales: {}, locales: {} };

    const votosProvinciales: { [key: string]: number } = {};
    const votosLocales: { [key: string]: number } = {};

    // Inicializar todas las listas con 0
    listasProvinciales.forEach(lista => {
      votosProvinciales[lista.nombre] = 0;
    });
    listasLocales.forEach(lista => {
      votosLocales[lista.nombre] = 0;
    });

    // Asignar votos reales
    mesa.votos.forEach(voto => {
      if (voto.lista.tipo === 'PROVINCIAL') {
        votosProvinciales[voto.lista.nombre] = voto.cantidad;
      } else if (voto.lista.tipo === 'LOCAL') {
        votosLocales[voto.lista.nombre] = voto.cantidad;
      }
    });

    return { provinciales: votosProvinciales, locales: votosLocales };
  };

  const calcularTotales = () => {
    const votos = obtenerVotos();
    const totalProvinciales = Object.values(votos.provinciales).reduce((sum, val) => sum + val, 0);
    const totalLocales = Object.values(votos.locales).reduce((sum, val) => sum + val, 0);
    const totalOtrosVotos = (mesa?.acta?.votosEnBlanco || 0) + (mesa?.acta?.votosImpugnados || 0) + (mesa?.acta?.votosSobreNro3 || 0);
    
    return {
      totalProvinciales,
      totalLocales,
      totalOtrosVotos,
      diferencia: mesa?.acta?.diferencia || 0
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles de la mesa...</p>
        </div>
      </div>
    );
  }

  if (error || !mesa) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
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
  const votos = obtenerVotos();
  const esExtranjeros = mesa.numero > 277;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
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
                Detalle Mesa {mesa.numero}
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

      <div className="bg-white rounded-lg shadow border">
        {/* Header del acta - IGUAL A CARGAR ACTA */}
        <div className="bg-gray-50 px-6 py-4 border-b text-center">
          <h2 className="text-xl font-bold">CERTIFICADO DE ESCRUTINIO</h2>
          <p className="text-sm">ELECCIONES PROVINCIALES - PERGAMINO</p>
          <p className="text-lg font-bold mt-2">087 - PERGAMINO</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Datos básicos - MODO LECTURA */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mesa
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-medium">
                Mesa {mesa.numero} {esExtranjeros ? '(Extranjeros)' : ''}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                A) Electores que votaron
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-medium">
                {mesa.acta?.electoresVotaron || 0}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                B) Sobres en la urna
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-medium">
                {mesa.acta?.sobresRecibidos || 0}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                C) Diferencia (A - B)
              </label>
              <div className={`w-full px-3 py-2 border rounded-md bg-gray-50 font-medium ${
                totales.diferencia === 0 ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'
              }`}>
                {totales.diferencia}
              </div>
            </div>
          </div>

          {/* Sección de votos provinciales - MODO LECTURA */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-center mb-4 text-blue-800">
              DIPUTADOS PROVINCIALES
            </h3>
            <div className="space-y-3">
              {listasProvinciales.map((lista) => (
                <div key={lista.numero} className="flex items-center space-x-3">
                  <div className="w-12 h-8 bg-white rounded flex items-center justify-center text-sm font-medium border">
                    {lista.numero}
                  </div>
                  <div className="flex-1 text-sm font-medium">
                    {lista.nombre}
                  </div>
                  <div className="w-20 px-2 py-1 border border-gray-300 rounded text-center bg-white font-semibold">
                    {votos.provinciales[lista.nombre] || 0}
                  </div>
                </div>
              ))}
              
              {/* NO USAR para provinciales */}
              <div className="mt-4 pt-3 border-t border-blue-200">
                <div className="text-sm text-gray-500 mb-2">
                  <span className="font-medium">615</span> - IDEAR PERGAMINO 
                  <span className="ml-2 bg-red-100 px-2 py-1 rounded text-red-600 font-bold text-xs">NO USAR</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-blue-200">
                <div className="flex justify-between font-semibold text-blue-800">
                  <span>TOTAL VOTOS PROVINCIALES:</span>
                  <span>{totales.totalProvinciales}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de votos locales - MODO LECTURA */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-center mb-4 text-green-800">
              CONCEJALES Y CONSEJEROS ESCOLARES
            </h3>
            <div className="space-y-3">
              {listasLocales.map((lista) => (
                <div key={lista.numero} className="flex items-center space-x-3">
                  <div className="w-12 h-8 bg-white rounded flex items-center justify-center text-sm font-medium border">
                    {lista.numero}
                  </div>
                  <div className="flex-1 text-sm font-medium">
                    {lista.nombre}
                  </div>
                  <div className="w-20 px-2 py-1 border border-gray-300 rounded text-center bg-white font-semibold">
                    {votos.locales[lista.nombre] || 0}
                  </div>
                </div>
              ))}
              
              {/* NO USAR para locales */}
              <div className="mt-4 pt-3 border-t border-green-200">
                <div className="text-sm text-gray-500 space-y-1">
                  {LISTAS_OFICIALES.filter(l => !l.habilitadaLocal && l.habilitadaProvincial).map((lista) => (
                    <div key={lista.numero}>
                      <span className="font-medium">{lista.numero}</span> - {lista.nombre}
                      <span className="ml-2 bg-red-100 px-2 py-1 rounded text-red-600 font-bold text-xs">NO USAR</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-green-200">
                <div className="flex justify-between font-semibold text-green-800">
                  <span>TOTAL VOTOS LOCALES:</span>
                  <span>{totales.totalLocales}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Otros votos - MODO LECTURA */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-center mb-4">OTROS VOTOS</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  D) Votos en blanco
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white font-semibold text-center">
                  {mesa.acta?.votosEnBlanco || 0}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votos identidad impugnada
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white font-semibold text-center">
                  {mesa.acta?.votosImpugnados || 0}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E) Se remiten en sobre Nro 3
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white font-semibold text-center">
                  {mesa.acta?.votosSobreNro3 || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Información del acta */}
          {mesa.acta && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Información del Acta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center text-gray-700 mb-2">
                    <User className="h-4 w-4 mr-2" />
                    <span className="font-medium">Cargada por:</span>
                  </div>
                  <p className="text-gray-900 ml-6">{mesa.acta.usuario.nombre}</p>
                </div>
                
                <div>
                  <div className="flex items-center text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium">Fecha de carga:</span>
                  </div>
                  <p className="text-gray-900 ml-6">{new Date(mesa.acta.fechaCarga).toLocaleString('es-AR')}</p>
                </div>
              </div>
              
              {mesa.acta.observaciones && (
                <div className="mt-4">
                  <div className="flex items-start text-gray-700 mb-2">
                    <FileText className="h-4 w-4 mr-2 mt-0.5" />
                    <span className="font-medium">Observaciones:</span>
                  </div>
                  <p className="text-gray-900 ml-6 text-sm">{mesa.acta.observaciones}</p>
                </div>
              )}
            </div>
          )}

          {/* Resumen final - IGUAL A CARGAR ACTA */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-3">SUMA TOTAL DE VOTOS</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Votos Provinciales:</span>
                <div className="font-semibold">{totales.totalProvinciales}</div>
              </div>
              <div>
                <span className="text-gray-600">Votos Locales:</span>
                <div className="font-semibold">{totales.totalLocales}</div>
              </div>
              <div>
                <span className="text-gray-600">Otros Votos:</span>
                <div className="font-semibold">{totales.totalOtrosVotos}</div>
              </div>
              <div>
                <span className="text-gray-600">Total General:</span>
                <div className="font-bold text-lg">{totales.totalProvinciales + totales.totalLocales + totales.totalOtrosVotos}</div>
              </div>
            </div>
          </div>

          {/* Solo mostrar mensaje si no hay acta cargada */}
          {!mesa.acta && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No hay acta registrada para esta mesa</p>
              <button
                onClick={handleEditar}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Cargar Acta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleMesa;