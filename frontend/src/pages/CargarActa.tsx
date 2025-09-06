import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { MesaService } from '../services/api';

interface ActaData {
  mesaNumero: number;
  electoresVotaron: number;
  sobresRecibidos: number;
  votosProvinciales: { [key: string]: number };
  votosLocales: { [key: string]: number };
  votosEnBlanco: number;
  votosImpugnados: number;
  votosSobreNro3: number;
  observaciones: string;
}

interface ListaOficial {
  numero: string;
  nombre: string;
  habilitadaLocal: boolean;
  habilitadaProvincial: boolean;
}

interface MensajeEstado {
  tipo: 'success' | 'error' | 'warning';
  texto: string;
}

// Listas oficiales según el acta real
const LISTAS_OFICIALES: ListaOficial[] = [
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

const CargarActa: React.FC = () => {
  const { user } = useAuth();
  const [mesaSeleccionada, setMesaSeleccionada] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<MensajeEstado | null>(null);
  
  // Obtener listas según habilitación
  const listasProvinciales = LISTAS_OFICIALES.filter(l => l.habilitadaProvincial);
  const listasLocales = LISTAS_OFICIALES.filter(l => l.habilitadaLocal);

  const [acta, setActa] = useState<ActaData>({
    mesaNumero: 1,
    electoresVotaron: 0,
    sobresRecibidos: 0,
    votosProvinciales: {},
    votosLocales: {},
    votosEnBlanco: 0,
    votosImpugnados: 0,
    votosSobreNro3: 0,
    observaciones: ''
  });

  // Inicializar votos cuando cambia la mesa
  useEffect(() => {
    const votosProvincialesInit: { [key: string]: number } = {};
    const votosLocalesInit: { [key: string]: number } = {};
    
    listasProvinciales.forEach(lista => {
      votosProvincialesInit[lista.nombre] = 0;
    });
    
    listasLocales.forEach(lista => {
      votosLocalesInit[lista.nombre] = 0;
    });

    setActa({
      mesaNumero: mesaSeleccionada,
      electoresVotaron: 0,
      sobresRecibidos: 0,
      votosProvinciales: votosProvincialesInit,
      votosLocales: votosLocalesInit,
      votosEnBlanco: 0,
      votosImpugnados: 0,
      votosSobreNro3: 0,
      observaciones: ''
    });
  }, [mesaSeleccionada, listasProvinciales, listasLocales]); // ✅ Dependencias agregadas

  // Limpiar mensaje después de 5 segundos
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => {
        setMensaje(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const handleInputChange = useCallback((campo: keyof ActaData, valor: number) => {
    setActa(prev => ({
      ...prev,
      [campo]: valor
    }));
    setMensaje(null);
  }, []);

  const handleStringInputChange = useCallback((campo: keyof ActaData, valor: string) => {
    setActa(prev => ({
      ...prev,
      [campo]: valor
    }));
    setMensaje(null);
  }, []);

  const handleVotoChange = useCallback((tipo: 'provinciales' | 'locales', lista: string, valor: number) => {
    const campo = tipo === 'provinciales' ? 'votosProvinciales' : 'votosLocales';
    
    setActa(prev => ({
      ...prev,
      [campo]: {
        ...prev[campo],
        [lista]: Math.max(0, valor)
      }
    }));
    setMensaje(null);
  }, []);

  const calcularTotales = useCallback(() => {
    const totalProvinciales = Object.values(acta.votosProvinciales).reduce((sum, val) => sum + (val || 0), 0);
    const totalLocales = Object.values(acta.votosLocales).reduce((sum, val) => sum + (val || 0), 0);
    const totalOtrosVotos = acta.votosEnBlanco + acta.votosImpugnados + acta.votosSobreNro3;
    const diferencia = acta.electoresVotaron - acta.sobresRecibidos;
    
    return {
      totalProvinciales,
      totalLocales,
      totalOtrosVotos,
      diferencia
    };
  }, [acta]);

  const validarActa = useCallback(() => {
    const totales = calcularTotales();
    const errores: string[] = [];
    const warnings: string[] = [];

    if (acta.electoresVotaron < 0) {
      errores.push('El número de electores que votaron debe ser positivo');
    }

    if (acta.sobresRecibidos < 0) {
      errores.push('El número de sobres recibidos debe ser positivo');
    }

    if (acta.sobresRecibidos > acta.electoresVotaron) {
      errores.push('Los sobres no pueden superar a los electores que votaron');
    }

    if (totales.totalProvinciales > acta.sobresRecibidos) {
      errores.push(`Los votos provinciales (${totales.totalProvinciales}) no pueden superar los sobres recibidos (${acta.sobresRecibidos})`);
    }

    if (totales.totalLocales > acta.sobresRecibidos) {
      errores.push(`Los votos locales (${totales.totalLocales}) no pueden superar los sobres recibidos (${acta.sobresRecibidos})`);
    }

    const participacionProvincial = acta.sobresRecibidos > 0 ? 
      (totales.totalProvinciales / acta.sobresRecibidos) * 100 : 0;
    
    const participacionLocal = acta.sobresRecibidos > 0 ? 
      (totales.totalLocales / acta.sobresRecibidos) * 100 : 0;

    if (participacionProvincial < 70) {
      warnings.push(`Participación provincial baja: ${participacionProvincial.toFixed(1)}%`);
    }

    if (participacionLocal < 70) {
      warnings.push(`Participación local baja: ${participacionLocal.toFixed(1)}%`);
    }

    if (Math.abs(participacionProvincial - participacionLocal) > 15) {
      warnings.push('Gran diferencia entre participación local y provincial');
    }

    return { errores, warnings };
  }, [acta, calcularTotales]);

  const handleGuardar = async (): Promise<void> => {
    const resultado = validarActa();
    
    if (resultado.errores.length > 0) {
      setMensaje({
        tipo: 'error',
        texto: resultado.errores.join('. ')
      });
      return;
    }

    if (resultado.warnings.length > 0) {
      setMensaje({
        tipo: 'warning',
        texto: `Advertencias: ${resultado.warnings.join('. ')}`
      });
    }

    setLoading(true);
    try {
      const response = await MesaService.cargarActa(acta);
      
      if (response.success) {
        setMensaje({
          tipo: 'success',
          texto: response.message || `Acta de Mesa ${acta.mesaNumero} guardada exitosamente`
        });
      } else {
        setMensaje({
          tipo: 'error',
          texto: response.error || 'Error al guardar el acta'
        });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Error de conexión con el servidor';
      setMensaje({
        tipo: 'error',
        texto: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const totales = calcularTotales();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              type="button"
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Carga de Acta Electoral</h1>
          </div>
          <div className="text-sm text-gray-500">
            Usuario: {user?.nombre} ({user?.rol})
          </div>
        </div>
      </div>

      {mensaje && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
          mensaje.tipo === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : mensaje.tipo === 'warning'
            ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {mensaje.tipo === 'success' ? 
            <CheckCircle className="h-5 w-5 flex-shrink-0" /> : 
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          }
          <span>{mensaje.texto}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border">
        {/* Header del acta */}
        <div className="bg-gray-50 px-6 py-4 border-b text-center">
          <h2 className="text-xl font-bold">CERTIFICADO DE ESCRUTINIO</h2>
          <p className="text-sm">ELECCIONES PROVINCIALES - PERGAMINO</p>
          <p className="text-lg font-bold mt-2">087 - PERGAMINO</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Selección de mesa y datos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="mesa-select" className="block text-sm font-medium text-gray-700 mb-2">
                Mesa
              </label>
              <select
                id="mesa-select"
                value={mesaSeleccionada}
                onChange={(e) => setMesaSeleccionada(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({length: 280}, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>
                    Mesa {num} {num > 277 ? '(Extranjeros)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="electores-votaron" className="block text-sm font-medium text-gray-700 mb-2">
                A) Electores que votaron
              </label>
              <input
                id="electores-votaron"
                type="number"
                min="0"
                value={acta.electoresVotaron}
                onChange={(e) => handleInputChange('electoresVotaron', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="sobres-recibidos" className="block text-sm font-medium text-gray-700 mb-2">
                B) Sobres en la urna
              </label>
              <input
                id="sobres-recibidos"
                type="number"
                min="0"
                value={acta.sobresRecibidos}
                onChange={(e) => handleInputChange('sobresRecibidos', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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

          {/* Sección de votos provinciales */}
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
                  <input
                    type="number"
                    min="0"
                    value={acta.votosProvinciales[lista.nombre] || 0}
                    onChange={(e) => handleVotoChange('provinciales', lista.nombre, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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

          {/* Sección de votos locales */}
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
                  <input
                    type="number"
                    min="0"
                    value={acta.votosLocales[lista.nombre] || 0}
                    onChange={(e) => handleVotoChange('locales', lista.nombre, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
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

          {/* Otros votos */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-center mb-4">OTROS VOTOS</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="votos-blanco" className="block text-sm font-medium text-gray-700 mb-2">
                  D) Votos en blanco
                </label>
                <input
                  id="votos-blanco"
                  type="number"
                  min="0"
                  value={acta.votosEnBlanco}
                  onChange={(e) => handleInputChange('votosEnBlanco', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="votos-impugnados" className="block text-sm font-medium text-gray-700 mb-2">
                  Votos identidad impugnada
                </label>
                <input
                  id="votos-impugnados"
                  type="number"
                  min="0"
                  value={acta.votosImpugnados}
                  onChange={(e) => handleInputChange('votosImpugnados', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="votos-sobre3" className="block text-sm font-medium text-gray-700 mb-2">
                  E) Se remiten en sobre Nro 3
                </label>
                <input
                  id="votos-sobre3"
                  type="number"
                  min="0"
                  value={acta.votosSobreNro3}
                  onChange={(e) => handleInputChange('votosSobreNro3', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              id="observaciones"
              value={acta.observaciones}
              onChange={(e) => handleStringInputChange('observaciones', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Observaciones generales sobre el escrutinio..."
            />
          </div>

          {/* Resumen final */}
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

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Guardando...' : 'Guardar Acta'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CargarActa;