import { SuCoVanHanh } from "../Components/SuCoVanHanh";
import { useXacThuc } from "../Contexts/XacThucContext";
import { CoQuyen } from "../Services/QuyenService";
import {
  AlertTriangle,
  ArrowLeft,
  ImagePlus,
  Printer,
  QrCode,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { TemInQR } from "../Components/TemInQR";
import { BieuMauSuCoVanHanh } from "../Components/BieuMauSuCoVanHanh";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { LayChiTietThietBi } from "../Services/ThietBiService";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import { TheoDoiCapNhatLich } from "../Services/SocketLichService";
import type { ThietBi } from "../Types/ThietBi";
import {
  LichSuMuonThietBi,
  LichThietBi,
  NhanTrangThaiThietBi,
} from "../Components/ThongKeVanHanh";
import {
  DinhDangGiaTriKyThuat,
  LaDuLieuKyThuatHienThi,
  LayNhanDuLieuKyThuat,
} from "../Utils/DuLieuKyThuat";

export function ChiTietThietBiInQR() {
  const { NguoiDung } = useXacThuc();
  const { id: Id } = useParams();
  const [ThietBi, SetThietBi] = useState<ThietBi>();
  const [Tab, SetTab] = useState<"thong-tin" | "qr">("thong-tin");
  const [Loi, SetLoi] = useState("");
  const [DangMoBaoSuCo, SetDangMoBaoSuCo] = useState(false);

  useEffect(() => {
    if (!Id) return;
    LayChiTietThietBi(Id)
      .then(SetThietBi)
      .catch((LoiTai) => SetLoi(LayThongBaoLoi(LoiTai)));
  }, [Id]);
  useEffect(
    () =>
      TheoDoiVanHanh(
        ["kho:xuat-kho", "kho:nhap-kho", "bao_tri:cap_nhat"],
        () => {
          if (Id)
            void LayChiTietThietBi(Id)
              .then(SetThietBi)
              .catch((LoiTai) => SetLoi(LayThongBaoLoi(LoiTai)));
        },
      ),
    [Id],
  );

  useEffect(
    () =>
      TheoDoiCapNhatLich(() => {
        if (Id)
          void LayChiTietThietBi(Id)
            .then(SetThietBi)
            .catch((LoiTai) => SetLoi(LayThongBaoLoi(LoiTai)));
      }),
    [Id],
  );
  if (Loi) {
    return (
      <section>
        <Link
          className="text-sm text-blueprint hover:underline"
          to="/kho-thiet-bi"
        >
          ← Quay lại kho thiết bị
        </Link>
        <div className="mt-5 rounded border border-tally/60 bg-tally/10 p-4 text-sm">
          {Loi}
        </div>
      </section>
    );
  }

  if (!ThietBi) {
    return <p className="py-12 text-center text-fog">Đang tải thiết bị…</p>;
  }

  function InMaQR() {
    window.print();
  }

  return (
    <section className="chi-tiet-thiet-bi">
      <style>{`
        .tem-in-qr-don { display: none; }
        @media print {
          @page { size: 40mm 40mm; margin: 0; }
          html, body { width: 40mm; height: 40mm; margin: 0 !important; overflow: hidden; }
          #root { display: none !important; }
          .tem-in-qr-don { display: block !important; position: fixed; inset: 0; box-sizing: border-box; width: 40mm; height: 40mm; overflow: hidden; }
          .tem-in-qr-don .tem-in-qr { box-sizing: border-box; width: 40mm; min-height: 40mm; border: 0 !important; }
        }
      `}</style>
      {createPortal(
        <div className="tem-in-qr-don">
          <TemInQR ThietBi={ThietBi} />
        </div>,
        document.body,
      )}
      <header className="no-print mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-sm text-blueprint hover:underline"
            to="/kho-thiet-bi"
          >
            <ArrowLeft size={16} />
            Quay lại kho thiết bị
          </Link>
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-blueprint">
            Kho thiết bị
          </p>
          <h1 className="mt-2 font-serif text-2xl md:text-3xl">
            {ThietBi.TenThietBi}
          </h1>
          <p className="mt-2 font-mono text-sm text-fog">{ThietBi.MaQR}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="flex min-h-11 items-center gap-2 rounded border border-rail px-4 text-sm font-semibold text-fog hover:bg-case-2 hover:text-paper"
            hidden={!CoQuyen(NguoiDung, "SuCo.Tao")}
            onClick={() => SetDangMoBaoSuCo(true)}
            type="button"
          >
            <AlertTriangle aria-hidden size={17} />
            Báo sự cố
          </button>
          <button
            className="flex min-h-11 items-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold"
            onClick={InMaQR}
            type="button"
          >
            <Printer aria-hidden size={17} />
            In tem decal
          </button>
        </div>
      </header>

      <div className="no-print mb-5 flex border-b border-rail">
        {[
          ["thong-tin", "Thông tin kỹ thuật"],
          ["qr", "Mã QR"],
        ].map(([GiaTri, Nhan]) => (
          <button
            className={`border-b-2 px-4 py-3 text-sm ${Tab === GiaTri ? "border-tally text-paper" : "border-transparent text-fog"}`}
            key={GiaTri}
            onClick={() => SetTab(GiaTri as "thong-tin" | "qr")}
            type="button"
          >
            {Nhan}
          </button>
        ))}
      </div>

      {Tab === "thong-tin" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="overflow-hidden rounded border border-rail bg-case">
            {ThietBi.HinhAnhUrl ? (
              <img
                alt={ThietBi.TenThietBi}
                className="h-72 w-full object-cover"
                src={ThietBi.HinhAnhUrl}
              />
            ) : (
              <div className="grid h-72 place-items-center bg-case-2 text-fog">
                <div className="text-center">
                  <ImagePlus className="mx-auto" size={36} />
                  <p className="mt-2 text-sm">Chưa có ảnh thiết bị</p>
                </div>
              </div>
            )}
          </div>
          <div className="rounded border border-rail bg-case p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-xl">Thông tin nhận diện</h2>
              <NhanTrangThaiThietBi
                TrangThai={ThietBi.TrangThaiHienThi}
                CanhBao={ThietBi.CanhBao}
              />
            </div>
            <p className="mt-3 text-sm text-fog">
              Dòng tài nguyên:{" "}
              {ThietBi.MauThietBi?.TenMau ?? "Chưa xác định dòng tài nguyên"}
            </p>
            {ThietBi.CanhBao?.map((CanhBao) => (
              <p className="mt-2 text-sm text-timecode" key={CanhBao}>
                {CanhBao}
              </p>
            ))}
            <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[11px] uppercase text-fog">
                  Mã QR
                </dt>
                <dd className="mt-1 text-sm">{ThietBi.MaQR}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase text-fog">
                  Số seri
                </dt>
                <dd className="mt-1 text-sm">{ThietBi.SoSeri}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase text-fog">
                  Danh mục
                </dt>
                <dd className="mt-1 text-sm">{ThietBi.DanhMuc.TenDanhMuc}</dd>
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
                  Kiểm tra sau sử dụng
                </dt>
                <dd className="mt-1 text-sm">
                  {ThietBi.ThoiGianKiemTraSauSuDungPhut} phút
                </dd>
              </div>
              {ThietBi.NguonThamKhaoUrl && (
                <div className="sm:col-span-2">
                  <dt className="font-mono text-[11px] uppercase text-fog">
                    Nguồn tham khảo
                  </dt>
                  <dd className="mt-1 break-all text-sm">
                    <a
                      className="text-blueprint hover:underline"
                      href={ThietBi.NguonThamKhaoUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Xem thông tin từ nhà sản xuất
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
          <div className="rounded border border-rail bg-case p-5 lg:col-span-2">
            <h2 className="font-serif text-xl">Thông số kỹ thuật</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(ThietBi.ThongSoKyThuat)
                .filter(([Ten, GiaTri]) => LaDuLieuKyThuatHienThi(Ten, GiaTri))
                .map(([Ten, GiaTri]) => (
                  <div
                    className="rounded border border-rail bg-case-2 p-3"
                    key={Ten}
                  >
                    <dt className="font-mono text-[11px] uppercase text-fog">
                      {LayNhanDuLieuKyThuat(Ten)}
                    </dt>
                    <dd className="mt-2 break-words text-sm">
                      {DinhDangGiaTriKyThuat(GiaTri)}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <aside className="no-print rounded border border-rail bg-case p-5">
            <div className="flex items-center gap-2">
              <QrCode className="text-blueprint" size={20} />
              <h2 className="font-serif text-xl">Mã QR thiết bị</h2>
            </div>
            <p className="mt-3 text-sm text-fog">
              Mã QR chỉ chứa mã thiết bị để tra cứu qua tuyến QR của hệ thống.
            </p>
            <p className="mt-4 text-xs text-fog">
              Tem được bố trí ở kích thước vật lý khoảng 4×4 cm.
            </p>
          </aside>
          <div className="rounded border border-rail bg-case-2 p-5">
            <p className="no-print mb-4 font-mono text-[11px] uppercase text-fog">
              Xem trước khi in
            </p>
            <div className="khu-vuc-xem-truoc">
              <div className="mx-auto w-40">
                <TemInQR ThietBi={ThietBi} />
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="no-print">
        <LichThietBi Id={ThietBi.Id} />
      </div>
      {CoQuyen(NguoiDung, "NhatKy.Xem") &&
        CoQuyen(NguoiDung, "ThietBi.Xem") && (
          <div className="no-print">
            <LichSuMuonThietBi Id={ThietBi.Id} />
          </div>
        )}
      {DangMoBaoSuCo ? (
        <BieuMauSuCoVanHanh
          OnDong={() => SetDangMoBaoSuCo(false)}
          OnThanhCong={() => {
            if (Id) void LayChiTietThietBi(Id).then(SetThietBi);
          }}
          ThietBiCoDinh={ThietBi}
        />
      ) : null}
      {ThietBi && <SuCoVanHanh ThietBiId={ThietBi.Id} />}
    </section>
  );
}
