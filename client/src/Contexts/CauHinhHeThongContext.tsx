import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import LogoTron from "../../assets/Logo2.png";
import {
  LayCauHinhHeThong,
  type CauHinhHeThong,
} from "../Services/CauHinhHeThongService";

const CauHinhMacDinh: CauHinhHeThong = {
  TenHeThong: "MEDIOPS",
  KhauHieu: null,
  EmailHoTro: null,
  SoDienThoaiHoTro: null,
  LogoUrl: null,
  NgayCapNhat: null,
};

interface GiaTriCauHinhHeThong {
  CauHinh: CauHinhHeThong;
  // Logo đang hiển thị: logo đã tải lên hoặc logo mặc định của dự án.
  Logo: string;
  CapNhatCauHinh: (CauHinhMoi: CauHinhHeThong) => void;
}

const CauHinhHeThongContext = createContext<GiaTriCauHinhHeThong | null>(null);

function DatBieuTuongTrang(DuongDan: string) {
  let LienKet = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!LienKet) {
    LienKet = document.createElement("link");
    LienKet.rel = "icon";
    document.head.appendChild(LienKet);
  }
  LienKet.href = DuongDan;
}

export function CauHinhHeThongProvider({
  children: Children,
}: {
  children: ReactNode;
}) {
  const [CauHinh, SetCauHinh] = useState<CauHinhHeThong>(CauHinhMacDinh);

  useEffect(() => {
    let HieuLuc = true;
    void LayCauHinhHeThong()
      .then((KetQua) => {
        if (HieuLuc) SetCauHinh(KetQua);
      })
      .catch(() => undefined);
    return () => {
      HieuLuc = false;
    };
  }, []);

  const Logo = CauHinh.LogoUrl ?? LogoTron;
  useEffect(() => {
    document.title = `${CauHinh.TenHeThong} | Điều phối sản xuất truyền thông`;
    DatBieuTuongTrang(Logo);
  }, [CauHinh.TenHeThong, Logo]);

  const CapNhatCauHinh = useCallback(
    (CauHinhMoi: CauHinhHeThong) => SetCauHinh(CauHinhMoi),
    [],
  );
  const GiaTri = useMemo(
    () => ({ CauHinh, Logo, CapNhatCauHinh }),
    [CauHinh, Logo, CapNhatCauHinh],
  );

  return (
    <CauHinhHeThongContext.Provider value={GiaTri}>
      {Children}
    </CauHinhHeThongContext.Provider>
  );
}

export function useCauHinhHeThong() {
  const GiaTri = useContext(CauHinhHeThongContext);
  if (!GiaTri)
    throw new Error("useCauHinhHeThong phải dùng bên trong provider.");
  return GiaTri;
}
