-- AlterTable
ALTER TABLE "users" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "backup_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "backup_codes_code_key" ON "backup_codes"("code");

-- CreateIndex
CREATE INDEX "backup_codes_userId_idx" ON "backup_codes"("userId");

-- CreateIndex
CREATE INDEX "backup_codes_code_idx" ON "backup_codes"("code");

-- AddForeignKey
ALTER TABLE "backup_codes" ADD CONSTRAINT "backup_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
