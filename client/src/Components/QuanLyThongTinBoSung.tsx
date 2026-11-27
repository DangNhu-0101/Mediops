import { useState } from "react";
import { toast } from "sonner";
import { Api } from "../Services/Api";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { HopThoaiBieuMau } from "./HopThoaiBieuMau";
import { BieuMauKhoangBan } from "./BieuMauKhoangBan";
import type { KhoangBan } from "../Types/DuLieuNhung";

export function QuanLyThongTinBoSung({
  Nhom,
  Id,
  Ten,
}: {
  Nhom: "thiet-bi" | "nhan-su" | "phong-studio";
  Id: string;
  Ten: string;
}) {
  const [Mo, SetMo] = useState(false),
    [DangTai, SetDangTai] = useState(false),
    [DangLuu, SetDangLuu] = useState(false),
    [Loi, SetLoi] = useState("");
  const [DaTai, SetDaTai] = useState(false);
  const [Khoang, SetKhoang] = useState<KhoangBan[]>([]),
    [TrinhDo, SetTrinhDo] = useState<number | null>(null);
  async function Tai() {
    SetMo(true);
    SetDangTai(true);
    SetDaTai(false);
    SetLoi("");
    try {
      const Kq = await Api.get<{
        CacKhoangKhongKhaDung: KhoangBan[];
        TrinhDo?: number | null;
      }>(`/${Nhom}/${Id}/bo-sung`);
      SetKhoang(Kq.data.CacKhoangKhongKhaDung);
      SetTrinhDo(Kq.data.TrinhDo ?? null);
      SetDaTai(true);
    } catch (E) {
      SetLoi(LayThongBaoLoi(E));
    } finally {
      SetDangTai(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className="min-h-10 rounded border border-rail px-3 text-sm text-fog hover:text-paper"
        onClick={() => void Tai()}
      >
        {Nhom === "nhan-su" ? "Trình độ và lịch bận" : "Lịch bận"}
      </button>
      {Mo && (
        <HopThoaiBieuMau
          TieuDe={`Thông tin bổ sung · ${Ten}`}
          OnDong={() => SetMo(false)}
          DangXuLy={DangLuu}
          KichThuoc="rong"
        >
          <form
            className="mt-5 space-y-6"
            onSubmit={async (SuKien) => {
              SuKien.preventDefault();
              SetDangLuu(true);
              SetLoi("");
              try {
                await Api.put(`/${Nhom}/${Id}/bo-sung`, {
                  CacKhoangKhongKhaDung: Khoang,
                  ...(Nhom === "nhan-su" ? { TrinhDo } : {}),
                });
                toast.success("Đã lưu thông tin bổ sung.");
                SetMo(false);
              } catch (E) {
                SetLoi(LayThongBaoLoi(E));
              } finally {
                SetDangLuu(false);
              }
            }}
          >
            {DangTai ? (
              <p role="status">Đang tải thông tin…</p>
            ) : (
              <fieldset disabled={DangLuu || !DaTai} className="space-y-6">
                <BieuMauKhoangBan GiaTri={Khoang} OnDoi={SetKhoang} />
                {Nhom === "nhan-su" && (
                  <label className="block max-w-xs text-sm">
                    <span className="font-semibold">
                      Trình độ theo chức danh
                    </span>
                    <span className="mt-1 block text-fog">
                      Mức 1 đến 5, dùng để đối chiếu trình độ tối thiểu của ca
                      quay.
                    </span>
                    <select
                      className="mt-2 min-h-11 w-full rounded border border-rail bg-case-2 px-3"
                      value={TrinhDo ?? ""}
                      onChange={(SuKien) =>
                        SetTrinhDo(
                          SuKien.target.value
                            ? Number(SuKien.target.value)
                            : null,
                        )
                      }
                    >
                      <option value="">Chưa đánh giá</option>
                      {[1, 2, 3, 4, 5].map((So) => (
                        <option key={So} value={So}>
                          Mức {So}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </fieldset>
            )}
            {Loi && (
              <p role="alert" className="text-sm text-tally">
                {Loi}
              </p>
            )}
            <div className="flex justify-end gap-3 border-t border-rail pt-4">
              <button
                type="button"
                disabled={DangLuu}
                className="min-h-11 rounded border border-rail px-4"
                onClick={() => SetMo(false)}
              >
                Hủy
              </button>
              <button
                disabled={DangLuu || DangTai || !DaTai}
                type="submit"
                className="min-h-11 rounded bg-tally px-4 text-white disabled:opacity-50"
              >
                {DangLuu ? "Đang lưu…" : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </HopThoaiBieuMau>
      )}
    </>
  );
}
