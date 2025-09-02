import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definir el tipo más específico para el rol
type UserRole = 'ADMIN' | 'OPERADOR' | 'CONSULTOR';

interface JwtPayload {
  id: number;
  email: string;
  rol: UserRole;
}

// Extender Express Request globalmente
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false,
        error: 'Token no proporcionado' 
      });
      return;
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      res.status(500).json({ 
        success: false,
        error: 'Error de configuración del servidor' 
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        email: true, 
        rol: true, 
        activo: true 
      }
    });

    if (!usuario || !usuario.activo) {
      res.status(401).json({ 
        success: false,
        error: 'Token inválido o usuario inactivo' 
      });
      return;
    }

    req.user = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol as UserRole
    };

    next();
  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    res.status(401).json({ 
      success: false,
      error: 'Token inválido' 
    });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.rol)) {
      res.status(403).json({ 
        success: false,
        error: 'Permisos insuficientes' 
      });
      return;
    }
    next();
  };
};