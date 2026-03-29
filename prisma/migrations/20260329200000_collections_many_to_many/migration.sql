-- CreateTable
CREATE TABLE "_CollectionToItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CollectionToItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CollectionToItem_B_index" ON "_CollectionToItem"("B");

-- AddForeignKey
ALTER TABLE "_CollectionToItem" ADD CONSTRAINT "_CollectionToItem_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionToItem" ADD CONSTRAINT "_CollectionToItem_B_fkey" FOREIGN KEY ("B") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData: copy existing collectionId relationships to junction table
INSERT INTO "_CollectionToItem" ("A", "B")
SELECT "collectionId", "id" FROM "Item" WHERE "collectionId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_collectionId_fkey";

-- DropIndex
DROP INDEX "Item_collectionId_idx";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "collectionId";
