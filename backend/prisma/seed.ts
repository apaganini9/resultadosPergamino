import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear usuario admin por defecto
  const passwordHasheada = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@pergamino.gov.ar' },
    update: {},
    create: {
      email: 'admin@pergamino.gov.ar',
      nombre: 'Administrador del Sistema',
      password: passwordHasheada,
      rol: 'ADMIN',
    },
  });

  console.log('✅ Usuario admin creado:', adminUser.email);

  // Crear usuarios operadores
  const operadorPassword = await bcrypt.hash('operador123', 12);
  
  const operadores = [
    { email: 'operador1@pergamino.gov.ar', nombre: 'Juan Pérez' },
    { email: 'operador2@pergamino.gov.ar', nombre: 'María González' },
    { email: 'operador3@pergamino.gov.ar', nombre: 'Carlos Rodríguez' }
  ];

  for (const operador of operadores) {
    await prisma.usuario.upsert({
      where: { email: operador.email },
      update: {},
      create: {
        email: operador.email,
        nombre: operador.nombre,
        password: operadorPassword,
        rol: 'OPERADOR',
      },
    });
  }

  console.log('✅ Usuarios operadores creados');

  // Crear listas locales (Concejales y Consejeros Escolares)
  const listasLocales = [
    'FUERZA PATRIA',
    'POTENCIA', 
    'FTE DE IZQ. Y DE TRABAJADORES - UNIDAD',
    'LA LIBERTAD AVANZA',
    'UNION LIBERAL',
    'ESP. ABIERTO PARA EL DES. Y LA INT. SOCIAL',
    'POLITICA OBRERA',
    'PARTIDO LIBERTARIO',
    'IDEAR PERGAMINO'
  ];

  for (let i = 0; i < listasLocales.length; i++) {
    await prisma.lista.upsert({
      where: { 
        nombre_tipo: {
          nombre: listasLocales[i],
          tipo: 'LOCAL'
        }
      },
      update: {},
      create: {
        nombre: listasLocales[i],
        tipo: 'LOCAL',
        orden: i + 1,
        activa: true
      }
    });
  }

  console.log('✅ Listas locales creadas');

  // Crear listas provinciales (Diputados)
  const listasProvinciales = [
    'FUERZA PATRIA',
    'POTENCIA',
    'ES CON VOS ES CON NOSOTROS', 
    'FTE DE IZQ. Y DE TRABAJADORES - UNIDAD',
    'LA LIBERTAD AVANZA',
    'UNION Y LIBERTAD',
    'UNION LIBERAL',
    'ESP. ABIERTO PARA EL DES. Y LA INT. SOCIAL',
    'MOVIMIENTO AVANZADA SOCIALISTA',
    'FRENTE PATRIOTA FEDERAL',
    'POLITICA OBRERA',
    'PARTIDO TIEMPO DE TODOS',
    'CONSTRUYENDO PORVENIR',
    'PARTIDO LIBERTARIO',
    'VALORES REPUBLICANOS'
  ];

  for (let i = 0; i < listasProvinciales.length; i++) {
    await prisma.lista.upsert({
      where: { 
        nombre_tipo: {
          nombre: listasProvinciales[i],
          tipo: 'PROVINCIAL'
        }
      },
      update: {},
      create: {
        nombre: listasProvinciales[i],
        tipo: 'PROVINCIAL',
        orden: i + 1,
        activa: true
      }
    });
  }

  console.log('✅ Listas provinciales creadas');

  // Crear las 280 mesas de Pergamino
  console.log('📊 Creando 280 mesas...');
  
  // Crear mesas normales (1-277)
  for (let i = 1; i <= 277; i++) {
    await prisma.mesa.upsert({
      where: { numero: i },
      update: {},
      create: {
        numero: i,
        ubicacion: `Mesa ${i} - Pergamino`,
        estado: 'PENDIENTE'
      }
    });
  }

  // Crear mesas de extranjeros (278-280)
  for (let i = 278; i <= 280; i++) {
    await prisma.mesa.upsert({
      where: { numero: i },
      update: {},
      create: {
        numero: i,
        ubicacion: `Mesa ${i} - Extranjeros`,
        estado: 'PENDIENTE'
      }
    });
  }

  console.log('✅ 280 mesas creadas');

  // Configuración del sistema
  const configuraciones = [
    { clave: 'NOMBRE_ELECCION', valor: 'Elecciones Provinciales 2025' },
    { clave: 'FECHA_ELECCION', valor: '2025-10-27' },
    { clave: 'MUNICIPIO', valor: 'Pergamino' },
    { clave: 'PROVINCIA', valor: 'Buenos Aires' },
    { clave: 'TOTAL_ELECTORES_ESTIMADOS', valor: '93000' },
    { clave: 'VERSION_SISTEMA', valor: '1.0.0' }
  ];

  for (const config of configuraciones) {
    await prisma.configuracionSistema.upsert({
      where: { clave: config.clave },
      update: { valor: config.valor },
      create: config
    });
  }

  console.log('✅ Configuración del sistema creada');

  // Crear algunos datos de prueba (solo para desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Creando datos de prueba...');
    
    // Cargar algunas mesas de ejemplo
    const mesasPrueba = [1, 2, 3];
    const listasLocalesCreadas = await prisma.lista.findMany({ 
      where: { tipo: 'LOCAL' } 
    });
    const listasProvincialesCreadas = await prisma.lista.findMany({ 
      where: { tipo: 'PROVINCIAL' } 
    });

    for (const numeroMesa of mesasPrueba) {
      const mesa = await prisma.mesa.findFirst({
        where: { numero: numeroMesa }
      });

      if (mesa) {
        // Crear acta
        const sobresRecibidos = Math.floor(Math.random() * 200) + 150;
        
        const acta = await prisma.actaMesa.upsert({
          where: { mesaId: mesa.id },
          update: {
            sobresRecibidos: sobresRecibidos,
            electoresVotaron: sobresRecibidos - 10,
            observaciones: 'Mesa de prueba - datos ficticios (actualizado)',
            usuarioId: adminUser.id
          },
          create: {
            mesaId: mesa.id,
            sobresRecibidos: sobresRecibidos,
            electoresVotaron: sobresRecibidos - 10,
            observaciones: 'Mesa de prueba - datos ficticios',
            usuarioId: adminUser.id
          }
        });

        // Eliminar votos anteriores si existen
        await prisma.votoLista.deleteMany({
          where: { mesaId: mesa.id }
        });

        // Crear votos aleatorios para listas locales
        for (const lista of listasLocalesCreadas) {
          const votos = Math.floor(Math.random() * 30) + 5; // Entre 5-35 votos
          await prisma.votoLista.create({
            data: {
              mesaId: mesa.id,
              listaId: lista.id,
              cantidad: votos
            }
          });
        }

        // Crear votos aleatorios para listas provinciales
        for (const lista of listasProvincialesCreadas) {
          const votos = Math.floor(Math.random() * 30) + 5; // Entre 5-35 votos
          await prisma.votoLista.create({
            data: {
              mesaId: mesa.id,
              listaId: lista.id,
              cantidad: votos
            }
          });
        }

        // Actualizar estado de la mesa
        await prisma.mesa.update({
          where: { id: mesa.id },
          data: {
            estado: 'CARGADA',
            fechaCarga: new Date(),
            usuarioCarga: adminUser.id
          }
        });

        console.log(`   Mesa ${numeroMesa} cargada con datos ficticios`);
      }
    }

    console.log('✅ Datos de prueba creados');
  }

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales por defecto:');
  console.log('👤 Admin: admin@pergamino.gov.ar / admin123');
  console.log('👤 Operador1: operador1@pergamino.gov.ar / operador123');
  console.log('👤 Operador2: operador2@pergamino.gov.ar / operador123');
  console.log('👤 Operador3: operador3@pergamino.gov.ar / operador123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });