-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#5B4FCF',
ADD COLUMN     "emoji" TEXT NOT NULL DEFAULT '🚀';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
