import { useEffect, useRef, useState } from "react";

export function DemNguocGiuCho({
  HetHanLuc,
  GioMayChu,
  OnHetHan,
}: {
  HetHanLuc: string;
  GioMayChu: string;
  OnHetHan?: () => void;
}) {
  const [ConLai, SetConLai] = useState(() =>
    Math.max(
      0,
      Math.ceil((Date.parse(HetHanLuc) - Date.parse(GioMayChu)) / 1000),
    ),
  );
  const DaBao = useRef(false);
  const KhiHetHan = useRef(OnHetHan);
  KhiHetHan.current = OnHetHan;
  useEffect(() => {
    const LechGio = Date.parse(GioMayChu) - Date.now();
    const CapNhat = () => {
      const SoGiay = Math.max(
        0,
        Math.ceil((Date.parse(HetHanLuc) - Date.now() - LechGio) / 1000),
      );
      SetConLai(SoGiay);
      if (!SoGiay && !DaBao.current) {
        DaBao.current = true;
        KhiHetHan.current?.();
      }
    };
    CapNhat();
    const BoDem = setInterval(CapNhat, 1000);
    return () => clearInterval(BoDem);
  }, [HetHanLuc, GioMayChu]);
  return (
    <span>
      {ConLai
        ? `${Math.floor(ConLai / 60)} phút ${ConLai % 60} giây còn lại`
        : "Đã hết hạn giữ"}
    </span>
  );
}
