import type { YeuCauHienThi } from "../Types/DuLieuNhung";
import {
  ChuyenThanhCapDuLieu,
  LayNhanDuLieuKyThuat,
} from "../Utils/DuLieuKyThuat";

export function ThongTinYeuCauTaiNguyen({
  DanhSach,
}: {
  DanhSach: YeuCauHienThi[];
}) {
  const Nhan = { THIET_BI: "Thiết bị", NHAN_SU: "Nhân sự", STUDIO: "Studio" };
  return (
    <article className="rounded border border-rail bg-case p-5">
      <h2 className="font-semibold">Yêu cầu tài nguyên</h2>
      {!DanhSach.length ? (
        <p className="mt-3 text-sm text-fog">
          Chưa có yêu cầu riêng cho ca quay.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-rail">
          {DanhSach.map((Muc) => (
            <li key={Muc.Id} className="space-y-2 py-3 text-sm">
              <h3 className="font-medium">
                {Nhan[Muc.LoaiTaiNguyen]} · {Muc.SoLuong}
                {Muc.TenDanhMuc ? ` · ${Muc.TenDanhMuc}` : ""}
              </h3>
              <p className="text-fog">
                {Muc.BatBuoc ? "Bắt buộc" : "Ưu tiên"} · Mức ưu tiên{" "}
                {Muc.TrongSo}/100
              </p>
              {Muc.TenChucDanh && <p>Chức danh: {Muc.TenChucDanh}</p>}
              {Muc.TenThietBiUuTien && (
                <p>
                  Thiết bị ưu tiên: {Muc.TenThietBiUuTien} ·{" "}
                  {Muc.ChoPhepThayThe
                    ? "Cho phép thay thế"
                    : "Giữ đúng thiết bị"}
                </p>
              )}
              {(
                [
                  ["Điều kiện tối thiểu", Muc.ThongSoToiThieu],
                  ["Tiêu chí ưu tiên", Muc.ThongSoUuTien],
                ] as const
              ).map(([Ten, DuLieu]) => {
                const CacMuc = ChuyenThanhCapDuLieu(DuLieu ?? {});
                return CacMuc.length ? (
                  <div key={Ten}>
                    <p className="font-medium">{Ten}</p>
                    <ul className="mt-1 space-y-1 text-fog">
                      {CacMuc.map((Cap) => (
                        <li className="break-words" key={Cap.Khoa}>
                          {LayNhanDuLieuKyThuat(Cap.Khoa)}: {Cap.GiaTri}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
