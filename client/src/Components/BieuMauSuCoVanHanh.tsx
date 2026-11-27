import { useEffect, useMemo, useState, type FormEvent } from "react";
import { HopThoaiBieuMau } from "./HopThoaiBieuMau";
import {
  BaoSuCoVanHanh,
  GioGuiMayChu,
  GioNhapVietNam,
  LayNguCanhSuCo,
  ThemAnhVanHanh,
  type TaiNguyenSuCo,
} from "../Services/SuCoVanHanhService";
import {
  BaoSuCoVanHanhSchema,
  NhanMucAnhHuong,
  NhanNhomSuCo,
  TinhHuongSuCo,
  type DuLieuBaoSuCoVanHanh,
} from "../Types/HopDongSuCoVanHanh";
import { LayThongBaoLoi } from "../Services/XacThucService";

export function BieuMauSuCoVanHanh({
  CaQuayId,
  ThietBiCoDinh,
  OnDong,
  OnThanhCong,
}: {
  CaQuayId?: string;
  ThietBiCoDinh?: { Id: string };
  OnDong: () => void;
  OnThanhCong?: () => void;
}) {
  const [NguCanh, SetNguCanh] = useState<{
    CaQuayId?: string;
    CoTheBao: boolean;
    TenNguCanh: string;
    TaiNguyen: TaiNguyenSuCo[];
  }>();
  const [MaYeuCau] = useState(() => crypto.randomUUID());
  const [MaLanTai] = useState(() => crypto.randomUUID());
  const [Nhom, SetNhom] = useState<DuLieuBaoSuCoVanHanh["Nhom"]>("THIET_BI");
  const [NguyenNhan, SetNguyenNhan] = useState("HONG");
  const [MucAnhHuong, SetMucAnhHuong] =
    useState<DuLieuBaoSuCoVanHanh["MucAnhHuong"]>("ANH_HUONG_MOT_PHAN");
  const [MucDoThietBi, SetMucDo] = useState<
    "NHE" | "TRUNG_BINH" | "NGHIEM_TRONG"
  >("TRUNG_BINH");
  const [DaChon, SetDaChon] = useState<string[]>(
    ThietBiCoDinh ? [ThietBiCoDinh.Id] : [],
  );
  const [ThanhPhan, SetThanhPhan] = useState("");
  const [MoTa, SetMoTa] = useState("");
  const [XayRa, SetXayRa] = useState(() => GioNhapVietNam());
  const [DuKien, SetDuKien] = useState("");
  const [KetThuc, SetKetThuc] = useState("");
  const [Anh, SetAnh] = useState<File[]>([]);
  const [DaBao, SetDaBao] = useState<string>();
  const [DangGui, SetDangGui] = useState(false);
  const [Loi, SetLoi] = useState("");
  useEffect(() => {
    let Con = true;
    LayNguCanhSuCo({ CaQuayId, ThietBiId: ThietBiCoDinh?.Id })
      .then((KetQua) => {
        if (Con) SetNguCanh(KetQua);
      })
      .catch((LoiTai) => {
        if (Con) SetLoi(LayThongBaoLoi(LoiTai));
      });
    return () => {
      Con = false;
    };
  }, [CaQuayId, ThietBiCoDinh?.Id]);
  const XemTruoc = useMemo(
    () => Anh.map((Tep) => URL.createObjectURL(Tep)),
    [Anh],
  );
  useEffect(
    () => () => XemTruoc.forEach((Url) => URL.revokeObjectURL(Url)),
    [XemTruoc],
  );
  async function Gui(SuKien: FormEvent) {
    SuKien.preventDefault();
    SetLoi("");
    SetDangGui(true);
    try {
      let Id = DaBao;
      if (!Id) {
        const DuLieu = BaoSuCoVanHanhSchema.parse({
          MaYeuCau,
          CaQuayId: CaQuayId ?? NguCanh?.CaQuayId,
          ...(!CaQuayId ? { ThietBiId: ThietBiCoDinh?.Id } : {}),
          Nhom,
          NguyenNhan,
          MucAnhHuong,
          MucDoThietBi,
          MoTa,
          TaiNguyen: (NguCanh?.TaiNguyen ?? [])
            .filter((Muc) => DaChon.includes(Muc.Id))
            .map((Muc) => ({
              Loai: Muc.Loai,
              Id: Muc.Id,
              ...(ThanhPhan ? { ThanhPhan } : {}),
            })),
          ThoiDiemXayRa: GioGuiMayChu(XayRa),
          DuKienPhucHoi: DuKien ? GioGuiMayChu(DuKien) : null,
          KetThucAnhHuong: KetThuc ? GioGuiMayChu(KetThuc) : null,
        });
        const KetQua = await BaoSuCoVanHanh(DuLieu);
        Id = KetQua.Id;
        SetDaBao(Id);
      }
      if (Anh.length) await ThemAnhVanHanh(Id, Anh, MaLanTai);
      OnThanhCong?.();
      OnDong();
    } catch (LoiGui) {
      SetLoi(
        LoiGui instanceof Error && "issues" in LoiGui
          ? "Kiểm tra nhóm, tài nguyên, mô tả và khoảng thời gian đã nhập."
          : LayThongBaoLoi(LoiGui),
      );
    } finally {
      SetDangGui(false);
    }
  }
  const LopNhap =
    "mt-1 min-h-11 w-full rounded border border-rail bg-case-2 p-2 text-base text-paper";
  return (
    <HopThoaiBieuMau TieuDe="Báo sự cố" OnDong={OnDong} DangXuLy={DangGui}>
      <form className="mt-4 space-y-4" onSubmit={(SuKien) => void Gui(SuKien)}>
        <p className="text-sm text-fog">
          {NguCanh?.TenNguCanh ?? "Đang tải ngữ cảnh…"} · Giờ Việt Nam
        </p>
        {DaBao && (
          <p role="status">
            Đã ghi nhận sự cố. Ảnh chưa tải xong; gửi lại để bổ sung ảnh.
          </p>
        )}
        <fieldset
          disabled={DangGui || !!DaBao}
          className="space-y-4 disabled:opacity-70"
        >
          <label className="block">
            Nhóm sự cố
            <select
              className={LopNhap}
              value={Nhom}
              onChange={(SuKien) => {
                const Moi = SuKien.target.value as typeof Nhom;
                SetNhom(Moi);
                SetNguyenNhan(Object.keys(TinhHuongSuCo[Moi])[0]);
              }}
            >
              {Object.entries(NhanNhomSuCo).map(([Ma, Ten]) => (
                <option key={Ma} value={Ma}>
                  {Ten}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Nguyên nhân
            <select
              className={LopNhap}
              value={NguyenNhan}
              onChange={(SuKien) => SetNguyenNhan(SuKien.target.value)}
            >
              {Object.entries(TinhHuongSuCo[Nhom]).map(([Ma, Ten]) => (
                <option key={Ma} value={Ma}>
                  {Ten}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>Tài nguyên / vị trí bị ảnh hưởng</legend>
            {NguCanh?.TaiNguyen.map((Muc) => (
              <label
                key={`${Muc.Loai}:${Muc.Id}`}
                className="flex min-h-11 items-center gap-3"
              >
                <input
                  type="checkbox"
                  checked={DaChon.includes(Muc.Id)}
                  onChange={(SuKien) =>
                    SetDaChon((Cu) =>
                      SuKien.target.checked
                        ? [...Cu, Muc.Id]
                        : Cu.filter((Ma) => Ma !== Muc.Id),
                    )
                  }
                />
                <span>{Muc.Ten}</span>
              </label>
            ))}
          </fieldset>
          <label className="block">
            Thành phần thiếu / phạm vi ảnh hưởng (nếu có)
            <input
              className={LopNhap}
              value={ThanhPhan}
              maxLength={200}
              onChange={(SuKien) => SetThanhPhan(SuKien.target.value)}
            />
          </label>
          <label className="block">
            Tác động sản xuất
            <select
              className={LopNhap}
              value={MucAnhHuong}
              onChange={(SuKien) =>
                SetMucAnhHuong(SuKien.target.value as typeof MucAnhHuong)
              }
            >
              {Object.entries(NhanMucAnhHuong).map(([Ma, Ten]) => (
                <option key={Ma} value={Ma}>
                  {Ten}
                </option>
              ))}
            </select>
          </label>
          {NguyenNhan === "HONG" && (
            <label className="block">
              Mức lỗi thiết bị
              <select
                className={LopNhap}
                value={MucDoThietBi}
                onChange={(SuKien) =>
                  SetMucDo(SuKien.target.value as typeof MucDoThietBi)
                }
              >
                <option value="NHE">Nhẹ · Cần kiểm tra</option>
                <option value="TRUNG_BINH">
                  Trung bình · Không tiếp tục cấp phát
                </option>
                <option value="NGHIEM_TRONG">
                  Nghiêm trọng · Ngừng sử dụng
                </option>
              </select>
            </label>
          )}
          <label className="block">
            Thời điểm xảy ra
            <input
              className={LopNhap}
              type="datetime-local"
              required
              value={XayRa}
              onChange={(SuKien) => SetXayRa(SuKien.target.value)}
            />
          </label>
          <label className="block">
            Mô tả ngắn
            <textarea
              className={LopNhap}
              rows={3}
              required
              minLength={3}
              maxLength={2000}
              value={MoTa}
              onChange={(SuKien) => SetMoTa(SuKien.target.value)}
            />
          </label>
          <p className="text-sm text-fog">
            Chỉ ghi tác động công việc; không nhập lý do riêng tư hoặc hồ sơ sức
            khỏe.
          </p>
          <details>
            <summary className="min-h-11 cursor-pointer">
              Thời gian và ảnh (tùy chọn)
            </summary>
            <label className="block">
              Dự kiến phục hồi / đến nơi / trả kho
              <input
                className={LopNhap}
                type="datetime-local"
                value={DuKien}
                onChange={(SuKien) => SetDuKien(SuKien.target.value)}
              />
            </label>
            <p className="mt-1 text-sm text-fog">
              Để trống khi chưa rõ thời điểm phục hồi.
            </p>
            <label className="mt-3 block">
              Kết thúc gián đoạn đã xác nhận
              <input
                className={LopNhap}
                type="datetime-local"
                value={KetThuc}
                onChange={(SuKien) => SetKetThuc(SuKien.target.value)}
              />
            </label>
            <label className="mt-3 block">
              Ảnh bằng chứng · tối đa 5 ảnh, mỗi ảnh 5 MB
              <input
                className={LopNhap}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(SuKien) => {
                  const Tep = Array.from(SuKien.target.files ?? []);
                  if (
                    Tep.length > 5 ||
                    Tep.some((Muc) => Muc.size > 5 * 1024 * 1024)
                  ) {
                    SetLoi("Chọn tối đa 5 ảnh, mỗi ảnh không quá 5 MB.");
                    return;
                  }
                  SetAnh(Tep);
                }}
              />
            </label>
          </details>
        </fieldset>
        {XemTruoc.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {XemTruoc.map((Url, ChiSo) => (
              <button
                type="button"
                key={Url}
                disabled={DangGui}
                aria-label={`Bỏ ảnh ${ChiSo + 1}`}
                onClick={() =>
                  SetAnh((Cu) => Cu.filter((_, ViTri) => ViTri !== ChiSo))
                }
              >
                <img
                  className="h-20 w-20 rounded object-cover"
                  src={Url}
                  alt={`Ảnh sự cố ${ChiSo + 1}`}
                />
              </button>
            ))}
          </div>
        )}
        {Loi && (
          <p role="alert" className="text-sm text-tally">
            {Loi}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            className="min-h-11 px-4"
            type="button"
            disabled={DangGui}
            onClick={OnDong}
          >
            Đóng
          </button>
          <button
            className="min-h-11 rounded bg-tally px-4 text-paper disabled:opacity-50"
            type="submit"
            disabled={DangGui || !NguCanh?.CoTheBao}
          >
            {DangGui ? "Đang gửi…" : DaBao ? "Bổ sung ảnh" : "Gửi báo sự cố"}
          </button>
        </div>
      </form>
    </HopThoaiBieuMau>
  );
}
