-- Bổ sung ràng buộc toàn vẹn cho các bảng thêm ở Chặng 2–3.
-- Không đổi dữ liệu nghiệp vụ, không đổi tên bảng/cột.
-- Khóa ngoại và CHECK được tạo NOT VALID để migration không thất bại trên
-- dữ liệu cũ; khối DO cuối file thử VALIDATE từng ràng buộc, ràng buộc nào
-- còn dữ liệu vi phạm sẽ giữ trạng thái NOT VALID và được báo bằng NOTICE.
-- Dùng Scripts/DoiSoatToanVenDuLieu.sql để tìm bản ghi vi phạm.

-- 1. Cột thời điểm tạo còn thiếu ở các bảng nghiệp vụ chính
ALTER TABLE "phong_studio" ADD COLUMN "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "thiet_bi"     ADD COLUMN "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ca_quay"      ADD COLUMN "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Chỉ mục cho các cột lọc thường xuyên
CREATE INDEX "ca_quay_duAnId_idx" ON "ca_quay"("duAnId");
CREATE INDEX "ca_quay_daoDienId_idx" ON "ca_quay"("daoDienId");
CREATE INDEX "su_co_van_hanh_thietBiId_idx" ON "su_co_van_hanh"("thietBiId");
CREATE INDEX "phien_quyet_dinh_caQuayId_trangThai_idx" ON "phien_quyet_dinh"("caQuayId", "trangThai");
CREATE INDEX "nhat_ky_loi_moi_loiMoiId_ngayTao_idx" ON "nhat_ky_loi_moi"("loiMoiId", "ngayTao");

