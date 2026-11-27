-- Không suy đoán model từ tên thiết bị cũ. NULL yêu cầu người quản lý rà soát.
CREATE TABLE "mau_thiet_bi" (
  "id" TEXT NOT NULL,
  "maMau" TEXT NOT NULL,
  "tenMau" TEXT NOT NULL,
  "danhMucId" TEXT NOT NULL,
  CONSTRAINT "mau_thiet_bi_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "mau_thiet_bi_danhMucId_maMau_key" ON "mau_thiet_bi"("danhMucId", "maMau");
CREATE UNIQUE INDEX "mau_thiet_bi_id_danhMucId_key" ON "mau_thiet_bi"("id", "danhMucId");
ALTER TABLE "mau_thiet_bi" ADD CONSTRAINT "mau_thiet_bi_danhMucId_fkey"
  FOREIGN KEY ("danhMucId") REFERENCES "danh_muc_thiet_bi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "thiet_bi" ADD COLUMN "mauThietBiId" TEXT;
CREATE INDEX "thiet_bi_mauThietBiId_idx" ON "thiet_bi"("mauThietBiId");
ALTER TABLE "thiet_bi" ADD CONSTRAINT "thiet_bi_mauThietBiId_danhMucId_fkey"
  FOREIGN KEY ("mauThietBiId", "danhMucId") REFERENCES "mau_thiet_bi"("id", "danhMucId") ON DELETE NO ACTION ON UPDATE NO ACTION;
CREATE INDEX "nhat_ky_muon_tra_thietBiId_thoiGian_idx" ON "nhat_ky_muon_tra"("thietBiId", "thoiGian");
