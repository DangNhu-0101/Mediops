-- Trần 1440 phút (24 giờ) cho mỗi loại đệm thời gian.
-- Bộ phát hiện xung đột dựa vào trần này để lọc thô theo giờ ngay trong SQL
-- (ThuatToanXungDotService.ts, DieuKienCaTrongCuaSo). Vì vậy ràng buộc phải được VALIDATE:
-- nếu dữ liệu cũ có đệm vượt 24 giờ, migration dừng lại để sửa dữ liệu trước,
-- thay vì để bộ phát hiện bỏ sót ca.
ALTER TABLE "ca_quay" ADD CONSTRAINT "ca_quay_thoi_gian_dem_tran_check"
  CHECK ("thoiGianChuanBiPhut" <= 1440 AND "thoiGianThuHoiPhut" <= 1440) NOT VALID;
ALTER TABLE "ca_quay" VALIDATE CONSTRAINT "ca_quay_thoi_gian_dem_tran_check";

ALTER TABLE "thiet_bi" ADD CONSTRAINT "thiet_bi_kiem_tra_sau_su_dung_tran_check"
  CHECK ("thoiGianKiemTraSauSuDungPhut" <= 1440) NOT VALID;
ALTER TABLE "thiet_bi" VALIDATE CONSTRAINT "thiet_bi_kiem_tra_sau_su_dung_tran_check";
