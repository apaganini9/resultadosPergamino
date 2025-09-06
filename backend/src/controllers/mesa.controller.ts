import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Esquemas de validación actualizados según el acta oficial
const cargarActaSchema = z.object({
  mesaNumero: z.number().int().positive(),
  electoresVotaron: z.number().int().min(0),
  sobresRecibidos: z.number().int().min(0),
  votosLocales: z.record(z.string(), z.number().int().min(0)),
  votosProvinciales: z.record(z.string(), z.number().int().min(0)),
  votosEnBlanco: z.number().int().min(0).default(0),
  votosImpugnados: z.number().int().min(0).default(0),
  votosSobreNro3: z.number().int().min(0).default(0),
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

  // Obtener mesa por número con formato del acta oficial
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

      // Separar votos por tipo y ordenar por número oficial
      const votosLocales = mesa.votos
        .filter(v => v.lista.tipo === 'LOCAL')
        .sort((a, b) => parseInt(a.lista.numero) - parseInt(b.lista.numero));
        
      const votosProvinciales = mesa.votos
        .filter(v => v.lista.tipo === 'PROVINCIAL')
        .sort((a, b) => parseInt(a.lista.numero) - parseInt(b.lista.numero));

      const totalVotosLocales = votosLocales.reduce((sum, v) => sum + v.cantidad, 0);
      const totalVotosProvinciales = votosProvinciales.reduce((sum, v) => sum + v.cantidad, 0);

      res.json({
        success: true,
        data: {
          id: mesa.id,
          numero: mesa.numero,
          ubicacion: mesa.ubicacion,
          estado: mesa.estado,
          fechaCarga: mesa.fechaCarga,
          acta: mesa.acta ? {
            ...mesa.acta,
            diferencia: mesa.acta.electoresVotaron - mesa.acta.sobresRecibidos
          } : null,
          votos: votosLocales.concat(votosProvinciales).map(v => ({
            id: v.id,
            cantidad: v.cantidad,
            lista: {
              id: v.lista.id,
              numero: v.lista.numero,
              nombre: v.lista.nombre,
              tipo: v.lista.tipo
            }
          })),
          totales: {
            electoresVotaron: mesa.acta?.electoresVotaron || 0,
            sobresRecibidos: mesa.acta?.sobresRecibidos || 0,
            diferencia: mesa.acta ? mesa.acta.electoresVotaron - mesa.acta.sobresRecibidos : 0,
            votosLocales: totalVotosLocales,
            votosProvinciales: totalVotosProvinciales,
            votosEnBlanco: mesa.acta?.votosEnBlanco || 0,
            votosImpugnados: mesa.acta?.votosImpugnados || 0,
            votosSobreNro3: mesa.acta?.votosSobreNro3 || 0,
            totalGeneral: totalVotosLocales + totalVotosProvinciales + 
                         (mesa.acta?.votosEnBlanco || 0) + 
                         (mesa.acta?.votosImpugnados || 0) + 
                         (mesa.acta?.votosSobreNro3 || 0)
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

  // Obtener listas disponibles según el acta oficial
  static async obtenerListas(req: Request, res: Response) {
    try {
      const { tipo } = req.query;

      const filtro: any = { activa: true };
      if (tipo) filtro.tipo = tipo;

      const listas = await prisma.lista.findMany({
        where: filtro,
        orderBy: [
          { tipo: 'asc' },
          { orden: 'asc' }
        ]
      });

      // Separar por tipo y filtrar según habilitación
      const listasProvinciales = listas
        .filter(l => l.tipo === 'PROVINCIAL' && l.habilitadaProvincial)
        .map(l => ({
          id: l.id,
          numero: l.numero,
          nombre: l.nombre,
          tipo: l.tipo,
          orden: l.orden
        }));

      const listasLocales = listas
        .filter(l => l.tipo === 'LOCAL' && l.habilitadaLocal)
        .map(l => ({
          id: l.id,
          numero: l.numero,
          nombre: l.nombre,
          tipo: l.tipo,
          orden: l.orden
        }));

      res.json({
        success: true,
        data: {
          provinciales: listasProvinciales,
          locales: listasLocales,
          total: listasProvinciales.length + listasLocales.length
        }
      });
    } catch (error) {
      console.error('❌ Error al obtener listas:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }

  // Cargar acta con validaciones del acta oficial
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

      // Obtener listas habilitadas
      const [listasLocales, listasProvinciales] = await Promise.all([
        prisma.lista.findMany({ 
          where: { tipo: 'LOCAL', activa: true, habilitadaLocal: true } 
        }),
        prisma.lista.findMany({ 
          where: { tipo: 'PROVINCIAL', activa: true, habilitadaProvincial: true } 
        })
      ]);

      // Validaciones según el acta oficial
      const totalVotosLocales = Object.values(validatedData.votosLocales).reduce((sum, votos) => sum + votos, 0);
      const totalVotosProvinciales = Object.values(validatedData.votosProvinciales).reduce((sum, votos) => sum + votos, 0);
      const diferencia = validatedData.electoresVotaron - validatedData.sobresRecibidos;

      // Validación 1: Electores votaron >= Sobres recibidos
      if (validatedData.sobresRecibidos > validatedData.electoresVotaron) {
        return res.status(400).json({ 
          success: false,
          error: `Los sobres recibidos (${validatedData.sobresRecibidos}) no pueden superar a los electores que votaron (${validatedData.electoresVotaron})` 
        });
      }

      // Validación 2: Votos de cada categoría <= Sobres recibidos
      if (totalVotosProvinciales > validatedData.sobresRecibidos) {
        return res.status(400).json({ 
          success: false,
          error: `Los votos provinciales (${totalVotosProvinciales}) no pueden superar los sobres recibidos (${validatedData.sobresRecibidos})` 
        });
      }

      if (totalVotosLocales > validatedData.sobresRecibidos) {
        return res.status(400).json({ 
          success: false,
          error: `Los votos locales (${totalVotosLocales}) no pueden superar los sobres recibidos (${validatedData.sobresRecibidos})` 
        });
      }

      // Validación 3: Verificar que las listas existen y están habilitadas
      for (const nombreLista of Object.keys(validatedData.votosLocales)) {
        const lista = listasLocales.find(l => l.nombre === nombreLista);
        if (!lista) {
          return res.status(400).json({ 
            success: false,
            error: `Lista local "${nombreLista}" no encontrada o no habilitada` 
          });
        }
      }

      for (const nombreLista of Object.keys(validatedData.votosProvinciales)) {
        const lista = listasProvinciales.find(l => l.nombre === nombreLista);
        if (!lista) {
          return res.status(400).json({ 
            success: false,
            error: `Lista provincial "${nombreLista}" no encontrada o no habilitada` 
          });
        }
      }

      // Transacción para cargar acta y votos
      const resultado = await prisma.$transaction(async (prisma) => {
        // Crear o actualizar acta con campos del acta oficial
        const acta = await prisma.actaMesa.upsert({
          where: { mesaId: mesa.id },
          update: {
            electoresVotaron: validatedData.electoresVotaron,
            sobresRecibidos: validatedData.sobresRecibidos,
            diferencia: diferencia,
            votosEnBlanco: validatedData.votosEnBlanco,
            votosImpugnados: validatedData.votosImpugnados,
            votosSobreNro3: validatedData.votosSobreNro3,
            observaciones: validatedData.observaciones,
            fechaCarga: new Date(),
            usuarioId: userId
          },
          create: {
            mesaId: mesa.id,
            electoresVotaron: validatedData.electoresVotaron,
            sobresRecibidos: validatedData.sobresRecibidos,
            diferencia: diferencia,
            votosEnBlanco: validatedData.votosEnBlanco,
            votosImpugnados: validatedData.votosImpugnados,
            votosSobreNro3: validatedData.votosSobreNro3,
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

      console.log(`📋 Acta cargada: Mesa ${validatedData.mesaNumero} por ${req.user?.email}`);

      res.status(201).json({ 
        success: true,
        message: `Acta de Mesa ${validatedData.mesaNumero} cargada exitosamente`,
        data: {
          ...resultado,
          diferencia: diferencia,
          totales: {
            votosProvinciales: totalVotosProvinciales,
            votosLocales: totalVotosLocales
          }
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: 'Datos inválidos según el formato del acta',
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

  // Obtener estadísticas actualizadas
  static async obtenerEstadisticas(req: Request, res: Response) {
    try {
      const [estadisticas, configuracion] = await Promise.all([
        prisma.$transaction([
          prisma.mesa.count(),
          prisma.mesa.count({ where: { estado: 'CARGADA' } }),
          prisma.mesa.count({ where: { estado: 'PENDIENTE' } }),
          prisma.votoLista.aggregate({ _sum: { cantidad: true } }),
          prisma.actaMesa.aggregate({ 
            _sum: { 
              electoresVotaron: true,
              sobresRecibidos: true,
              votosEnBlanco: true,
              votosImpugnados: true,
              votosSobreNro3: true
            } 
          })
        ]),
        prisma.configuracionSistema.findUnique({ 
          where: { clave: 'TOTAL_ELECTORES_ESTIMADOS' } 
        })
      ]);

      const [totalMesas, mesasCargadas, mesasPendientes, totalVotos, totalesActas] = estadisticas;
      
      const progreso = totalMesas > 0 ? (mesasCargadas / totalMesas) * 100 : 0;
      const electoresEstimados = parseInt(configuracion?.valor || '93000');
      const participacionEstimada = electoresEstimados > 0 ? 
        ((totalesActas._sum.electoresVotaron || 0) / electoresEstimados) * 100 : 0;

      res.json({
        success: true,
        data: {
          totalMesas,
          mesasCargadas,
          mesasPendientes,
          progreso: Math.round(progreso * 100) / 100,
          electoresVotaron: totalesActas._sum.electoresVotaron || 0,
          sobresRecibidos: totalesActas._sum.sobresRecibidos || 0,
          votosTotales: totalVotos._sum.cantidad || 0,
          votosEnBlanco: totalesActas._sum.votosEnBlanco || 0,
          votosImpugnados: totalesActas._sum.votosImpugnados || 0,
          votosSobreNro3: totalesActas._sum.votosSobreNro3 || 0,
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

  // Validar integridad de mesa según acta oficial
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

      // Validaciones según acta oficial
      const totalVotosLocales = mesa.votos
        .filter(v => v.lista.tipo === 'LOCAL')
        .reduce((sum, v) => sum + v.cantidad, 0);
      
      const totalVotosProvinciales = mesa.votos
        .filter(v => v.lista.tipo === 'PROVINCIAL')
        .reduce((sum, v) => sum + v.cantidad, 0);

      const acta = mesa.acta!;
      const diferencia = acta.electoresVotaron - acta.sobresRecibidos;

      // Validaciones críticas
      if (acta.sobresRecibidos > acta.electoresVotaron) {
        errores.push(`Sobres (${acta.sobresRecibidos}) > Electores que votaron (${acta.electoresVotaron})`);
      }

      if (totalVotosLocales > acta.sobresRecibidos) {
        errores.push(`Votos locales (${totalVotosLocales}) > Sobres recibidos (${acta.sobresRecibidos})`);
      }

      if (totalVotosProvinciales > acta.sobresRecibidos) {
        errores.push(`Votos provinciales (${totalVotosProvinciales}) > Sobres recibidos (${acta.sobresRecibidos})`);
      }

      if (acta.diferencia !== diferencia) {
        errores.push(`Diferencia calculada (${diferencia}) ≠ Diferencia guardada (${acta.diferencia})`);
      }

      // Warnings
      if (totalVotosLocales === 0) {
        warnings.push('Sin votos registrados para listas locales');
      }

      if (totalVotosProvinciales === 0) {
        warnings.push('Sin votos registrados para listas provinciales');
      }

      const participacionLocal = acta.sobresRecibidos > 0 ? (totalVotosLocales / acta.sobresRecibidos) * 100 : 0;
      const participacionProvincial = acta.sobresRecibidos > 0 ? (totalVotosProvinciales / acta.sobresRecibidos) * 100 : 0;

      if (participacionLocal < 70) {
        warnings.push(`Baja participación local: ${participacionLocal.toFixed(1)}%`);
      }

      if (participacionProvincial < 70) {
        warnings.push(`Baja participación provincial: ${participacionProvincial.toFixed(1)}%`);
      }

      res.json({
        success: true,
        data: {
          mesa: mesa.numero,
          valida: errores.length === 0,
          errores,
          warnings,
          estadisticas: {
            electoresVotaron: acta.electoresVotaron,
            sobresRecibidos: acta.sobresRecibidos,
            diferencia: acta.diferencia,
            totalVotosLocales,
            totalVotosProvinciales,
            votosEnBlanco: acta.votosEnBlanco,
            votosImpugnados: acta.votosImpugnados,
            votosSobreNro3: acta.votosSobreNro3,
            participacionLocal: participacionLocal,
            participacionProvincial: participacionProvincial
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