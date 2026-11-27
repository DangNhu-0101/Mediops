import { SuCoVanHanh } from "../Components/SuCoVanHanh";
import { useXacThuc } from "../Contexts/XacThucContext";
import { CoQuyen } from "../Services/QuyenService";
import { AlertTriangle, ExternalLink, ImagePlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { BieuMauSuCoVanHanh } from "../Components/BieuMauSuCoVanHanh";
import { TrinhQuetQR } from "../Components/TrinhQuetQR";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import { TheoDoiCapNhatLich } from "../Services/SocketLichService";
import { TraCuuThietBiTheoQR } from "../Services/ThietBiService";
import type { ThietBi } from "../Types/ThietBi";
import { NhanTrangThaiThietBi } from "../Components/ThongKeVanHanh";
import {
  DinhDangGiaTriKyThuat,
  LaDuLieuKyThuatHienThi,
  LayNhanDuLieuKyThuat,
} from "../Utils/DuLieuKyThuat";

export function TraCuuNhanhQR() {
  const { NguoiDung } = useXacThuc();
  const { maQR: MaQR } = useParams();
  const ChuyenTrang = useNavigate();
  const [ThietBi, SetThietBi] = useState<ThietBi>();
  const [DangTai, SetDangTai] = useState(Boolean(MaQR));
  const [Loi, SetLoi] = useState("");
  const [DangMoBaoSuCo, SetDangMoBaoSuCo] = useState(false);

  const TraCuu = useCallback(async (MaGoc: string, HienThiLoi = true) => {
    const MaDaChuanHoa = MaGoc.trim();
    if (!MaDaChuanHoa) {
      SetThietBi(undefined);
      SetLoi("Vui lòng nhập mã QR.");
      return;
    }
    SetDangTai(true);
    SetLoi("");
    try {
      SetThietBi(await TraCuuThietBiTheoQR(MaDaChuanHoa));
    } catch (LoiTraCuu) {
      SetThietBi(undefined);
      if (HienThiLoi) SetLoi(LayThongBaoLoi(LoiTraCuu));
      throw LoiTraCuu;
    } finally {
      SetDangTai(false);
    }
  }, []);

  useEffect(() => {
    if (MaQR) void TraCuu(MaQR).catch(() => undefined);
  }, [MaQR, TraCuu]);

  useEffect(
    () =>
      TheoDoiVanHanh(
        ["kho:xuat-kho", "kho:nhap-kho", "bao_tri:cap_nhat"],
        (DuLieu) => {
          if (
            ThietBi &&
            (!DuLieu?.ThietBiId || DuLieu.ThietBiId === ThietBi.Id)
          ) {
            void TraCuu(ThietBi.MaQR).catch(() => undefined);
          }
        },
      ),
    [ThietBi, TraCuu],
  );

  useEffect(
    () =>
      TheoDoiCapNhatLich(() => {
        if (ThietBi) void TraCuu(ThietBi.MaQR).catch(() => undefined);
      }),
    [ThietBi, TraCuu],
  );
  const CanhBaoVanHanh = ThietBi?.CanhBao?.length
    ? {
        NoiDung: ThietBi.CanhBao.join(". "),
        Lop: "border-timecode/50 bg-timecode/10",
        BieuTuong: AlertTriangle,
      }
    : undefined;
  const BieuTuongCanhBao = CanhBaoVanHanh?.BieuTuong;

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 md:p-8">
      <header>
        <h1 className="font-serif text-2xl md:text-3xl">Tra cứu thiết bị</h1>
        <p className="mt-2 text-sm text-fog">
          Quét hoặc nhập mã trên tem để xem thông tin thiết bị trong đơn vị của
          bạn.
        </p>
      </header>
      <TrinhQuetQR OnTraCuu={async (Ma) => TraCuu(Ma, false)} />
      {DangTai ? (
        <p className="py-12 text-center text-fog">Đang tra cứu thiết bị…</p>
      ) : Loi ? (
        <div className="mt-5 rounded border border-tally/60 bg-tally/10 p-4 text-sm">
          {Loi}
        </div>
      ) : ThietBi ? (
        <article className="mt-6 overflow-hidden rounded border border-rail bg-case">
          {ThietBi.HinhAnhUrl ? (
            <img
              alt={ThietBi.TenThietBi}
              className="h-56 w-full object-cover"
              src={ThietBi.HinhAnhUrl}
            />
          ) : (
            <div className="grid h-40 place-items-center bg-case-2 text-fog">
              <ImagePlus size={32} />
            </div>
          )}
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words font-serif text-xl">
                  {ThietBi.TenThietBi}
                </h2>
                <p className="mt-1 break-all font-mono text-xs text-fog">
                  {ThietBi.MaQR}
                </p>
              </div>
              <NhanTrangThaiThietBi
                TrangThai={ThietBi.TrangThaiHienThi}
                CanhBao={ThietBi.CanhBao}
              />
            </div>
            {CanhBaoVanHanh && BieuTuongCanhBao ? (
              <p
                className={`mt-4 flex gap-2 rounded border p-3 text-sm leading-6 ${CanhBaoVanHanh.Lop}`}
              >
                <BieuTuongCanhBao
                  aria-hidden
                  className="mt-0.5 shrink-0"
                  size={18}
                />
                {CanhBaoVanHanh.NoiDung}
              </p>
            ) : null}
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[11px] uppercase text-fog">
                  Danh mục
                </dt>
                <dd className="mt-1 text-sm">{ThietBi.DanhMuc.TenDanhMuc}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase text-fog">
                  Trạng thái
                </dt>
                <dd className="mt-1 text-sm">
                  <NhanTrangThaiThietBi
                    TrangThai={ThietBi.TrangThaiHienThi}
                    CanhBao={ThietBi.CanhBao}
                  />
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase text-fog">
                  Kho quản lý và vị trí hiện tại
                </dt>
                <dd className="mt-1 text-sm">
                  {ThietBi.Kho?.TenKho ?? "Chưa gán kho"}
                  <span className="mt-1 block text-xs text-fog">
                    {ThietBi.ViTriThucTe === "NGOAI_KHO"
                      ? "Đã xuất · chưa nhập kho"
                      : ThietBi.ViTriThucTe === "TAI_KHO"
                        ? `Đang tại kho${ThietBi.ViTriKho ? ` · ${ThietBi.ViTriKho}` : ""}`
                        : "Chưa xác minh vị trí thực tế"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase text-fog">
                  Số seri
                </dt>
                <dd className="mt-1 text-sm">{ThietBi.SoSeri}</dd>
              </div>
            </dl>
            <div className="mt-5 border-t border-rail pt-4">
              <h3 className="font-semibold">Thông số kỹ thuật</h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                {Object.entries(ThietBi.ThongSoKyThuat)
                  .filter(([Ten, GiaTri]) =>
                    LaDuLieuKyThuatHienThi(Ten, GiaTri),
                  )
                  .map(([Ten, GiaTri]) => (
                    <div
                      className="rounded border border-rail bg-case-2 p-3"
                      key={Ten}
                    >
                      <dt className="font-mono text-[11px] uppercase text-fog">
                        {LayNhanDuLieuKyThuat(Ten)}
                      </dt>
                      <dd className="mt-1 break-words text-sm">
                        {DinhDangGiaTriKyThuat(GiaTri)}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
            <button
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded border border-rail px-4 text-sm font-semibold"
              onClick={() => ChuyenTrang(`/thiet-bi/${ThietBi.Id}`)}
              type="button"
            >
              <ExternalLink aria-hidden size={18} /> Xem chi tiết thiết bị
            </button>
            <button
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold text-white"
              hidden={!CoQuyen(NguoiDung, "SuCo.Tao")}
              onClick={() => SetDangMoBaoSuCo(true)}
              type="button"
            >
              <AlertTriangle aria-hidden size={18} /> Báo cáo sự cố thiết bị
            </button>
          </div>
        </article>
      ) : null}
      {DangMoBaoSuCo && ThietBi ? (
        <BieuMauSuCoVanHanh
          OnDong={() => SetDangMoBaoSuCo(false)}
          OnThanhCong={() => {
            void TraCuuThietBiTheoQR(ThietBi.MaQR).then(SetThietBi);
          }}
          ThietBiCoDinh={ThietBi}
        />
      ) : null}
      {ThietBi && <SuCoVanHanh ThietBiId={ThietBi.Id} />}
    </main>
  );
}
