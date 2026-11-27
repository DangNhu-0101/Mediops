import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useXacThuc } from "../Contexts/XacThucContext";
import { CoQuyen } from "../Services/QuyenService";
import { LayMucDoMuon } from "../Services/ThongKeVanHanhService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import {
  LocMacDinh,
  type MucDoMuon,
  type ThietBiThongKe,
} from "../Types/ThongKeVanHanh";
import { DinhDangGio, LoiThongKe } from "./ThongKeVanHanh";

export function ThanhTabQuanLy({
  CacTab,
  DangChon,
  OnChon,
}: {
  CacTab: readonly string[];
  DangChon: string;
  OnChon: (Ten: string) => void;
}) {
  return (
    <nav
      aria-label="Chuyển nội dung quản lý"
      className="flex gap-1 overflow-x-auto border-b border-rail"
    >
      {CacTab.map((Ten) => (
        <button
          key={Ten}
          type="button"
          aria-current={DangChon === Ten ? "page" : undefined}
          className={`min-h-11 shrink-0 border-b-2 px-4 text-sm font-semibold ${DangChon === Ten ? "border-blueprint text-paper" : "border-transparent text-fog hover:bg-case hover:text-paper"}`}
          onClick={() => OnChon(Ten)}
        >
          {Ten}
        </button>
      ))}
    </nav>
  );
}
export function TheLocQuanLy({
  Nhan,
  GiaTri,
  LuaChon,
  OnChon,
}: {
  Nhan: string;
  GiaTri: string;
  LuaChon: Array<{ Id: string; Ten: string }>;
  OnChon: (Id: string) => void;
}) {
  const [MoRong, SetMoRong] = useState(false);
  const [Tim, SetTim] = useState("");
  const CacThe = LuaChon.filter(
    (Muc) =>
      !MoRong ||
      Muc.Ten.toLocaleLowerCase("vi").includes(Tim.toLocaleLowerCase("vi")),
  );
  const HienThi = MoRong
    ? CacThe
    : CacThe.filter((Muc, So) => So < 6 || Muc.Id === GiaTri);
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-xs text-fog">{Nhan}</legend>
      {MoRong && (
        <input
          aria-label={`Tìm ${Nhan.toLocaleLowerCase("vi")}`}
          className="mb-2 min-h-11 w-full rounded border border-rail bg-case px-3 text-sm"
          placeholder={`Tìm ${Nhan.toLocaleLowerCase("vi")}…`}
          value={Tim}
          onChange={(E) => SetTim(E.target.value)}
        />
      )}
      <div className={`flex gap-2 ${MoRong ? "flex-wrap" : "overflow-x-auto"}`}>
        {[{ Id: "", Ten: "Tất cả" }, ...HienThi].map((Muc) => (
          <button
            type="button"
            aria-pressed={GiaTri === Muc.Id}
            key={Muc.Id}
            onClick={() => OnChon(Muc.Id)}
            className={`min-h-11 shrink-0 rounded border px-3 text-sm ${GiaTri === Muc.Id ? "border-blueprint bg-blueprint/20 text-paper" : "border-rail text-fog hover:text-paper"}`}
          >
            {Muc.Ten}
          </button>
        ))}
        {LuaChon.length > 6 && (
          <button
            type="button"
            aria-expanded={MoRong}
            onClick={() => SetMoRong(!MoRong)}
            className="min-h-11 shrink-0 px-3 text-sm text-blueprint"
          >
            {MoRong ? "Thu gọn" : `Xem thêm (${LuaChon.length})`}
          </button>
        )}
      </div>
    </fieldset>
  );
}
export function ViTriThietBi({ May }: { May: ThietBiThongKe }) {
  const { NguoiDung } = useXacThuc();
  return (
    <div className="mt-3 space-y-1 text-sm text-fog">
      <p>
        Kho quản lý:{" "}
        {May.KhoId && CoQuyen(NguoiDung, "Kho.Xem") ? (
          <Link
            className="text-blueprint hover:underline"
            to={`/kho/${May.KhoId}`}
          >
            {May.TenKho}
          </Link>
        ) : (
          (May.TenKho ?? "Chưa gán kho")
        )}
      </p>
      <p
        className={
          May.ViTriThucTe === "NGOAI_KHO" ? "text-blueprint" : undefined
        }
      >
        {May.ViTriThucTe === "NGOAI_KHO"
          ? "Đã xuất · chưa nhập kho"
          : May.ViTriThucTe === "TAI_KHO"
            ? `Đang tại kho${May.ViTriKho ? ` · ${May.ViTriKho}` : " · chưa ghi vị trí kệ/tủ"}`
            : "Chưa xác minh vị trí thực tế"}
      </p>
      {May.CaDangGiu.map((Ca) => (
        <Link
          key={Ca.Id}
          className="block min-h-11 py-3 text-blueprint hover:underline"
          to={`/ca-quay/${Ca.Id}`}
        >
          Ca đang giữ: {Ca.TieuDe}
        </Link>
      ))}
    </div>
  );
}
export function ThietBiMuonNhieu({
  KhoId,
  DanhMucId,
  MauThietBiId,
}: {
  KhoId?: string;
  DanhMucId?: string;
  MauThietBiId?: string;
}) {
  const [DuLieu, SetDuLieu] = useState<MucDoMuon>();
  const [SapXep, SetSapXep] = useState<"LUOT_MUON" | "GIO_NGOAI_KHO">(
    "LUOT_MUON",
  );
  const [Loi, SetLoi] = useState("");
  const [LanTai, SetLanTai] = useState(0);
  const [DangTai, SetDangTai] = useState(true);
  useEffect(() => {
    let HieuLuc = true;
    SetDangTai(true);
    SetLoi("");
    void LayMucDoMuon({
      ...LocMacDinh,
      KichThuoc: 5,
      KhoId: KhoId || undefined,
      DanhMucId: DanhMucId || undefined,
      MauThietBiId: MauThietBiId || undefined,
      NhomTheo: "THIET_BI",
      SapXep,
      CoSoKho: "HIEN_TAI",
    })
      .then((Moi) => {
        if (HieuLuc) SetDuLieu(Moi);
      })
      .catch((E) => {
        if (HieuLuc) SetLoi(LayThongBaoLoi(E));
      })
      .finally(() => {
        if (HieuLuc) SetDangTai(false);
      });
    return () => {
      HieuLuc = false;
    };
  }, [KhoId, DanhMucId, MauThietBiId, SapXep, LanTai]);
  return (
    <aside
      aria-label="Thiết bị mượn nhiều"
      className="min-w-0 self-start rounded border border-rail bg-case p-4 xl:sticky xl:top-5"
    >
      <h2 className="text-base font-semibold">Thiết bị mượn nhiều</h2>
      <p className="mt-1 text-xs leading-5 text-fog">
        Top 5 · toàn bộ giao dịch thực tế. Phạm vi theo kho quản lý hiện tại.
      </p>
      <label className="mt-3 block text-xs text-fog">
        Xếp theo
        <select
          className="mt-1 min-h-11 w-full rounded border border-rail bg-case-2 px-2 text-sm text-paper"
          value={SapXep}
          onChange={(E) => SetSapXep(E.target.value as typeof SapXep)}
        >
          <option value="LUOT_MUON">Số lượt mượn</option>
          <option value="GIO_NGOAI_KHO">Giờ ngoài kho</option>
        </select>
      </label>
      {DangTai ? (
        <p className="py-5 text-sm text-fog" role="status">
          Đang tải xếp hạng…
        </p>
      ) : Loi ? (
        <LoiThongKe Loi={Loi} OnThuLai={() => SetLanTai(LanTai + 1)} />
      ) : !DuLieu?.DanhSach.length ? (
        <p className="py-5 text-sm text-fog">Chưa có giao dịch mượn thực tế.</p>
      ) : (
        <ol className="mt-3 divide-y divide-rail">
          {DuLieu.DanhSach.map((Muc, So) => (
            <li key={Muc.Id}>
              <Link
                to={`/thiet-bi/${Muc.Id}`}
                className="flex min-h-11 gap-3 py-4 hover:text-blueprint"
              >
                <span className="w-4 shrink-0 text-sm tabular-nums text-fog">
                  {So + 1}
                </span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold">{Muc.Ten}</p>
                  <p className="mt-1 text-xs text-fog">
                    {Muc.SoLuotMuon} lượt · {DinhDangGio(Muc.GioNgoaiKho)} giờ
                    ngoài kho
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
      {Boolean(DuLieu?.SoMayThieuDuLieu) && (
        <p className="mt-3 text-xs text-timecode">
          Có máy thiếu mốc xuất/nhập; giờ ngoài kho chưa đầy đủ.
        </p>
      )}
    </aside>
  );
}
