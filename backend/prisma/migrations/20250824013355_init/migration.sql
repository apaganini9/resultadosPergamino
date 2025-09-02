-- CreateEnum
CREATE TYPE "public"."RolUsuario" AS ENUM ('ADMIN', 'OPERADOR', 'CONSULTOR');

-- CreateEnum
CREATE TYPE "public"."TipoLista" AS ENUM ('LOCAL', 'PROVINCIAL');

-- CreateEnum
CREATE TYPE "public"."EstadoMesa" AS ENUM ('PENDIENTE', 'CARGADA', 'VALIDADA');

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "public"."RolUsuario" NOT NULL DEFAULT 'OPERADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."listas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "public"."TipoLista" NOT NULL,
    "orden" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "listas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mesas" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "ubicacion" TEXT,
    "estado" "public"."EstadoMesa" NOT NULL DEFAULT 'PENDIENTE',
    "fechaCarga" TIMESTAMP(3),
    "usuarioCarga" INTEGER,

    CONSTRAINT "mesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."actas_mesa" (
    "id" SERIAL NOT NULL,
    "mesaId" INTEGER NOT NULL,
    "sobresRecibidos" INTEGER NOT NULL,
    "observaciones" TEXT,
    "fechaCarga" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "actas_mesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."votos_lista" (
    "id" SERIAL NOT NULL,
    "mesaId" INTEGER NOT NULL,
    "listaId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "votos_lista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."configuracion_sistema" (
    "id" SERIAL NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mesas_numero_key" ON "public"."mesas"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "actas_mesa_mesaId_key" ON "public"."actas_mesa"("mesaId");

-- CreateIndex
CREATE UNIQUE INDEX "votos_lista_mesaId_listaId_key" ON "public"."votos_lista"("mesaId", "listaId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_sistema_clave_key" ON "public"."configuracion_sistema"("clave");

-- AddForeignKey
ALTER TABLE "public"."actas_mesa" ADD CONSTRAINT "actas_mesa_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "public"."mesas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."actas_mesa" ADD CONSTRAINT "actas_mesa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."votos_lista" ADD CONSTRAINT "votos_lista_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "public"."mesas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."votos_lista" ADD CONSTRAINT "votos_lista_listaId_fkey" FOREIGN KEY ("listaId") REFERENCES "public"."listas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
