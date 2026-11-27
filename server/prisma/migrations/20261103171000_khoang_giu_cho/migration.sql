DROP INDEX "giu_cho_tai_nguyen_phienId_loai_taiNguyenId_key";
CREATE UNIQUE INDEX "giu_cho_phien_tai_nguyen_khoang_key" ON "giu_cho_tai_nguyen" ("phienId", "loai", "taiNguyenId", "batDau", "ketThuc");
