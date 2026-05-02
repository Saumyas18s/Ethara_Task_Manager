-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "team_id" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "parent_id" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar_url" TEXT;

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_code_key" ON "Team"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_team_id_user_id_key" ON "TeamMember"("team_id", "user_id");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
