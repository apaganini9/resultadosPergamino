import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient, TipoLista } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware, requireRole } from './middleware/auth.middleware';


interface VotoData {
  mesaId: number;
  listaId: number;
  cantidad: number;
}

dotenv.config();

const app = express();
const server = createServer(app);
const prisma = new PrismaClient();

// Middleware básico
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend funcionando!',
    servidor: 'Centro de Cómputos Electoral - Pergamino'
  });
});

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta de login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email y contraseña son requeridos' 
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        nombre: true,
        password: true,
        rol: true,
        activo: true
      }
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ 
        success: false,
        error: 'Credenciales inválidas' 
      });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ 
        success: false,
        error: 'Credenciales inválidas' 
      });
    }

    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        rol: usuario.rol 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    const { password: _, ...usuarioSinPassword } = usuario;

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      usuario: usuarioSinPassword
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// Ruta para obtener estadísticas de mesas
app.get('/api/mesas/estadisticas', async (req, res) => {
  try {
    const [totalMesas, mesasCargadas, mesasPendientes, totalVotos] = await Promise.all([
      prisma.mesa.count(),
      prisma.mesa.count({ where: { estado: 'CARGADA' } }),
      prisma.mesa.count({ where: { estado: 'PENDIENTE' } }),
      prisma.votoLista.aggregate({ _sum: { cantidad: true } })
    ]);

    const progreso = totalMesas > 0 ? (mesasCargadas / totalMesas) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalMesas,
        mesasCargadas,
        mesasPendientes,
        progreso: Math.round(progreso * 100) / 100,
        votosTotales: totalVotos._sum.cantidad || 0,
        ultimaActualizacion: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// Ruta para obtener mesa por número
app.get('/api/mesas/:numero', async (req, res) => {
  try {
    const { numero } = req.params;
    
    const mesa = await prisma.mesa.findUnique({
      where: { numero: parseInt(numero) },
      include: {
        acta: {
          include: {
            usuario: {
              select: { id: true, nombre: true, email: true }
            }
          }
        },
        votos: {
          include: {
            lista: true
          }
        }
      }
    });

    if (!mesa) {
      return res.status(404).json({ 
        success: false,
        error: `Mesa número ${numero} no encontrada` 
      });
    }

    res.json({
      success: true,
      data: mesa
    });
  } catch (error) {
    console.error('Error al obtener mesa:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// Ruta para cargar acta electoral
app.post('/api/mesas/cargar-acta', authMiddleware, requireRole('ADMIN', 'OPERADOR'), async (req, res) => {
  try {
    const {
      mesaNumero,
      electoresVotaron,
      sobresRecibidos,
      votosProvinciales,
      votosLocales,
      votosEnBlanco,
      votosImpugnados,
      votosSobreNro3,
      observaciones
    } = req.body;

    const userId = req.user?.id; // Usar el ID del usuario autenticado

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    // Validar datos requeridos
    if (!mesaNumero || electoresVotaron === undefined || sobresRecibidos === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Datos requeridos faltantes'
      });
    }

    // Buscar mesa por número
    const mesa = await prisma.mesa.findUnique({
      where: { numero: mesaNumero }
    });

    if (!mesa) {
      return res.status(404).json({
        success: false,
        error: `Mesa número ${mesaNumero} no encontrada`
      });
    }

    // Validaciones básicas
    if (sobresRecibidos > electoresVotaron) {
      return res.status(400).json({
        success: false,
        error: 'Los sobres no pueden superar a los electores que votaron'
      });
    }

    const totalVotosProvinciales = Object.values(votosProvinciales || {}).reduce((sum: number, votos: any) => sum + (votos || 0), 0);
    const totalVotosLocales = Object.values(votosLocales || {}).reduce((sum: number, votos: any) => sum + (votos || 0), 0);

    if (totalVotosProvinciales > sobresRecibidos) {
      return res.status(400).json({
        success: false,
        error: 'Los votos provinciales no pueden superar los sobres recibidos'
      });
    }

    if (totalVotosLocales > sobresRecibidos) {
      return res.status(400).json({
        success: false,
        error: 'Los votos locales no pueden superar los sobres recibidos'
      });
    }

    // Transacción para guardar acta y votos
    const resultado = await prisma.$transaction(async (prisma) => {
      // Crear o actualizar acta
      const acta = await prisma.actaMesa.upsert({
        where: { mesaId: mesa.id },
        update: {
          electoresVotaron,
          sobresRecibidos,
          votosEnBlanco: votosEnBlanco || 0,
          votosImpugnados: votosImpugnados || 0,
          votosSobreNro3: votosSobreNro3 || 0,
          observaciones: observaciones || '',
          fechaCarga: new Date()
        },
        create: {
          mesaId: mesa.id,
          electoresVotaron,
          sobresRecibidos,
          votosEnBlanco: votosEnBlanco || 0,
          votosImpugnados: votosImpugnados || 0,
          votosSobreNro3: votosSobreNro3 || 0,
          observaciones: observaciones || '',
          usuarioId: userId // Por ahora usar ID fijo, después conectar con auth
        }
      });

      // Eliminar votos anteriores
      await prisma.votoLista.deleteMany({
        where: { mesaId: mesa.id }
      });

      // Obtener listas para crear votos
      const [listasLocalesDB, listasProvincialesDB] = await Promise.all([
        prisma.lista.findMany({ where: { tipo: 'LOCAL' } }),
        prisma.lista.findMany({ where: { tipo: 'PROVINCIAL' } })
      ]);

      // Preparar votos
const votosData: VotoData[] = [];

// Votos locales
if (votosLocales) {
  Object.entries(votosLocales).forEach(([nombreLista, cantidad]) => {
    const lista = listasLocalesDB.find(l => l.nombre === nombreLista);
    const cantidadNum = Number(cantidad);
    
    if (lista && !isNaN(cantidadNum) && cantidadNum > 0) {
      votosData.push({
        mesaId: mesa.id,
        listaId: lista.id,
        cantidad: cantidadNum
      });
    }
  });
}

// Votos provinciales
if (votosProvinciales) {
  Object.entries(votosProvinciales).forEach(([nombreLista, cantidad]) => {
    const lista = listasProvincialesDB.find(l => l.nombre === nombreLista);
    const cantidadNum = Number(cantidad);
    
    if (lista && !isNaN(cantidadNum) && cantidadNum > 0) {
      votosData.push({
        mesaId: mesa.id,
        listaId: lista.id,
        cantidad: cantidadNum
      });
    }
  });
}

      // Crear votos
      if (votosData.length > 0) {
        await prisma.votoLista.createMany({ data: votosData });
      }

      // Actualizar estado de mesa
      await prisma.mesa.update({
        where: { id: mesa.id },
        data: {
          estado: 'CARGADA',
          fechaCarga: new Date()
        }
      });

      return acta;
    });

    console.log(`Acta cargada: Mesa ${mesaNumero} - Votos: ${totalVotosProvinciales + totalVotosLocales}`);

    res.json({
      success: true,
      message: `Acta de Mesa ${mesaNumero} guardada exitosamente`,
      data: resultado
    });

  } catch (error) {
    console.error('Error al cargar acta:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Ruta para obtener mesas pendientes
app.get('/api/mesas/pendientes', authMiddleware, async (req, res) => {
  try {
    const mesasPendientes = await prisma.mesa.findMany({
      where: { estado: 'PENDIENTE' },
      select: { numero: true, ubicacion: true },
      orderBy: { numero: 'asc' }
    });

    res.json({
      success: true,
      data: mesasPendientes
    });
  } catch (error) {
    console.error('Error al obtener mesas pendientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Ruta para obtener todas las mesas con su estado
app.get('/api/mesas', async (req, res) => {
  try {
    const { estado, page = '1', limit = '50' } = req.query;
    
    const filtro: any = {};
    if (estado) filtro.estado = estado;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [mesas, total] = await Promise.all([
      prisma.mesa.findMany({
        where: filtro,
        include: {
          acta: {
            include: {
              usuario: {
                select: { id: true, nombre: true, email: true }
              }
            }
          }
        },
        orderBy: { numero: 'asc' },
        skip,
        take: limitNum
      }),
      prisma.mesa.count({ where: filtro })
    ]);

    res.json({
      success: true,
      data: mesas,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// Ruta para obtener resultados reales - CORREGIDA
app.get('/api/resultados', authMiddleware, async (req, res) => {
  try {
    const { tipo } = req.query as { tipo?: string };

    // Validar que el tipo sea válido o usar undefined para 'all'
    let tipoFiltro: TipoLista | undefined = undefined;
    
    if (tipo && tipo !== 'all') {
      // Verificar que el tipo sea válido
      if (tipo === 'LOCAL' || tipo === 'PROVINCIAL') {
        tipoFiltro = tipo as TipoLista;
      }
    }

    // Construir whereClause
    const whereClause = tipoFiltro ? { 
      lista: { 
        is: { tipo: tipoFiltro } 
      } 
    } : {};
    
    const votos = await prisma.votoLista.groupBy({
      by: ['listaId'],
      where: whereClause,
      _sum: {
        cantidad: true
      },
      orderBy: {
        _sum: {
          cantidad: 'desc'
        }
      }
    });

    // Obtener información de las listas
    const listasIds = votos.map(v => v.listaId);
    const listas = await prisma.lista.findMany({
      where: { id: { in: listasIds } }
    });

    // Combinar datos y calcular porcentajes
    const totalVotos = votos.reduce((sum, v) => sum + (v._sum?.cantidad || 0), 0);
    
    const resultados = votos.map(voto => {
      const lista = listas.find(l => l.id === voto.listaId);
      const votosLista = voto._sum?.cantidad || 0;
      return {
        lista: lista?.nombre || 'Desconocida',
        tipo: lista?.tipo || 'UNKNOWN',
        votos: votosLista,
        porcentaje: totalVotos > 0 ? (votosLista / totalVotos) * 100 : 0
      };
    });

    res.json({
      success: true,
      data: {
        resultados,
        totalVotos,
        filtro: tipo || 'TODOS'  // CORREGIDO: ahora usa 'tipo' que está definido
      }
    });

  } catch (error) {
    console.error('Error al obtener resultados:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Ruta para estadísticas avanzadas de resultados
app.get('/api/resultados/estadisticas', authMiddleware, async (req, res) => {
  try {
    const [
      totalMesas,
      mesasCargadas,
      totalVotosData,
      electoresEstimados
    ] = await Promise.all([
      prisma.mesa.count(),
      prisma.mesa.count({ where: { estado: 'CARGADA' } }),
      prisma.votoLista.aggregate({ _sum: { cantidad: true } }),
      prisma.configuracionSistema.findUnique({ 
        where: { clave: 'TOTAL_ELECTORES_ESTIMADOS' } 
      })
    ]);

    const totalVotos = totalVotosData._sum.cantidad || 0;
    const electores = parseInt(electoresEstimados?.valor || '93000');
    
    // Calcular participación estimada (dividir entre 2 porque hay votos locales y provinciales)
    const participacionEstimada = electores > 0 ? 
      ((totalVotos / 2) / electores) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalMesas,
        mesasCargadas,
        mesasPendientes: totalMesas - mesasCargadas,
        progreso: totalMesas > 0 ? (mesasCargadas / totalMesas) * 100 : 0,
        totalVotos,
        electoresEstimados: electores,
        participacionEstimada,
        ultimaActualizacion: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de resultados:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log('================================');
  console.log('Centro de Cómputos Electoral');
  console.log('Pergamino - Buenos Aires');
  console.log(`Servidor: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('================================');
  console.log('\n📋 Rutas disponibles:');
  console.log('🔑 POST /api/auth/login');
  console.log('📊 GET  /api/mesas/estadisticas');
  console.log('🔍 GET  /api/mesas/:numero');
  console.log('📝 POST /api/mesas/cargar-acta');
  console.log('📋 GET  /api/mesas/pendientes');
  console.log('📈 GET  /api/resultados');
  console.log('📊 GET  /api/resultados/estadisticas');
  console.log('🧪 GET  /api/test');
});

export default app;