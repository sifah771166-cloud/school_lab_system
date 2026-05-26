-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "checkInTime" TIMESTAMP(3),
ADD COLUMN     "checkOutTime" TIMESTAMP(3),
ADD COLUMN     "labId" TEXT,
ADD COLUMN     "scheduleId" TEXT,
ALTER COLUMN "classTeaching" DROP NOT NULL,
ALTER COLUMN "date" DROP NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL,
ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "teacherName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "category" TEXT DEFAULT 'general',
ADD COLUMN     "condition" TEXT DEFAULT 'good';

-- AlterTable
ALTER TABLE "labs" ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_labId_fkey" FOREIGN KEY ("labId") REFERENCES "labs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