-- 3. Khóa ngoại cho 14 cột tham chiếu chưa được bảo vệ. Hai cột cố ý để trống:
--    phien_quyet_dinh.suCoId (phiên trước ca lưu chuỗi rỗng) và
--    nhat_ky_cau_hinh_cho.nguoiSuaId (nhật ký giữ định danh người sửa kể cả
--    tài khoản quản trị hệ thống dùng trong kiểm thử, không ràng buộc vào nguoi_dung).
ALTER TABLE "su_co_van_hanh" ADD CONSTRAINT "su_co_van_hanh_donViId_fkey" FOREIGN KEY ("donViId") REFERENCES "don_vi"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "su_co_van_hanh" ADD CONSTRAINT "su_co_van_hanh_thietBiId_fkey" FOREIGN KEY ("thietBiId") REFERENCES "thiet_bi"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "su_co_van_hanh" ADD CONSTRAINT "su_co_van_hanh_nguoiBaoCaoId_fkey" FOREIGN KEY ("nguoiBaoCaoId") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "nhat_ky_su_co_van_hanh" ADD CONSTRAINT "nhat_ky_su_co_van_hanh_nguoiThucHienId_fkey" FOREIGN KEY ("nguoiThucHienId") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "lo_thay_the_thiet_bi" ADD CONSTRAINT "lo_thay_the_thiet_bi_nguoiPhuTrachId_fkey" FOREIGN KEY ("nguoiPhuTrachId") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "phien_quyet_dinh" ADD CONSTRAINT "phien_quyet_dinh_donViId_fkey" FOREIGN KEY ("donViId") REFERENCES "don_vi"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "phien_quyet_dinh" ADD CONSTRAINT "phien_quyet_dinh_nguoiTaoId_fkey" FOREIGN KEY ("nguoiTaoId") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "giu_cho_tai_nguyen" ADD CONSTRAINT "giu_cho_tai_nguyen_donViId_fkey" FOREIGN KEY ("donViId") REFERENCES "don_vi"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "loi_moi_thay_ca" ADD CONSTRAINT "loi_moi_thay_ca_donViId_fkey" FOREIGN KEY ("donViId") REFERENCES "don_vi"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "loi_moi_thay_ca" ADD CONSTRAINT "loi_moi_thay_ca_nguoiNhanId_fkey" FOREIGN KEY ("nguoiNhanId") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "loi_moi_thay_ca" ADD CONSTRAINT "loi_moi_thay_ca_nguoiGuiId_fkey" FOREIGN KEY ("nguoiGuiId") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "loi_moi_thay_ca" ADD CONSTRAINT "loi_moi_thay_ca_nguoiCuId_fkey" FOREIGN KEY ("nguoiCuId") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "nhat_ky_loi_moi" ADD CONSTRAINT "nhat_ky_loi_moi_nguoiThucHienId_fkey" FOREIGN KEY ("nguoiThucHienId") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "nhat_ky_cau_hinh_cho" ADD CONSTRAINT "nhat_ky_cau_hinh_cho_phanHe_fkey" FOREIGN KEY ("phanHe") REFERENCES "cau_hinh_thoi_gian_cho"("phanHe") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- 4. Ràng buộc miền giá trị (Prisma không mô tả được CHECK nên chỉ có ở SQL)
ALTER TABLE "ca_quay" ADD CONSTRAINT "ca_quay_khoang_thoi_gian_check" CHECK ("thoiGianKetThuc" > "thoiGianBatDau") NOT VALID;
ALTER TABLE "ca_quay" ADD CONSTRAINT "ca_quay_muc_do_uu_tien_check" CHECK ("mucDoUuTien" BETWEEN 0 AND 100) NOT VALID;
ALTER TABLE "ca_quay" ADD CONSTRAINT "ca_quay_thoi_gian_dem_check" CHECK ("thoiGianChuanBiPhut" >= 0 AND "thoiGianThuHoiPhut" >= 0) NOT VALID;
ALTER TABLE "ca_quay_thiet_bi" ADD CONSTRAINT "ca_quay_thiet_bi_hieu_luc_check" CHECK ("hieuLucDen" IS NULL OR "hieuLucTu" IS NULL OR "hieuLucDen" > "hieuLucTu") NOT VALID;
ALTER TABLE "ca_quay_nhan_su" ADD CONSTRAINT "ca_quay_nhan_su_hieu_luc_check" CHECK ("hieuLucDen" IS NULL OR "hieuLucTu" IS NULL OR "hieuLucDen" > "hieuLucTu") NOT VALID;
ALTER TABLE "ca_quay_thiet_bi" ADD CONSTRAINT "ca_quay_thiet_bi_moc_kho_check" CHECK ("thoiGianNhapKho" IS NULL OR "thoiGianXuatKho" IS NULL OR "thoiGianNhapKho" >= "thoiGianXuatKho") NOT VALID;
ALTER TABLE "giu_cho_tai_nguyen" ADD CONSTRAINT "giu_cho_tai_nguyen_khoang_check" CHECK ("ketThuc" > "batDau") NOT VALID;
ALTER TABLE "thiet_bi" ADD CONSTRAINT "thiet_bi_kiem_tra_sau_su_dung_check" CHECK ("thoiGianKiemTraSauSuDungPhut" >= 0) NOT VALID;
ALTER TABLE "phong_studio" ADD CONSTRAINT "phong_studio_suc_chua_check" CHECK ("sucChua" IS NULL OR "sucChua" > 0) NOT VALID;
ALTER TABLE "kho" ADD CONSTRAINT "kho_toa_do_check" CHECK ("viDo" BETWEEN -90 AND 90 AND "kinhDo" BETWEEN -180 AND 180 AND "banKinhXacMinhMet" > 0) NOT VALID;
ALTER TABLE "giao_dich_kho" ADD CONSTRAINT "giao_dich_kho_gps_check" CHECK ("viDoGhiNhan" BETWEEN -90 AND 90 AND "kinhDoGhiNhan" BETWEEN -180 AND 180 AND "doChinhXacMet" >= 0 AND "khoangCachDenKhoMet" >= 0) NOT VALID;
ALTER TABLE "cau_hinh_thoi_gian_cho" ADD CONSTRAINT "cau_hinh_thoi_gian_cho_so_phut_check" CHECK ("soPhut" BETWEEN 1 AND 120) NOT VALID;
ALTER TABLE "su_co_bao_tri" ADD CONSTRAINT "su_co_bao_tri_moc_thoi_gian_check" CHECK (("ngayBatDauXuLy" IS NULL OR "ngayBatDauXuLy" >= "ngayTao") AND ("ngayHoanTat" IS NULL OR "ngayHoanTat" >= "ngayTao")) NOT VALID;
-- Các cột trạng thái kiểu chuỗi: chỉ cho phép đúng tập giá trị mã nguồn đang ghi
ALTER TABLE "phien_quyet_dinh" ADD CONSTRAINT "phien_quyet_dinh_trang_thai_check" CHECK ("trangThai" IN ('MO', 'DA_CHOT', 'DA_HUY', 'HET_HAN')) NOT VALID;
ALTER TABLE "giu_cho_tai_nguyen" ADD CONSTRAINT "giu_cho_tai_nguyen_trang_thai_check" CHECK ("trangThai" IN ('MO', 'DA_CHOT', 'DA_HUY', 'HET_HAN')) NOT VALID;
ALTER TABLE "loi_moi_thay_ca" ADD CONSTRAINT "loi_moi_thay_ca_trang_thai_check" CHECK ("trangThai" IN ('CHO_PHAN_HOI', 'DA_DONG_Y', 'DA_TU_CHOI', 'DA_HUY', 'HET_HAN', 'DA_PHAN_CONG')) NOT VALID;
ALTER TABLE "nhat_ky_loi_moi" ADD CONSTRAINT "nhat_ky_loi_moi_trang_thai_check" CHECK ("trangThai" IN ('CHO_PHAN_HOI', 'DA_DONG_Y', 'DA_TU_CHOI', 'RUT_DONG_Y', 'DA_HUY', 'HET_HAN', 'DA_PHAN_CONG')) NOT VALID;

-- 5. Thử xác thực dữ liệu cũ; ràng buộc nào còn vi phạm vẫn chặn dữ liệu mới
DO $$
DECLARE
  RangBuoc RECORD;
BEGIN
  FOR RangBuoc IN
    SELECT c.conrelid::regclass::text AS bang, c.conname AS ten
    FROM pg_constraint c
    WHERE NOT c.convalidated
      AND c.connamespace = current_schema()::regnamespace
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %s VALIDATE CONSTRAINT %I', RangBuoc.bang, RangBuoc.ten);
    EXCEPTION WHEN check_violation OR foreign_key_violation THEN
      RAISE NOTICE 'Ràng buộc % trên bảng % còn dữ liệu cũ vi phạm, giữ NOT VALID', RangBuoc.ten, RangBuoc.bang;
    END;
  END LOOP;
END $$;
