import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    ['ADMINISTRADOR', 'Administrador', 'Gestiona la configuracion general de Gradia'],
    ['DOCENTE', 'Docente', 'Gestiona actividades y calificaciones asignadas'],
    ['ESTUDIANTE', 'Estudiante', 'Consulta calificaciones y boletines publicados']
  ] as const;

  for (const [codigo, nombre, descripcion] of roles) {
    await prisma.rol.upsert({
      where: { codigo },
      update: { nombre, descripcion, estado: true },
      create: { codigo, nombre, descripcion }
    });
  }

  const niveles = [
    { nombre: 'Basica primaria', orden: 1 },
    { nombre: 'Basica secundaria', orden: 2 },
    { nombre: 'Educacion media', orden: 3 }
  ];

  for (const nivel of niveles) {
    await prisma.nivelEducativo.upsert({
      where: { nombre: nivel.nombre },
      update: { orden: nivel.orden, estado: true },
      create: nivel
    });
  }

  const nivelesPorNombre = Object.fromEntries(
    (await prisma.nivelEducativo.findMany()).map((nivel) => [nivel.nombre, nivel.id])
  );

  const grados = [
    ['Primero', 1, 'Basica primaria'],
    ['Segundo', 2, 'Basica primaria'],
    ['Tercero', 3, 'Basica primaria'],
    ['Cuarto', 4, 'Basica primaria'],
    ['Quinto', 5, 'Basica primaria'],
    ['Sexto', 6, 'Basica secundaria'],
    ['Septimo', 7, 'Basica secundaria'],
    ['Octavo', 8, 'Basica secundaria'],
    ['Noveno', 9, 'Basica secundaria'],
    ['Decimo', 10, 'Educacion media'],
    ['Undecimo', 11, 'Educacion media']
  ] as const;

  for (const [nombre, numeroGrado, nivel] of grados) {
    await prisma.grado.upsert({
      where: { numeroGrado },
      update: {
        nombre,
        orden: numeroGrado,
        idNivelEducativo: nivelesPorNombre[nivel],
        estado: true
      },
      create: {
        nombre,
        numeroGrado,
        orden: numeroGrado,
        idNivelEducativo: nivelesPorNombre[nivel]
      }
    });
  }

  const areas = [
    ['MAT', 'Matematicas'],
    ['CNA', 'Ciencias Naturales'],
    ['HUM', 'Humanidades'],
    ['CSO', 'Ciencias Sociales'],
    ['EAR', 'Educacion Artistica'],
    ['EFI', 'Educacion Fisica'],
    ['TIN', 'Tecnologia e Informatica']
  ] as const;

  for (const [codigo, nombre] of areas) {
    await prisma.areaAcademica.upsert({
      where: { codigo },
      update: { nombre, estado: true },
      create: { codigo, nombre }
    });
  }

  const areaMatematicas = await prisma.areaAcademica.findUniqueOrThrow({ where: { codigo: 'MAT' } });
  const areaCiencias = await prisma.areaAcademica.findUniqueOrThrow({ where: { codigo: 'CNA' } });

  const asignaturas = [
    ['MAT-GEN', 'Matematicas', areaMatematicas.id],
    ['ARI', 'Aritmetica', areaMatematicas.id],
    ['GEO', 'Geometria', areaMatematicas.id],
    ['EST', 'Estadistica', areaMatematicas.id],
    ['TRI', 'Trigonometria', areaMatematicas.id],
    ['CAL', 'Calculo', areaMatematicas.id],
    ['CNA-GEN', 'Ciencias Naturales', areaCiencias.id],
    ['BIO', 'Biologia', areaCiencias.id],
    ['QUI', 'Quimica', areaCiencias.id],
    ['FIS', 'Fisica', areaCiencias.id]
  ] as const;

  for (const [codigo, nombre, idAreaAcademica] of asignaturas) {
    await prisma.asignatura.upsert({
      where: { codigo },
      update: { nombre, idAreaAcademica, estado: true },
      create: { codigo, nombre, idAreaAcademica }
    });
  }

  const variablesAdministrador = z
    .object({
      correo: z.string().email().optional(),
      contrasena: z.string().min(12).optional()
    })
    .superRefine((datos, contexto) => {
      if ((datos.correo === undefined) !== (datos.contrasena === undefined)) {
        contexto.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ADMIN_INICIAL_CORREO y ADMIN_INICIAL_CONTRASENA deben definirse juntos'
        });
      }
    })
    .parse({
      correo: process.env.ADMIN_INICIAL_CORREO || undefined,
      contrasena: process.env.ADMIN_INICIAL_CONTRASENA || undefined
    });

  if (variablesAdministrador.correo && variablesAdministrador.contrasena) {
    const rolAdministrador = await prisma.rol.findUniqueOrThrow({ where: { codigo: 'ADMINISTRADOR' } });
    const costoBcrypt = z.coerce.number().int().min(10).max(14).default(12).parse(process.env.BCRYPT_COSTO);
    const contrasenaHash = await bcrypt.hash(variablesAdministrador.contrasena, costoBcrypt);

    await prisma.usuario.upsert({
      where: { numeroDocumento: 'ADMIN-GRADIA' },
      update: {
        idRol: rolAdministrador.id,
        correo: variablesAdministrador.correo,
        contrasenaHash,
        debeCambiarContrasena: true,
        contrasenaActualizadaEn: null,
        intentosFallidos: 0,
        bloqueadoHasta: null,
        estado: true
      },
      create: {
        idRol: rolAdministrador.id,
        nombres: 'Administrador',
        apellidos: 'Gradia',
        tipoDocumento: 'NIT',
        numeroDocumento: 'ADMIN-GRADIA',
        correo: variablesAdministrador.correo,
        contrasenaHash,
        debeCambiarContrasena: true,
        intentosFallidos: 0,
        bloqueadoHasta: null
      }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
