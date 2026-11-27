import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

// Chỉ đọc hai trường định danh có cấu trúc đã lưu; không phân tích tên máy.
export function DocModel(ThongSo) {
  if (!ThongSo || typeof ThongSo !== "object" || Array.isArray(ThongSo))
    return null;
  const Model = typeof ThongSo.model === "string" ? ThongSo.model.trim() : "";
  const Hang =
    typeof ThongSo.thuongHieu === "string" ? ThongSo.thuongHieu.trim() : "";
  if (
    !Model ||
    !Hang ||
    Model.length > 100 ||
    Hang.length > 80 ||
    /^(không rõ|unknown|n\/a|demo|test)$/i.test(Model)
  )
    return null;
  if (`${Hang} ${Model}`.normalize("NFC").length > 100) return null;
  return {
    MaMau: `${Hang} ${Model}`.normalize("NFC").toLocaleUpperCase("vi"),
    TenMau: `${Hang} ${Model}`.normalize("NFC"),
  };
}
const DonViId = process.argv
  .find((GiaTri) => GiaTri.startsWith("--don-vi="))
  ?.slice(9);
const ApDung = process.argv.includes("--ap-dung");
if (!DonViId)
  throw new Error(
    "Cần --don-vi=<Id đơn vị>. Mặc định chỉ xem trước; ghi cần --ap-dung --xac-nhan-local.",
  );
const Url = new URL(process.env.DATABASE_URL);
if (
  ApDung &&
  (!process.argv.includes("--xac-nhan-local") ||
    !["localhost", "127.0.0.1"].includes(Url.hostname) ||
    Url.pathname !== "/doan" ||
    process.env.NODE_ENV === "production")
)
  throw new Error(
    "Từ chối ghi: chỉ hỗ trợ database doan local đã xác nhận; môi trường khác chỉ xem trước.",
  );
