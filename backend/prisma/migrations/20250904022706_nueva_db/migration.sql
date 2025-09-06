/*
  Warnings:

  - A unique constraint covering the columns `[nombre,tipo]` on the table `listas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `electoresVotaron` to the `actas_mesa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "actas_mesa" ADD COLUMN     "electoresVotaron" INTEGER NOT NULL,
ADD COLUMN     "votosEnBlanco" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "votosImpugnados" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "votosSobreNro3" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "listas_nombre_tipo_key" ON "listas"("nombre", "tipo");
