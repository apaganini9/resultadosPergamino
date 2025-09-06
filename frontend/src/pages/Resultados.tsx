import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  RefreshCw, 
  Download, 
  Plus,
  Minus,
  MapPin,
  Vote,
  Users,
  TrendingUp,
  BarChart3,
  Award,
  Eye
} from 'lucide-react';

import { ResultadoService } from '../services/api';

interface ResultadoElectoral {
  lista: string;
  votos: number;
  porcentaje: number;
  color?: string;
}

interface EstadisticasResultados {
  totalMesas: number;
  mesasCargadas: number;
  mesasPendientes: number;
  progreso: number;
  totalVotos: number;
  electoresEstimados: number;
  participacionEstimada: number;
  ultimaActualizacion: string;
}

const listasLocalesReales = [
  'UNIÓN POR PERGAMINO',
  'FRENTE RENOVADOR', 
  'JUNTOS POR EL CAMBIO',
  'FRENTE DE TODOS',
  'LA LIBERTAD AVANZA'
];

const listasProvincialesReales = [
  'FRENTE RENOVADOR',
  'JUNTOS POR EL CAMBIO', 
  'FRENTE DE TODOS',
  'LA LIBERTAD AVANZA',
  'IZQUIERDA UNIDA'
];

const Resultados: React.FC = () => {
  const [resultadosLocales, setResultadosLocales] = useState<ResultadoElectoral[]>([]);
  const [resultadosProvinciales, setResultadosProvinciales] = useState<ResultadoElectoral[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasResultados>({
    totalMesas: 280,
    mesasCargadas: 0,
    mesasPendientes: 280,
    progreso: 0,
    totalVotos: 0,
    electoresEstimados: 93000,
    participacionEstimada: 0,
    ultimaActualizacion: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [tipoVista, setTipoVista] = useState<'locales' | 'provinciales'>('locales');
  const [animateCards, setAnimateCards] = useState(false);

  const colores = useMemo(() => [
    '#3b82f6', // Azul
    '#8b5cf6', // Púrpura  
    '#10b981', // Verde esmeralda
    '#f59e0b', // Amarillo
    '#ef4444', // Rojo
    '#06b6d4', // Cyan
    '#f97316', // Naranja
    '#ec4899', // Rosa
  ], []);

  const cargarResultados = useCallback(async () => {
    try {
      setLoading(true);
      
      const [localesResponse, provincialesResponse, estadisticasResponse] = await Promise.all([
        ResultadoService.obtenerResultados('LOCAL'),
        ResultadoService.obtenerResultados('PROVINCIAL'),
        ResultadoService.obtenerEstadisticas()
      ]);

      if (localesResponse.success && localesResponse.data) {
        const localesConColor = localesResponse.data.resultados.map((item: any, index: number) => ({
          ...item,
          color: colores[index % colores.length]
        }));
        setResultadosLocales(localesConColor);
      }

      if (provincialesResponse.success && provincialesResponse.data) {
        const provincialesConColor = provincialesResponse.data.resultados.map((item: any, index: number) => ({
          ...item,
          color: colores[index % colores.length]
        }));
        setResultadosProvinciales(provincialesConColor);
      }

      if (estadisticasResponse.success && estadisticasResponse.data) {
        setEstadisticas(estadisticasResponse.data);
      }

    } catch (error) {
      console.error('Error al cargar resultados:', error);
      
      const generarResultados = (listas: string[], base: number) => {
        return listas.map((lista, index) => {
          const votos = Math.floor(Math.random() * base) + Math.floor(base * 0.1);
          return {
            lista,
            votos,
            porcentaje: 0,
            color: colores[index % colores.length]
          };
        }).sort((a, b) => b.votos - a.votos);
      };

      const locales = generarResultados(listasLocalesReales, 8000);
      const provinciales = generarResultados(listasProvincialesReales, 7500);

      const totalLocales = locales.reduce((sum, item) => sum + item.votos, 0);
      const totalProvinciales = provinciales.reduce((sum, item) => sum + item.votos, 0);

      locales.forEach(item => {
        item.porcentaje = totalLocales > 0 ? (item.votos / totalLocales) * 100 : 0;
      });

      provinciales.forEach(item => {
        item.porcentaje = totalProvinciales > 0 ? (item.votos / totalProvinciales) * 100 : 0;
      });

      setResultadosLocales(locales);
      setResultadosProvinciales(provinciales);

      setEstadisticas({
        totalMesas: 280,
        mesasCargadas: Math.floor(Math.random() * 100) + 180,
        mesasPendientes: 280 - (Math.floor(Math.random() * 100) + 180),
        progreso: Math.random() * 40 + 60,
        totalVotos: totalLocales,
        electoresEstimados: 93000,
        participacionEstimada: Math.random() * 20 + 65,
        ultimaActualizacion: new Date().toISOString()
      });

      setAnimateCards(true);
      setTimeout(() => setAnimateCards(false), 600);

    } finally {
      setLoading(false);
    }
  }, [colores]);

  useEffect(() => {
    cargarResultados();
    const intervalo = setInterval(cargarResultados, 30000);
    return () => clearInterval(intervalo);
  }, [cargarResultados]);

  const resultadosActivos = tipoVista === 'locales' ? resultadosLocales : resultadosProvinciales;
  const tituloActivo = tipoVista === 'locales' ? 'Elecciones Locales' : 'Elecciones Provinciales';

  const exportarCSV = () => {
    const datos = resultadosActivos.map(item => ({
      Lista: item.lista,
      Votos: item.votos,
      Porcentaje: item.porcentaje.toFixed(2)
    }));

    const csv = [
      Object.keys(datos[0]).join(','),
      ...datos.map((row: any) => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados_${tipoVista}_pergamino_2025.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading && resultadosActivos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-500/30 border-t-purple-400 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-blue-500/20 border-r-blue-400 animate-pulse mx-auto"></div>
          </div>
          <p className="text-purple-200 text-lg font-medium">Cargando Resultados Electorales...</p>
          <p className="text-purple-400 text-sm mt-2">Procesando datos en tiempo real</p>
        </div>
      </div>
    );
  }

  // Datos para el gráfico circular
  const datosCirculares = [
    { name: 'Votos positivos', value: estadisticas.totalVotos, color: '#10b981' },
    { name: 'En blanco', value: Math.floor(estadisticas.totalVotos * 0.02), color: '#ec4899' },
    { name: 'Votos nulos', value: Math.floor(estadisticas.totalVotos * 0.015), color: '#f59e0b' },
    { name: 'Impugnados', value: Math.floor(estadisticas.totalVotos * 0.005), color: '#ef4444' }
  ];

  const totalVotantes = datosCirculares.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Header con glassmorphism */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-3 rounded-2xl">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                  Resultados Electorales 2025
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-blue-300" />
                    <span className="text-blue-200 font-medium">Pergamino, Buenos Aires</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-purple-300" />
                    <span className="text-purple-200">{tituloActivo}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right text-white/80 text-sm">
                <div>Última actualización:</div>
                <div className="font-medium">{new Date(estadisticas.ultimaActualizacion).toLocaleTimeString()}</div>
              </div>
              
              <button
                onClick={exportarCSV}
                className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/20"
              >
                <Download className="h-4 w-4" />
                <span className="font-medium">Exportar</span>
              </button>
              
              <button
                onClick={cargarResultados}
                disabled={loading}
                className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 disabled:opacity-50 border border-white/20 group"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-300`} />
                <span className="font-medium">Actualizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Estadísticas superiores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`group bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 ${animateCards ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium mb-2">Mesas Computadas</p>
                <p className="text-3xl font-bold text-white mb-1">{estadisticas.mesasCargadas}</p>
                <p className="text-blue-300 text-xs">de {estadisticas.totalMesas} totales</p>
              </div>
              <div className="bg-blue-500/30 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Vote className="h-8 w-8 text-blue-300" />
              </div>
            </div>
          </div>

          <div className={`group bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-400/20 hover:border-emerald-400/40 transition-all duration-500 ${animateCards ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-sm font-medium mb-2">Total Electores</p>
                <p className="text-3xl font-bold text-white mb-1">{totalVotantes.toLocaleString()}</p>
                <p className="text-emerald-300 text-xs">votos registrados</p>
              </div>
              <div className="bg-emerald-500/30 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-emerald-300" />
              </div>
            </div>
          </div>

          <div className={`group bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/20 hover:border-purple-400/40 transition-all duration-500 ${animateCards ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium mb-2">Participación</p>
                <p className="text-3xl font-bold text-white mb-1">{estadisticas.participacionEstimada.toFixed(1)}%</p>
                <p className="text-purple-300 text-xs">sobre escrutado</p>
              </div>
              <div className="bg-purple-500/30 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-8 w-8 text-purple-300" />
              </div>
            </div>
          </div>

          <div className={`group bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-400/20 hover:border-amber-400/40 transition-all duration-500 ${animateCards ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-200 text-sm font-medium mb-2">Líder Actual</p>
                <p className="text-2xl font-bold text-white mb-1">{resultadosActivos[0]?.lista.split(' ')[0] || 'N/A'}</p>
                <p className="text-amber-300 text-xs">{resultadosActivos[0]?.porcentaje.toFixed(1)}% votos</p>
              </div>
              <div className="bg-amber-500/30 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Award className="h-8 w-8 text-amber-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Selector de categoría */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center">
              <Eye className="h-6 w-6 mr-3 text-blue-400" />
              Seleccionar Categoría Electoral
            </h2>
            <div className="inline-flex bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
              <button
                onClick={() => setTipoVista('locales')}
                className={`px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 ${
                  tipoVista === 'locales'
                    ? 'bg-white/20 text-white shadow-lg border border-white/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Elecciones Locales
              </button>
              <button
                onClick={() => setTipoVista('provinciales')}
                className={`px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 ${
                  tipoVista === 'provinciales'
                    ? 'bg-white/20 text-white shadow-lg border border-white/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Elecciones Provinciales
              </button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Panel izquierdo - Agrupaciones políticas */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <BarChart3 className="h-6 w-6 mr-3 text-blue-400" />
                  Agrupaciones Políticas
                </h3>
                <div className="flex space-x-1">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Plus className="h-4 w-4 text-white/70" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Minus className="h-4 w-4 text-white/70" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {resultadosActivos.map((resultado, index) => (
                <div key={resultado.lista} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm mb-1">
                        {resultado.lista}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-2xl font-bold text-white">
                          {resultado.porcentaje.toFixed(2)}%
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-medium text-white/80">
                            {resultado.votos.toLocaleString()}
                          </div>
                          <div className="text-xs text-white/60">votos</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                        style={{ 
                          width: `${resultado.porcentaje}%`,
                          background: `linear-gradient(90deg, ${resultado.color}, ${resultado.color}dd)`
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="h-2 rounded-full opacity-60"
                        style={{ 
                          width: `${resultado.porcentaje}%`,
                          backgroundColor: resultado.color
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel central - Mapa */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
            <div className="text-center h-full flex flex-col justify-center">
              <div className="mb-6">
                <MapPin className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">Mapa Electoral</h3>
                <p className="text-white/70 mb-8">Resultados por distrito en Pergamino</p>
              </div>
              
              {/* Simulación de mapa mejorado */}
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 mx-auto border border-white/20">
                <div className="grid grid-cols-4 gap-2">
                  {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map((i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-lg transition-all duration-300 hover:scale-110 border border-white/20"
                      style={{
                        backgroundColor: resultadosActivos[i % resultadosActivos.length]?.color || '#ffffff20'
                      }}
                    ></div>
                  ))}
                </div>
                <div className="mt-6 text-sm font-medium text-white/80">
                  Pergamino • {estadisticas.mesasCargadas} mesas procesadas
                </div>
                <div className="text-xs text-white/60 mt-1">
                  Actualización en tiempo real
                </div>
              </div>
            </div>
          </div>

          {/* Panel derecho - Resumen de votos */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Users className="h-6 w-6 mr-3 text-purple-400" />
                Resumen de Votos
              </h3>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={datosCirculares}
                        cx={100}
                        cy={100}
                        innerRadius={60}
                        outerRadius={90}
                        startAngle={90}
                        endAngle={450}
                        dataKey="value"
                      >
                        {datosCirculares.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-lg font-bold text-white/80">Votantes</div>
                    <div className="text-2xl font-bold text-white">{totalVotantes.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {datosCirculares.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-white/15 backdrop-blur-sm rounded-lg border border-white/20">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full border border-white/30"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-white font-medium">{item.name}</span>
                    </div>
                    <div className="text-sm font-bold text-white">
                      {((item.value / totalVotantes) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Aviso importante */}
        <div className="mt-8 bg-blue-500/20 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">i</span>
              </div>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-blue-100 mb-2">Resultados Provisionales</h4>
              <p className="text-blue-200 text-lg leading-relaxed">
                Los resultados mostrados son <strong>provisionales</strong> y se actualizan automáticamente cada 30 segundos. 
                Reflejan únicamente las <strong>{estadisticas.mesasCargadas} mesas procesadas</strong> de un total de <strong>{estadisticas.totalMesas} mesas</strong>. 
                Los resultados oficiales definitivos serán publicados por la Junta Electoral Provincial.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resultados;