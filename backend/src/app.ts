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
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface VotoData {
  mesaId: number;
  listaId: number;
  cantidad: number;
}

dotenv.config();

// Función para ejecutar migraciones automáticamente
async function runMigrations() {
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('🔄 Running Prisma migrations...');
      
      // Ejecutar migraciones
      const { stdout: migrateOut } = await execAsync('npx prisma migrate deploy');
      console.log('✅ Migrations completed:', migrateOut);
      
      // Verificar conexión a la base de datos
      await prisma.$connect();
      console.log('✅ Database connection verified');
      
    } catch (error) {
      console.error('❌ Migration error:', error);
      // No detener la aplicación, solo loggear el error
    }
  }
}

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

// Servir archivos estáticos del frontend en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
}

// Ejecutar migraciones al iniciar
runMigrations();

// === RUTAS API ===
// TODO: Aquí van todas tus rutas API existentes
// app.use('/api/auth', authRoutes);
// app.use('/api/mesas', mesaRoutes);
// etc.

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Fallback para React Router en producción
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
  });
}

// Configuración del puerto
const PORT = parseInt(process.env.PORT || '3000', 10);

// Iniciar el servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});

// Manejo de errores del servidor
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Manejo de cierre graceful
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});