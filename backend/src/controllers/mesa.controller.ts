import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Esquemas de validación
const cargarActaSchema = z.object({
  mesaNumero: z.number().int().positive(),
  sobresRecibidos: z.number().int().min(0),
  votosLocales: z.record(z.string(), z.number().int().min(0)),
  votosProvinciales: z.record(z.string(), z.number().int().min(0)),
  observaciones: z.string().optional()
});

export class MesaController {
  // Obtener todas las mesas
  static async obtenerMesas(req: Request, res: Response) {
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
      console.error('❌ Error al obtener mesas:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }

  // Obtener mesa por número
  static async obtenerMesaPorNumero(req: Request, res: Response) {
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
            },
            orderBy: [
              { lista: { tipo: 'asc' } },
              { lista: { orden: 'asc' } }
            ]
          }
        }
      });

      if (!mesa) {
        return res.status(404).json({ 
          success: false,
          error: `Mesa número ${numero} no encontrada` 
        });
      }

      // Separar votos por tipo
      const votosLocales = mesa.votos.filter(v => v.lista.tipo === 'LOCAL');
      const votosProvinciales = mesa.votos.filter(v => v.lista.tipo === 'PROVINCIAL');

      res.json({
        success: true,
        data: {
          mesa: {
            id: mesa.id,
            numero: mesa.numero,
            ubicacion: mesa.ubicacion,
            estado: mesa.estado,
            fechaCarga: mesa.fechaCarga
          },
          acta: mesa.acta,
          votos: {
            locales: votosLocales,
            provinciales: votosProvinciales
          },
          totales: {
            votosLocales: votosLocales.reduce((sum, v) => sum + v.cantidad, 0),
            votosProvinciales: votosProvinciales.reduce((sum, v) => sum + v.cantidad, 0),
            sobresRecibidos: mesa.acta?.sobresRecibidos || 0
          }
        }
      });
    } catch (error) {
      console.error('❌ Error al obtener mesa por número:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }

  // Cargar acta de mesa
  static async cargarActa(req: Request, res: Response) {
    try {
      const validatedData = cargarActaSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ 
          success: false,
          error: 'Usuario no autenticado' 
        });
      }

      // Buscar mesa por número
      const mesa = await prisma.mesa.findUnique({
        where: { numero: validatedData.mesaNumero }
      });

      if (!mesa) {
        return res.status(404).json({ 
          success: false,
          error: `Mesa número ${validatedData.mesaNumero} no encontrada` 
        });
      }

      // Obtener todas las listas
      const [listasLocales, listasProvinciales] = await Promise.all([
        prisma.lista.findMany({ where: { tipo: 'LOCAL', activa: true } }),
        prisma.lista.findMany({ where: { tipo: 'PROVINCIAL', activa: true } })
      ]);

      // Validar votos locales
      const totalVotosLocales = Object.values(validatedData.votosLocales).reduce((sum, votos) => sum + votos, 0);
      const totalVotosProvinciales = Object.values(validatedData.votosProvinciales).reduce((sum, votos) => sum + votos, 0);

      if (totalVotosLocales > validatedData.sobresRecibidos) {
        return res.status(400).json({ 
          success: false,
          error: `Los votos locales (${totalVotosLocales}) no pueden superar los sobres recibidos (${validatedData.sobresRecibidos})` 
        });
      }

      if (totalVotosProvinciales > validatedData.sobresRecibidos) {
        return res.status(400).json({ 
          success: false,
          error: `Los votos provinciales (${totalVotosProvinciales}) no pueden superar los sobres recibidos (${validatedData.sobresRecibidos})` 
        });
      }

      // Transacción para cargar acta y votos
      const resultado = await prisma.$transaction(async (prisma) => {
        // Crear o actualizar acta
        const acta = await prisma.actaMesa.upsert({
          where: { mesaId: mesa.id },
          update: {
            sobresRecibidos: validatedData.sobresRecibidos,
            observaciones: validatedData.observaciones,
            fechaCarga: new Date(),
            usuarioId: userId
          },
          create: {
            mesaId: mesa.id,
            sobresRecibidos: validatedData.sobresRecibidos,
            observaciones: validatedData.observaciones,
            usuarioId: userId
          }
        });

        // Eliminar votos anteriores
        await prisma.votoLista.deleteMany({
          where: { mesaId: mesa.id }
        });

        // Preparar datos de votos
        const votosData = [];

        // Votos locales
        for (const [nombreLista, cantidad] of Object.entries(validatedData.votosLocales)) {
          const lista = listasLocales.find(l => l.nombre === nombreLista);
          if (lista && cantidad > 0) {
            votosData.push({
              mesaId: mesa.id,
              listaId: lista.id,
              cantidad: cantidad
            });
          }
        }

        // Votos provinciales
        for (const [nombreLista, cantidad] of Object.entries(validatedData.votosProvinciales)) {
          const lista = listasProvinciales.find(l => l.nombre === nombreLista);
          if (lista && cantidad > 0) {
            votosData.push({
              mesaId: mesa.id,
              listaId: lista.id,
              cantidad: cantidad
            });
          }
        }

        // Crear votos
        if (votosData.length > 0) {
          await prisma.votoLista.createMany({
            data: votosData
          });
        }

        // Actualizar estado de la mesa
        await prisma.mesa.update({
          where: { id: mesa.id },
          data: { 
            estado: 'CARGADA',
            fechaCarga: new Date(),
            usuarioCarga: userId
          }
        });

        return acta;
      });

      console.log(`📝 Acta cargada: Mesa ${validatedData.mesaNumero} por ${req.user?.email}`);

      res.status(201).json({ 
        success: true,
        message: `Acta de Mesa ${validatedData.mesaNumero} cargada exitosamente`,
        data: resultado
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: 'Datos inválidos',
          details: error.errors
        });
      }
      
      console.error('❌ Error al cargar acta:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }

  // Obtener estadísticas de mesas
  static async obtenerEstadisticas(req: Request, res: Response) {
    try {
      const [estadisticas, configuracion] = await Promise.all([
        prisma.$transaction([
          prisma.mesa.count(),
          prisma.mesa.count({ where: { estado: 'CARGADA' } }),
          prisma.mesa.count({ where: { estado: 'PENDIENTE' } }),
          prisma.votoLista.aggregate({ _sum: { cantidad: true } })
        ]),
        prisma.configuracionSistema.findUnique({ 
          where: { clave: 'TOTAL_ELECTORES_ESTIMADOS' } 
        })
      ]);

      const [totalMesas, mesasCargadas, mesasPendientes, totalVotos] = estadisticas;
      
      const progreso = totalMesas > 0 ? (mesasCargadas / totalMesas) * 100 : 0;
      const electoresEstimados = parseInt(configuracion?.valor || '93000');
      const participacionEstimada = electoresEstimados > 0 ? 
        ((totalVotos._sum.cantidad || 0) / electoresEstimados) * 100 : 0;

      res.json({
        success: true,
        data: {
          totalMesas,
          mesasCargadas,
          mesasPendientes,
          progreso: Math.round(progreso * 100) / 100,
          votosTotales: totalVotos._sum.cantidad || 0,
          electoresEstimados,
          participacionEstimada: Math.round(participacionEstimada * 100) / 100,
          ultimaActualizacion: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }

  // Obtener mesas pendientes
  static async obtenerMesasPendientes(req: Request, res: Response) {
    try {
      const mesasPendientes = await prisma.mesa.findMany({
        where: { estado: 'PENDIENTE' },
        select: {
          id: true,
          numero: true,
          ubicacion: true
        },
        orderBy: { numero: 'asc' }
      });

      res.json({
        success: true,
        data: mesasPendientes,
        total: mesasPendientes.length
      });
    } catch (error) {
      console.error('❌ Error al obtener mesas pendientes:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }

  // Validar integridad de una mesa
  static async validarMesa(req: Request, res: Response) {
    try {
      const { numero } = req.params;
      
      const mesa = await prisma.mesa.findUnique({
        where: { numero: parseInt(numero) },
        include: {
          acta: true,
          votos: {
            include: { lista: true }
          }
        }
      });

      if (!mesa || mesa.estado !== 'CARGADA') {
        return res.status(404).json({ 
          success: false,
          error: 'Mesa no encontrada o no está cargada' 
        });
      }

      const errores = [];
      const warnings = [];

      // Validaciones
      const totalVotosLocales = mesa.votos
        .filter(v => v.lista.tipo === 'LOCAL')
        .reduce((sum, v) => sum + v.cantidad, 0);
      
      const totalVotosProvinciales = mesa.votos
        .filter(v => v.lista.tipo === 'PROVINCIAL')
        .reduce((sum, v) => sum + v.cantidad, 0);

      const sobresRecibidos = mesa.acta?.sobresRecibidos || 0;

      if (totalVotosLocales > sobresRecibidos) {
        errores.push(`Votos locales (${totalVotosLocales}) superan sobres recibidos (${sobresRecibidos})`);
      }

      if (totalVotosProvinciales > sobresRecibidos) {
        errores.push(`Votos provinciales (${totalVotosProvinciales}) superan sobres recibidos (${sobresRecibidos})`);
      }

      if (totalVotosLocales === 0) {
        warnings.push('No hay votos registrados para listas locales');
      }

      if (totalVotosProvinciales === 0) {
        warnings.push('No hay votos registrados para listas provinciales');
      }

      const participacion = sobresRecibidos > 0 ? 
        Math.max(totalVotosLocales, totalVotosProvinciales) / sobresRecibidos : 0;

      if (participacion < 0.5) {
        warnings.push(`Baja participación: ${(participacion * 100).toFixed(1)}%`);
      }

      res.json({
        success: true,
        data: {
          mesa: mesa.numero,
          valida: errores.length === 0,
          errores,
          warnings,
          estadisticas: {
            sobresRecibidos,
            totalVotosLocales,
            totalVotosProvinciales,
            participacionLocal: totalVotosLocales / sobresRecibidos * 100,
            participacionProvincial: totalVotosProvinciales / sobresRecibidos * 100
          }
        }
      });

    } catch (error) {
      console.error('❌ Error al validar mesa:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }
}