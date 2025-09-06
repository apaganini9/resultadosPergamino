import { Router } from 'express';
import { MesaController } from '../controllers/mesa.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// Rutas de consulta (todos los roles autenticados)
router.get('/', MesaController.obtenerMesas);
router.get('/estadisticas', MesaController.obtenerEstadisticas);
router.get('/pendientes', MesaController.obtenerMesasPendientes);
router.get('/listas', MesaController.obtenerListas); // Nueva ruta para obtener listas
router.get('/:numero', MesaController.obtenerMesaPorNumero);
router.get('/:numero/validar', MesaController.validarMesa);

// Rutas de operación (ADMIN y OPERADOR)
router.post('/cargar-acta', requireRole('ADMIN', 'OPERADOR'), MesaController.cargarActa);

export default router;