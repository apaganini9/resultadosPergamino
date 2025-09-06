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

  // LISTAS OFICIALES SEGÚN EL ACTA
  const listasOficiales = [
    // Número - Nombre - Habilitada Local - Habilitada Provincial
    { numero: '2200', nombre: 'FUERZA PATRIA', local: true, provincial: true },
    { numero: '2201', nombre: 'POTENCIA', local: true, provincial: true },
    { numero: '2202', nombre: 'ES CON VOS ES CON NOSOTROS', local: false, provincial: true }, // NO USAR local
    { numero: '2203', nombre: 'FTE DE IZQ. Y DE TRABAJADORES - UNIDAD', local: true, provincial: true },
    { numero: '2206', nombre: 'LA LIBERTAD AVANZA', local: true, provincial: true },
    { numero: '2207', nombre: 'UNION Y LIBERTAD', local: false, provincial: true }, // NO USAR local
    { numero: '2208', nombre: 'UNION LIBERAL', local: true, provincial: true },
    { numero: '91', nombre: 'ESP. ABIERTO PARA EL DES. Y LA INT. SOCIAL', local: true, provincial: true },
    { numero: '959', nombre: 'MOVIMIENTO AVANZADA SOCIALISTA', local: false, provincial: true }, // NO USAR local
    { numero: '963', nombre: 'FRENTE PATRIOTA FEDERAL', local: false, provincial: true }, // NO USAR local
    { numero: '974', nombre: 'POLITICA OBRERA', local: true, provincial: true },
    { numero: '980', nombre: 'PARTIDO TIEMPO DE TODOS', local: false, provincial: true }, // NO USAR local
    { numero: '1003', nombre: 'CONSTRUYENDO PORVENIR', local: false, provincial: true }, // NO USAR local
    { numero: '1006', nombre: 'PARTIDO LIBERTARIO', local: true, provincial: true },
    { numero: '1008', nombre: 'VALORES REPUBLICANOS', local: false, provincial: true }, // NO USAR local
    { numero: '615', nombre: 'IDEAR PERGAMINO', local: true, provincial: false } // NO USAR provincial
  ];

  // Crear listas provinciales
  for (let i = 0; i < listasOficiales.length; i++) {
    const lista = listasOficiales[i];
    
    if (lista.provincial) {
      await prisma.lista.upsert({
        where: { 
          numero_tipo: {
            numero: lista.numero,
            tipo: 'PROVINCIAL'
          }
        },
        update: {},
        create: {
          numero: lista.numero,
          nombre: lista.nombre,
          tipo: 'PROVINCIAL',
          orden: i + 1,
          activa: true,
          habilitadaLocal: lista.local,
          habilitadaProvincial: lista.provincial
        }
      });
    }
  }

  console.log('✅ Listas provinciales creadas');

  // Crear listas locales (solo las habilitadas)
  for (let i = 0; i < listasOficiales.length; i++) {
    const lista = listasOficiales[i];
    
    if (lista.local) {
      await prisma.lista.upsert({
        where: { 
          numero_tipo: {
            numero: lista.numero,
            tipo: 'LOCAL'
          }
        },
        update: {},
        create: {
          numero: lista.numero,
          nombre: lista.nombre,
          tipo: 'LOCAL',
          orden: i + 1,
          activa: true,
          habilitadaLocal: lista.local,
          habilitadaProvincial: lista.provincial
        }
      });
    }
  }

  console.log('✅ Listas locales creadas');

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
    { clave: 'FECHA_ELECCION', valor: '2025-09-07' },
    { clave: 'MUNICIPIO', valor: 'Pergamino' },
    { clave: 'PROVINCIA', valor: 'Buenos Aires' },
    { clave: 'DISTRITO_ELECTORAL', valor: '087 - PERGAMINO' },
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
    
    // Cargar algunas mesas de ejemplo con datos realistas
    const mesasPrueba = [1, 2, 3];
    const listasLocalesCreadas = await prisma.lista.findMany({ 
      where: { tipo: 'LOCAL', activa: true } 
    });
    const listasProvincialesCreadas = await prisma.lista.findMany({ 
      where: { tipo: 'PROVINCIAL', activa: true } 
    });

    for (const numeroMesa of mesasPrueba) {
      const mesa = await prisma.mesa.findFirst({
        where: { numero: numeroMesa }
      });

      if (mesa) {
        // Simular datos realistas del acta
        const electoresVotaron = Math.floor(Math.random() * 50) + 200; // 200-250
        const sobresRecibidos = electoresVotaron - Math.floor(Math.random() * 5); // 0-4 sobres menos
        const diferencia = electoresVotaron - sobresRecibidos;
        
        const acta = await prisma.actaMesa.upsert({
          where: { mesaId: mesa.id },
          update: {
            electoresVotaron,
            sobresRecibidos,
            diferencia,
            votosEnBlanco: Math.floor(Math.random() * 5) + 1,
            votosImpugnados: Math.floor(Math.random() * 3),
            votosSobreNro3: Math.floor(Math.random() * 2),
            observaciones: 'Mesa de prueba con datos ficticios realistas',
            usuarioId: adminUser.id
          },
          create: {
            mesaId: mesa.id,
            electoresVotaron,
            sobresRecibidos,
            diferencia,
            votosEnBlanco: Math.floor(Math.random() * 5) + 1,
            votosImpugnados: Math.floor(Math.random() * 3),
            votosSobreNro3: Math.floor(Math.random() * 2),
            observaciones: 'Mesa de prueba con datos ficticios realistas',
            usuarioId: adminUser.id
          }
        });

        // Eliminar votos anteriores si existen
        await prisma.votoLista.deleteMany({
          where: { mesaId: mesa.id }
        });

        // Crear votos realistas que sumen exactamente sobresRecibidos
        let votosRestantesLocal = sobresRecibidos;
        let votosRestanteProv = sobresRecibidos;

        // Votos locales
        for (let i = 0; i < listasLocalesCreadas.length; i++) {
          const lista = listasLocalesCreadas[i];
          let votos;
          
          if (i === listasLocalesCreadas.length - 1) {
            // Última lista: asignar votos restantes
            votos = votosRestantesLocal;
          } else {
            // Distribución realista: más votos a primeras listas
            const maxVotos = Math.min(Math.floor(sobresRecibidos * 0.4), votosRestantesLocal);
            votos = Math.floor(Math.random() * maxVotos) + 5;
            votosRestantesLocal -= votos;
          }

          if (votos > 0) {
            await prisma.votoLista.create({
              data: {
                mesaId: mesa.id,
                listaId: lista.id,
                cantidad: votos
              }
            });
          }
        }

        // Votos provinciales (similar distribución)
        for (let i = 0; i < listasProvincialesCreadas.length; i++) {
          const lista = listasProvincialesCreadas[i];
          let votos;
          
          if (i === listasProvincialesCreadas.length - 1) {
            votos = votosRestanteProv;
          } else {
            const maxVotos = Math.min(Math.floor(sobresRecibidos * 0.3), votosRestanteProv);
            votos = Math.floor(Math.random() * maxVotos) + 3;
            votosRestanteProv -= votos;
          }

          if (votos > 0) {
            await prisma.votoLista.create({
              data: {
                mesaId: mesa.id,
                listaId: lista.id,
                cantidad: votos
              }
            });
          }
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

        console.log(`   Mesa ${numeroMesa} cargada con datos realistas (${sobresRecibidos} sobres)`);
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
  console.log('\n📊 Listas configuradas según acta oficial:');
  console.log('- 16 listas provinciales (15 habilitadas + 1 NO USAR)');
  console.log('- 9 listas locales habilitadas');
  console.log('- Numeración oficial: 2200-2208, 91, 615, 959, 963, 974, 980, 1003, 1006, 1008');
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