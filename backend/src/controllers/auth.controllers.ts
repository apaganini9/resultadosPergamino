import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);

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
      console.error('❌ Error en login:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }

  static async perfil(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          error: 'No autenticado' 
        });
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          nombre: true,
          rol: true,
          activo: true,
          createdAt: true
        }
      });

      res.json({
        success: true,
        usuario
      });
    } catch (error) {
      console.error('❌ Error al obtener perfil:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }
}