const Db = new PrismaClient();
try {
  const DonVi = await Db.donVi.findUniqueOrThrow({
    where: { Id: DonViId },
    select: { TenDonVi: true },
  });
  const May = await Db.thietBi.findMany({
    where: { DanhMuc: { DonViId }, MauThietBiId: null },
    orderBy: { Id: "asc" },
    select: {
      Id: true,
      MaQR: true,
      TenThietBi: true,
      DanhMucId: true,
      ThongSoKyThuat: true,
    },
  });
  const PhuongAn = May.map((Muc) => ({
    ...Muc,
    Model: DocModel(Muc.ThongSoKyThuat),
  }));
  console.log(
    JSON.stringify(
      {
        DonVi: DonVi.TenDonVi,
        CheDo: ApDung ? "Áp dụng" : "Xem trước",
        CoCanCu: PhuongAn.filter((Muc) => Muc.Model).map(({ MaQR, Model }) => ({
          MaQR,
          Model,
        })),
        CanXacMinh: PhuongAn.filter((Muc) => !Muc.Model).map(
          ({ Id, MaQR, TenThietBi }) => ({
            Id,
            MaQR,
            TenThietBi,
            CanBoSung:
              "Hãng và dòng sản phẩm từ hồ sơ thiết bị hoặc tem nhà sản xuất",
          }),
        ),
      },
      null,
      2,
    ),
  );
  if (ApDung && May.some((Muc) => DocModel(Muc.ThongSoKyThuat))) {
    const Goc = resolve("..");
    const ThuMuc = resolve(".SaoLuuCoSoDuLieu");
    if (!ThuMuc.startsWith(Goc + sep))
      throw new Error("Đường dẫn sao lưu vượt DOAN.");
    mkdirSync(ThuMuc, { recursive: true });
    const TienTo = resolve(ThuMuc, `GanModel-${DonViId}-${Date.now()}`);
    const SaoLuu = spawnSync(
      "C:/Program Files/PostgreSQL/18/bin/pg_dump.exe",
      ["--format=custom", `--file=${TienTo}.dump`],
      {
        env: {
          ...process.env,
          PGHOST: Url.hostname,
          PGPORT: Url.port || "5432",
          PGDATABASE: decodeURIComponent(Url.pathname.slice(1)),
          PGUSER: decodeURIComponent(Url.username),
          PGPASSWORD: decodeURIComponent(Url.password),
        },
        encoding: "utf8",
      },
    );
    if (SaoLuu.status !== 0)
      throw new Error(
        "Không sao lưu được database; chưa thực hiện gán dòng tài nguyên.",
      );
    const KiemChung = () =>
      Db.$queryRaw(
        Prisma.sql`SELECT (SELECT COUNT(*)::int FROM thiet_bi) AS "SoMay", md5(COALESCE(string_agg((to_jsonb(t)-'mauThietBiId')::text, '' ORDER BY t.id), '')) AS "May" FROM thiet_bi t`,
      );
    const DocLichSu = () =>
      Db.$queryRaw(Prisma.sql`SELECT md5(COALESCE(string_agg(dong, '' ORDER BY dong), '')) AS "LichSu" FROM (
      SELECT to_jsonb(n)::text AS dong FROM nhat_ky_muon_tra n UNION ALL SELECT to_jsonb(p)::text FROM ca_quay_thiet_bi p
      UNION ALL SELECT to_jsonb(g)::text FROM giao_dich_kho g UNION ALL SELECT to_jsonb(s)::text FROM su_co_bao_tri s
      UNION ALL SELECT to_jsonb(x)::text FROM nhat_ky_xu_ly_su_co x) v`);
    const Truoc = { May: await KiemChung(), LichSu: await DocLichSu() };
    const KetQua = await Db.$transaction(
      async (Tx) => {
        await Tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`GanModel:${DonViId}`}))`;
        const DaGan = [];
        for (const Muc of PhuongAn) {
          if (!Muc.Model) continue;
          const HienTai = await Tx.thietBi.findFirstOrThrow({
            where: { Id: Muc.Id, DanhMuc: { DonViId } },
          });
          if (HienTai.MauThietBiId) continue;
          if (
            JSON.stringify(HienTai.ThongSoKyThuat) !==
              JSON.stringify(Muc.ThongSoKyThuat) ||
            HienTai.DanhMucId !== Muc.DanhMucId
          )
            throw new Error(
              "Thiết bị vừa thay đổi. Hủy toàn bộ lượt và chạy xem trước lại.",
            );
          const CacMau = await Tx.mauThietBi.findMany({
            where: {
              DanhMucId: Muc.DanhMucId,
              OR: [
                { MaMau: { equals: Muc.Model.MaMau, mode: "insensitive" } },
                { TenMau: { equals: Muc.Model.TenMau, mode: "insensitive" } },
              ],
            },
          });
          if (CacMau.length > 1)
            throw new Error(
              "Có nhiều dòng tài nguyên trùng định danh; cần hợp nhất có kiểm soát trước khi gán.",
            );
          const Mau =
            CacMau[0] ??
            (await Tx.mauThietBi.create({
              data: { ...Muc.Model, DanhMucId: Muc.DanhMucId },
            }));
          await Tx.thietBi.update({
            where: { Id: Muc.Id },
            data: { MauThietBiId: Mau.Id },
          });
          DaGan.push({
            ThietBiId: Muc.Id,
            MaQR: Muc.MaQR,
            MauThietBiId: Mau.Id,
            CanCu: "ThongSoKyThuat.model + ThongSoKyThuat.thuongHieu",
          });
        }
        return DaGan;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 30000,
      },
    );
    const Sau = { May: await KiemChung(), LichSu: await DocLichSu() };
    const BaoToan = JSON.stringify(Truoc) === JSON.stringify(Sau);
    writeFileSync(
      `${TienTo}.json`,
      JSON.stringify({ DonViId, Truoc, Sau, BaoToan, KetQua }, null, 2),
    );
    console.log(
      JSON.stringify({
        DaGan: KetQua.length,
        BaoToan,
        TepSaoLuu: `${TienTo}.dump`,
        TepDoiChieu: `${TienTo}.json`,
      }),
    );
    if (!BaoToan)
      throw new Error(
        "Phát hiện dữ liệu khác thay đổi đồng thời. Dừng rà soát và dùng bản sao lưu để đối chiếu.",
      );
  }
} finally {
  await Db.$disconnect();
}
