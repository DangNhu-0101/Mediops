import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import {
  Activity,
  ArrowRight,
  Boxes,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Film,
  LogIn,
  Mail,
  MapPin,
  Menu,
  PackageCheck,
  Phone,
  QrCode,
  Quote,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  UserRoundCheck,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import LogoChinh from "../../assets/Logo1.png";
import LogoTron from "../../assets/Logo2.png";
import { SchemaLienHe } from "../Schemas/BieuMau";
import "./TrangChu.css";

const CacMucDieuHuong = [
  ["#nang-luc", "Tính năng"],
  ["#quy-trinh", "Quy trình"],
  ["#bang-gia", "Bảng giá"],
  ["#danh-gia", "Đánh giá"],
  ["#lien-he", "Liên hệ"],
] as const;

const CacBuocVanHanh = [
  ["Lập ca quay", CalendarDays],
  ["Phân bổ Studio", Building2],
  ["Phân bổ thiết bị", Camera],
  ["Phân công nhân sự", UsersRound],
  ["Kiểm tra tài nguyên", ShieldCheck],
  ["Chuẩn bị sản xuất", Film],
  ["Xuất / nhập thiết bị", QrCode],
  ["Theo dõi vận hành", Activity],
] as const;

type CheDoXemTruoc = "lich" | "thiet-bi" | "studio";

type MaGoiDichVu = "KhoiDau" | "ChuyenNghiep" | "DoanhNghiep";

const TiLeGiamGia = 40;

function ThuongHieu({ Gon: Gon = false }: { Gon?: boolean }) {
  return (
    <span className="thuong-hieu-cong-khai">
      <span className="khung-logo-tron">
        <img src={LogoTron} alt="" height={2000} width={2000} />
      </span>
      <span className={Gon ? "an-ten-thuong-hieu" : undefined}>
        <strong>MEDIOPS</strong>
        <small>Điều phối sản xuất</small>
      </span>
    </span>
  );
}

function LichVanHanhThuNho() {
  return (
    <div className="lich-van-hanh-thu-nho" aria-label="Minh họa lịch ca quay">
      <div className="thanh-cong-cu-lich">
        <div>
          <p>Lịch ca quay</p>
          <span>Tuần 18 - 24 tháng 9</span>
        </div>
        <div className="nhom-che-do-lich" aria-hidden="true">
          <span>Tháng</span>
          <span className="dang-chon">Tuần</span>
          <span>Ngày</span>
        </div>
      </div>

      <div className="khung-dong-lich">
        <div className="cot-nhan-lich" aria-hidden="true">
          <span>Studio A</span>
          <span>Studio B</span>
          <span>Ngoại cảnh</span>
        </div>
        <div className="vung-su-kien-lich">
          <div className="nhan-ngay-lich" aria-hidden="true">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
          </div>
          <div className="luoi-lich" aria-hidden="true">
            <span className="su-kien-lich su-kien-chinh">
              MV Ánh sáng
              <small>08:00 - 11:30</small>
            </span>
            <span className="su-kien-lich su-kien-phu">
              Phỏng vấn
              <small>13:30 - 16:00</small>
            </span>
            <span className="su-kien-lich su-kien-canh-bao">
              TVC Sản phẩm
              <small>Cần kiểm tra</small>
            </span>
            <span className="duong-thoi-gian" />
          </div>
        </div>
      </div>

      <div className="tai-nguyen-ca-quay">
        <span>
          <Building2 aria-hidden size={16} /> Studio A
        </span>
        <span>
          <Camera aria-hidden size={16} /> 8 thiết bị
        </span>
        <span>
          <UsersRound aria-hidden size={16} /> 6 nhân sự
        </span>
      </div>
    </div>
  );
}

function AnhHung() {
  return (
    <section className="anh-hung-cong-khai" aria-labelledby="tieu-de-anh-hung">
      <div className="khung-noi-dung-cong-khai luoi-anh-hung">
        <div className="noi-dung-anh-hung">
          <a className="huy-hieu-uu-dai" href="#bang-gia">
            <Sparkles aria-hidden size={15} />
            <span>Siêu ưu đãi cuối năm — giảm đến {TiLeGiamGia}%</span>
            <ArrowRight aria-hidden size={14} />
          </a>
          <h1 id="tieu-de-anh-hung">
            Lên lịch một chạm.
            <br />
            <span>Lên hình đúng lúc.</span>
          </h1>
          <p className="mo-ta-anh-hung">
            MEDIOPS là nền tảng điều phối sản xuất truyền thông giúp đội ngũ của
            bạn quản lý ca quay, Studio, thiết bị và nhân sự trên cùng một màn
            hình — ít cuộc gọi hơn, ít sai sót hơn, nhiều thời gian sáng tạo
            hơn.
          </p>
          <div className="hanh-dong-anh-hung">
            <a className="nut-cong-khai nut-chinh" href="#lien-he">
              Dùng thử miễn phí 14 ngày
              <ArrowRight aria-hidden size={18} />
            </a>
            <a className="nut-cong-khai nut-phu" href="#bang-gia">
              Xem bảng giá
            </a>
          </div>
          <div className="niem-tin-anh-hung">
            <DanhGiaSao SoSao={5} />
            <span>
              <strong>4,9/5</strong> từ hơn 1.200 đánh giá · Không cần thẻ thanh
              toán
            </span>
          </div>
        </div>

        <div className="khung-truc-quan-anh-hung">
          <div className="dau-truc-quan-anh-hung">
            <img src={LogoChinh} alt="MEDIOPS" height={2000} width={2000} />
            <div>
              <strong>Trung tâm điều phối</strong>
              <span>Mọi nguồn lực sản xuất, một nhịp điều phối.</span>
            </div>
          </div>
          <LichVanHanhThuNho />
          <div
            className="quan-he-anh-hung"
            aria-label="Quan hệ tài nguyên ca quay"
          >
            <span>Lập lịch sản xuất</span>
            <ChevronRight aria-hidden size={16} />
            <span>Phân bổ tài nguyên</span>
            <ChevronRight aria-hidden size={16} />
            <span>Điều phối vận hành</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function NangLucSanPham() {
  return (
    <section
      className="phan-cong-khai"
      id="nang-luc"
      aria-labelledby="tieu-de-nang-luc"
    >
      <div className="khung-noi-dung-cong-khai">
        <div className="tieu-de-phan">
          <h2 id="tieu-de-nang-luc">Mọi nguồn lực, chung một nhịp sản xuất</h2>
          <p>
            Từ kế hoạch trên lịch đến từng thiết bị rời kho, MEDIOPS gom mọi
            thông tin quan trọng vào một luồng làm việc duy nhất để cả ê-kíp
            luôn nắm cùng một bức tranh.
          </p>
        </div>

        <div className="luoi-nang-luc">
          <article className="o-nang-luc o-nang-luc-lich">
            <div className="tieu-de-o-nang-luc">
              <span className="bieu-tuong-nang-luc">
                <CalendarDays aria-hidden size={22} />
              </span>
              <div>
                <h3>Lịch ca quay</h3>
                <p>
                  Xem theo tháng, tuần, ngày và nắm trọn tiến độ từng ca quay.
                </p>
              </div>
            </div>
            <div className="lich-rut-gon" aria-hidden="true">
              <span>08:00</span>
              <strong>Studio A</strong>
              <i>MV Ánh sáng</i>
              <span>13:30</span>
              <strong>Studio B</strong>
              <i>Phỏng vấn nghệ sĩ</i>
            </div>
          </article>

          <article className="o-nang-luc o-nang-luc-studio">
            <span className="bieu-tuong-nang-luc">
              <Building2 aria-hidden size={22} />
            </span>
            <h3>Điều phối Studio</h3>
            <p>Đặt đúng không gian, đúng khung giờ cho mọi yêu cầu sản xuất.</p>
            <div className="trang-thai-studio" aria-hidden="true">
              <span>Studio A</span>
              <strong>Sẵn sàng</strong>
            </div>
          </article>

          <article className="o-nang-luc o-nang-luc-thiet-bi">
            <span className="bieu-tuong-nang-luc">
              <Boxes aria-hidden size={22} />
            </span>
            <h3>Thiết bị và QR</h3>
            <p>
              Xuất nhập kho bằng một lần quét QR, trạng thái thiết bị cập nhật
              tức thì.
            </p>
            <div className="dong-thiet-bi" aria-hidden="true">
              <Camera size={18} />
              <span>Máy quay FX6</span>
              <small>Sẵn sàng</small>
            </div>
            <div className="dong-thiet-bi" aria-hidden="true">
              <Wrench size={18} />
              <span>Đèn COB 300D</span>
              <small className="canh-bao">Bảo trì</small>
            </div>
          </article>

          <article className="o-nang-luc o-nang-luc-nhan-su">
            <span className="bieu-tuong-nang-luc">
              <UserRoundCheck aria-hidden size={22} />
            </span>
            <h3>Phân công nhân sự</h3>
            <p>Ghép đúng đạo diễn, kỹ thuật viên và ê-kíp vào đúng ca quay.</p>
            <div className="nhom-vai-tro" aria-hidden="true">
              <span>Đạo diễn</span>
              <span>Quay phim</span>
              <span>Ánh sáng</span>
            </div>
          </article>

          <article className="o-nang-luc o-nang-luc-xung-dot">
            <div>
              <span className="bieu-tuong-nang-luc">
                <CircleAlert aria-hidden size={22} />
              </span>
              <h3>Cảnh báo xung đột tự động</h3>
              <p>
                Phát hiện tài nguyên trùng lịch ngay khi lập kế hoạch và gợi ý
                phương án thay thế phù hợp trước khi sự cố xảy ra.
              </p>
            </div>
            <div className="minh-hoa-xung-dot" aria-hidden="true">
              <span className="duong-ke-hoach" />
              <span className="khoi-lich khoi-mot">Ca quay A</span>
              <span className="khoi-lich khoi-hai">Ca quay B</span>
              <strong>Trùng khung giờ</strong>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function QuyTrinhSanXuat() {
  return (
    <section
      className="phan-cong-khai phan-quy-trinh"
      id="quy-trinh"
      aria-labelledby="tieu-de-quy-trinh"
    >
      <div className="khung-noi-dung-cong-khai">
        <div className="tieu-de-phan">
          <h2 id="tieu-de-quy-trinh">
            Từ ý tưởng đến hiện trường, không đứt nhịp
          </h2>
          <p>
            Tám bước được chuẩn hóa giúp đội sản xuất biết chính xác việc gì cần
            chuẩn bị, ai phụ trách và nguồn lực nào đã sẵn sàng.
          </p>
        </div>
        <ol className="dong-quy-trinh">
          {CacBuocVanHanh.map(([Nhan, BieuTuong]) => (
            <li key={Nhan}>
              <span>
                <BieuTuong aria-hidden size={20} />
              </span>
              <strong>{Nhan}</strong>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function NoiDungXemTruoc({ CheDo: CheDo }: { CheDo: CheDoXemTruoc }) {
  if (CheDo === "thiet-bi") {
    return (
      <div className="noi-dung-thiet-bi-xem-truoc">
        {[
          ["Sony FX6", "CAM-012", "Sẵn sàng", "san-sang"],
          ["Ống kính 24-70mm", "LENS-008", "Đang sử dụng", "dang-dung"],
          ["Đèn COB 300D", "LIGHT-004", "Bảo trì", "bao-tri"],
        ].map(([Ten, Ma, TrangThai, Lop]) => (
          <div className="thiet-bi-xem-truoc" key={Ma}>
            <span className="anh-thiet-bi-xem-truoc">
              <Camera aria-hidden size={20} />
            </span>
            <span>
              <strong>{Ten}</strong>
              <small>{Ma}</small>
            </span>
            <em className={Lop}>{TrangThai}</em>
          </div>
        ))}
      </div>
    );
  }

  if (CheDo === "studio") {
    return (
      <div className="noi-dung-studio-xem-truoc">
        <div>
          <Building2 aria-hidden size={24} />
          <strong>Studio A</strong>
          <span>Phông xanh và cách âm</span>
          <small>Sẵn sàng</small>
        </div>
        <div>
          <Building2 aria-hidden size={24} />
          <strong>Studio B</strong>
          <span>Không gian phỏng vấn</span>
          <small className="dang-dung">Đang sử dụng</small>
        </div>
        <div>
          <Building2 aria-hidden size={24} />
          <strong>Studio C</strong>
          <span>Sân khấu đa năng</span>
          <small>Sẵn sàng</small>
        </div>
      </div>
    );
  }

  return <LichVanHanhThuNho />;
}

function XemTruocSanPham() {
  const [CheDo, SetCheDo] = useState<CheDoXemTruoc>("lich");
  const CacCheDo: Array<[CheDoXemTruoc, string, typeof CalendarDays]> = [
    ["lich", "Lịch ca quay", CalendarDays],
    ["thiet-bi", "Thiết bị", Boxes],
    ["studio", "Studio", Building2],
  ];

  return (
    <section
      className="phan-cong-khai phan-xem-truoc"
      id="san-pham"
      aria-labelledby="tieu-de-san-pham"
    >
      <div className="khung-noi-dung-cong-khai">
        <div className="tieu-de-phan tieu-de-xem-truoc">
          <h2 id="tieu-de-san-pham">
            Một giao diện, cả{" "}
            <span style={{ whiteSpace: "nowrap" }}>ê-kíp</span> cùng vận hành
          </h2>
          <p>
            Trực quan, dễ dùng ngay từ ngày đầu tiên. Bấm thử từng mô-đun để cảm
            nhận cách MEDIOPS sắp xếp công việc cho bạn.
          </p>
        </div>

        <div className="khung-san-pham-xem-truoc">
          <aside
            className="thanh-ben-xem-truoc"
            aria-label="Các khu vực ứng dụng"
          >
            <div className="dau-thanh-ben">
              <img src={LogoTron} alt="" height={2000} width={2000} />
              <strong>MEDIOPS</strong>
            </div>
            <nav>
              {CacCheDo.map(([GiaTri, Nhan, BieuTuong]) => (
                <button
                  aria-pressed={CheDo === GiaTri}
                  className={CheDo === GiaTri ? "dang-chon" : undefined}
                  key={GiaTri}
                  onClick={() => SetCheDo(GiaTri)}
                  type="button"
                >
                  <BieuTuong aria-hidden size={17} />
                  {Nhan}
                </button>
              ))}
              <span>
                <UsersRound aria-hidden size={17} /> Nhân sự
              </span>
              <span>
                <Activity aria-hidden size={17} /> Nhật ký và sự cố
              </span>
            </nav>
          </aside>
          <div className="man-hinh-xem-truoc">
            <header>
              <div>
                <strong>
                  {CheDo === "lich"
                    ? "Lịch ca quay"
                    : CheDo === "thiet-bi"
                      ? "Kho thiết bị"
                      : "Điều phối Studio"}
                </strong>
                <span>Không gian vận hành sản xuất</span>
              </div>
              <span className="nhan-xem-truoc">Bản xem trước</span>
            </header>
            <div className="vung-xem-truoc">
              <NoiDungXemTruoc CheDo={CheDo} />
            </div>
          </div>
        </div>
        <p className="chu-thich-xem-truoc">
          Giao diện minh họa từ các mô-đun đang vận hành trong hệ thống.
        </p>
      </div>
    </section>
  );
}

function DieuPhoiTaiNguyen() {
  const CacTaiNguyen = [
    ["studio", "Studio", "Không gian và khung giờ", Building2],
    ["thiet-bi", "Thiết bị", "Đúng bộ máy cho nội dung", Camera],
    ["nhan-su", "Nhân sự", "Đúng chức danh trong ê-kíp", UsersRound],
  ] as const;

  return (
    <section
      className="phan-cong-khai phan-tai-nguyen"
      aria-labelledby="tieu-de-tai-nguyen"
    >
      <div className="khung-noi-dung-cong-khai luoi-tai-nguyen">
        <div className="noi-dung-tai-nguyen">
          <h2 id="tieu-de-tai-nguyen">Ca quay là nơi mọi nguồn lực hội tụ</h2>
          <p>
            Một buổi quay chỉ thật sự sẵn sàng khi Studio, thiết bị và nhân sự
            cùng có mặt đúng lúc. MEDIOPS đảm bảo điều đó cho bạn.
          </p>
          <ul>
            <li>
              <Check aria-hidden size={17} /> Nắm rõ nguồn lực đang được phân bổ
              theo thời gian thực
            </li>
            <li>
              <Check aria-hidden size={17} /> Cắt giảm tin nhắn, cuộc gọi rời
              rạc giữa các nhóm
            </li>
            <li>
              <Check aria-hidden size={17} /> Chuẩn bị hiện trường theo một kế
              hoạch thống nhất
            </li>
          </ul>
        </div>
        <div
          className="so-do-tai-nguyen"
          aria-label="Ca quay kết nối với Studio, thiết bị và nhân sự"
        >
          <div className="tam-ca-quay">
            <Film aria-hidden size={28} />
            <strong>Ca quay</strong>
            <span>Khung giờ đã chọn</span>
          </div>
          {CacTaiNguyen.map(([Lop, Ten, MoTa, BieuTuong]) => (
            <div className={`nut-tai-nguyen nut-${Lop}`} key={Ten}>
              <span>
                <BieuTuong aria-hidden size={21} />
              </span>
              <strong>{Ten}</strong>
              <small>{MoTa}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function XungDotLich() {
  return (
    <section
      className="phan-cong-khai phan-xung-dot"
      aria-labelledby="tieu-de-xung-dot"
    >
      <div className="khung-noi-dung-cong-khai luoi-xung-dot">
        <div
          className="bang-xung-dot"
          aria-label="Minh họa kiểm tra xung đột tài nguyên"
        >
          <div className="dau-bang-xung-dot">
            <strong>Kiểm tra tài nguyên</strong>
            <span>Thứ Năm, 19 tháng 9</span>
          </div>
          <div className="moc-gio-xung-dot" aria-hidden="true">
            <span>08:00</span>
            <span>10:00</span>
            <span>12:00</span>
            <span>14:00</span>
            <span>16:00</span>
          </div>
          {[
            ["Studio A", "lich-khong-xung-dot"],
            ["Máy quay FX6", "lich-co-xung-dot"],
            ["Đạo diễn", "lich-khong-xung-dot lich-muon"],
          ].map(([Nhan, Lop]) => (
            <div className="dong-xung-dot" key={Nhan}>
              <span>{Nhan}</span>
              <div>
                <i className={Lop} />
              </div>
            </div>
          ))}
          <div className="canh-bao-xung-dot">
            <CircleAlert aria-hidden size={18} />
            <span>
              <strong>Thiết bị trùng lịch</strong>
              Đã có 2 phương án thay thế sẵn sàng để bạn lựa chọn.
            </span>
          </div>
        </div>

        <div className="noi-dung-xung-dot">
          <h2 id="tieu-de-xung-dot">Đúng nguồn lực. Đúng thời điểm.</h2>
          <p>
            Không còn cảnh thiếu máy quay phút chót hay trùng lịch đạo diễn. Hệ
            thống cảnh báo ngay khi một ca quay chưa đủ điều kiện vận hành.
          </p>
          <div
            className="cong-thuc-ca-quay"
            aria-label="Điều kiện của một ca quay"
          >
            <span>Một ca quay</span>
            <ChevronRight aria-hidden size={16} />
            <span>đúng Studio</span>
            <ChevronRight aria-hidden size={16} />
            <span>đúng thiết bị</span>
            <ChevronRight aria-hidden size={16} />
            <span>đúng nhân sự</span>
            <ChevronRight aria-hidden size={16} />
            <span>đúng thời gian</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function LuongQR() {
  const CacBuoc = [
    ["Ca quay", Film],
    ["Danh sách thiết bị", Boxes],
    ["Quét QR", ScanLine],
    ["Xuất kho / Nhập kho", PackageCheck],
    ["Cập nhật trạng thái", Activity],
  ] as const;

  return (
    <section
      className="phan-cong-khai phan-qr"
      id="qr"
      aria-labelledby="tieu-de-qr"
    >
      <div className="khung-noi-dung-cong-khai luoi-qr">
        <div className="noi-dung-qr">
          <h2 id="tieu-de-qr">Quét một lần, kho luôn chính xác</h2>
          <p>
            Ứng dụng trên điện thoại giúp ê-kíp đi từ danh sách thiết bị của ca
            quay đến thao tác xuất, nhập và cập nhật trạng thái chỉ bằng camera.
          </p>
          <ol>
            {CacBuoc.map(([Nhan, BieuTuong]) => (
              <li key={Nhan}>
                <BieuTuong aria-hidden size={18} />
                {Nhan}
              </li>
            ))}
          </ol>
          <p className="ghi-chu-qr">
            Không cần máy quét chuyên dụng — mọi điện thoại thông minh đều sẵn
            sàng.
          </p>
        </div>

        <div
          className="cum-dien-thoai"
          aria-label="Xem trước quy trình QR trên điện thoại"
        >
          <div className="dien-thoai dien-thoai-phu" aria-hidden="true">
            <div className="tai-thoai" />
            <span className="nhan-man-hinh">Thiết bị của ca quay</span>
            <div className="dong-kiem-tra da-kiem-tra">
              <Check size={15} /> Sony FX6
            </div>
            <div className="dong-kiem-tra da-kiem-tra">
              <Check size={15} /> Ống kính 24-70mm
            </div>
            <div className="dong-kiem-tra">
              <Clock3 size={15} /> Đèn COB 300D
            </div>
          </div>
          <div className="dien-thoai dien-thoai-chinh">
            <div className="tai-thoai" />
            <div className="dau-man-hinh-qr">
              <span>Xuất kho thiết bị</span>
              <small>Ca quay MV Ánh sáng</small>
            </div>
            <div className="vung-qr">
              <span>
                <QrCode aria-hidden size={72} />
              </span>
              <strong>Sẵn sàng quét</strong>
              <small>Đưa mã QR thiết bị vào vùng nhận diện</small>
            </div>
            <div className="tien-do-qr">
              <span>Tiến độ thiết bị</span>
              <strong>2 / 3</strong>
            </div>
            <div className="nut-xac-nhan-qr">Xác nhận hoàn tất</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DanhGiaSao({
  SoSao: SoSao,
  KichThuoc: KichThuoc = 16,
}: {
  SoSao: number;
  KichThuoc?: number;
}) {
  return (
    <span className="dai-sao" role="img" aria-label={`${SoSao} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((ViTri) => (
        <Star
          aria-hidden
          className={ViTri <= SoSao ? "sao-day" : "sao-rong"}
          key={ViTri}
          size={KichThuoc}
        />
      ))}
    </span>
  );
}

function ChiSoNiemTin() {
  const CacChiSo = [
    ["1.200+", "đơn vị sản xuất tin dùng"],
    ["85.000+", "ca quay đã được điều phối"],
    ["-63%", "thời gian lập lịch thủ công"],
    ["99,9%", "thời gian hoạt động ổn định"],
  ] as const;

  return (
    <section className="phan-chi-so" aria-label="Những con số nổi bật">
      <div className="khung-noi-dung-cong-khai luoi-chi-so">
        {CacChiSo.map(([GiaTri, MoTa]) => (
          <div className="o-chi-so" key={MoTa}>
            <strong>{GiaTri}</strong>
            <span>{MoTa}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

type KieuThanhToan = "thang" | "nam";

type GoiDichVu = {
  Ma: MaGoiDichVu;
  Ten: string;
  MoTa: string;
  GiaGoc: number | null;
  NoiBat: boolean;
  CacQuyenLoi: string[];
};

const CacGoiDichVu: GoiDichVu[] = [
  {
    Ma: "KhoiDau",
    Ten: "Khởi đầu",
    MoTa: "Dành cho nhóm sản xuất nhỏ mới bắt đầu số hóa quy trình.",
    GiaGoc: 990000,
    NoiBat: false,
    CacQuyenLoi: [
      "Tối đa 10 nhân sự",
      "2 Studio, 150 thiết bị",
      "Lịch ca quay theo tháng, tuần, ngày",
      "Xuất nhập kho bằng QR",
      "Hỗ trợ qua email",
    ],
  },
  {
    Ma: "ChuyenNghiep",
    Ten: "Chuyên nghiệp",
    MoTa: "Lựa chọn của nhà sản xuất cần điều phối nhiều ê-kíp cùng lúc.",
    GiaGoc: 2490000,
    NoiBat: true,
    CacQuyenLoi: [
      "Tối đa 50 nhân sự",
      "Không giới hạn Studio và thiết bị",
      "Cảnh báo xung đột và gợi ý thay thế",
      "Thống kê vận hành, nhật ký mượn trả",
      "Phân quyền theo nhóm và chức danh",
      "Hỗ trợ ưu tiên 7 ngày trong tuần",
    ],
  },
  {
    Ma: "DoanhNghiep",
    Ten: "Doanh nghiệp",
    MoTa: "Giải pháp may đo cho đài truyền hình và tập đoàn truyền thông.",
    GiaGoc: null,
    NoiBat: false,
    CacQuyenLoi: [
      "Không giới hạn nhân sự và đơn vị",
      "Quản trị nhiều đơn vị trên một hệ thống",
      "Tích hợp hệ thống nội bộ theo yêu cầu",
      "Cam kết chất lượng dịch vụ 99,9%",
      "Chuyên viên đồng hành riêng",
    ],
  },
];

const TiLeGiamThemTheoNam = 20;

function DinhDangTien(SoTien: number) {
  return `${new Intl.NumberFormat("vi-VN").format(SoTien)} ₫`;
}

function TinhGiaUuDai(GiaGoc: number, KieuThanhToanDaChon: KieuThanhToan) {
  const SauUuDai = GiaGoc * (1 - TiLeGiamGia / 100);
  const SauThanhToanNam =
    KieuThanhToanDaChon === "nam"
      ? SauUuDai * (1 - TiLeGiamThemTheoNam / 100)
      : SauUuDai;
  return Math.round(SauThanhToanNam / 1000) * 1000;
}

// Ưu đãi kết thúc vào nửa đêm ngày cuối cùng của tháng hiện tại.
function LayThoiDiemKetThucUuDai() {
  const BayGio = new Date();
  return new Date(BayGio.getFullYear(), BayGio.getMonth() + 1, 1).getTime();
}

function useDemNguoc(ThoiDiemKetThuc: number) {
  const [ConLai, SetConLai] = useState(() =>
    Math.max(0, ThoiDiemKetThuc - Date.now()),
  );

  useEffect(() => {
    const BoDem = window.setInterval(() => {
      SetConLai(Math.max(0, ThoiDiemKetThuc - Date.now()));
    }, 1000);
    return () => window.clearInterval(BoDem);
  }, [ThoiDiemKetThuc]);

  const TongGiay = Math.floor(ConLai / 1000);
  return {
    Ngay: Math.floor(TongGiay / 86400),
    Gio: Math.floor((TongGiay % 86400) / 3600),
    Phut: Math.floor((TongGiay % 3600) / 60),
    Giay: TongGiay % 60,
  };
}

function DongHoDemNguoc() {
  const [ThoiDiemKetThuc] = useState(LayThoiDiemKetThucUuDai);
  const { Ngay, Gio, Phut, Giay } = useDemNguoc(ThoiDiemKetThuc);
  const CacO = [
    [Ngay, "Ngày"],
    [Gio, "Giờ"],
    [Phut, "Phút"],
    [Giay, "Giây"],
  ] as const;

  return (
    <div
      aria-label="Thời gian ưu đãi còn lại"
      className="dong-ho-dem-nguoc"
      role="timer"
    >
      {CacO.map(([GiaTri, Nhan]) => (
        <span className="o-dem-nguoc" key={Nhan}>
          <strong>{String(GiaTri).padStart(2, "0")}</strong>
          <small>{Nhan}</small>
        </span>
      ))}
    </div>
  );
}

function BangGia({ ChonGoi: ChonGoi }: { ChonGoi: (Ma: MaGoiDichVu) => void }) {
  const [KieuThanhToanDaChon, SetKieuThanhToanDaChon] =
    useState<KieuThanhToan>("nam");

  return (
    <section
      className="phan-cong-khai phan-bang-gia"
      id="bang-gia"
      aria-labelledby="tieu-de-bang-gia"
    >
      <div className="khung-noi-dung-cong-khai">
        <div className="bang-uu-dai">
          <div className="noi-dung-uu-dai">
            <span className="nhan-uu-dai">
              <Timer aria-hidden size={15} /> Siêu ưu đãi cuối năm
            </span>
            <strong>
              Giảm ngay {TiLeGiamGia}% cho mọi gói — chỉ trong tháng này
            </strong>
            <p>
              Giữ nguyên giá ưu đãi suốt thời gian sử dụng cho đơn vị đăng ký
              trước khi đồng hồ về 0.
            </p>
          </div>
          <DongHoDemNguoc />
        </div>

        <div className="tieu-de-phan tieu-de-bang-gia">
          <h2 id="tieu-de-bang-gia">Bảng giá minh bạch, mở rộng linh hoạt</h2>
          <p>
            Bắt đầu miễn phí 14 ngày, không cần thẻ thanh toán. Nâng cấp, hạ cấp
            hoặc hủy bất cứ lúc nào.
          </p>
          <div
            className="chon-kieu-thanh-toan"
            role="group"
            aria-label="Chu kỳ thanh toán"
          >
            <button
              aria-pressed={KieuThanhToanDaChon === "thang"}
              onClick={() => SetKieuThanhToanDaChon("thang")}
              type="button"
            >
              Theo tháng
            </button>
            <button
              aria-pressed={KieuThanhToanDaChon === "nam"}
              onClick={() => SetKieuThanhToanDaChon("nam")}
              type="button"
            >
              Theo năm
              <em>Tiết kiệm thêm {TiLeGiamThemTheoNam}%</em>
            </button>
          </div>
        </div>

        <div className="luoi-goi-dich-vu">
          {CacGoiDichVu.map((Goi) => (
            <article
              className={
                Goi.NoiBat
                  ? "the-goi-dich-vu the-goi-noi-bat"
                  : "the-goi-dich-vu"
              }
              key={Goi.Ma}
            >
              {Goi.NoiBat && (
                <span className="nhan-pho-bien">Phổ biến nhất</span>
              )}
              <h3>{Goi.Ten}</h3>
              <p className="mo-ta-goi">{Goi.MoTa}</p>
              <div className="khu-gia">
                {Goi.GiaGoc === null ? (
                  <>
                    <span className="gia-goc">Theo quy mô đơn vị</span>
                    <strong className="gia-lien-he">Báo giá riêng</strong>
                    <span className="ghi-chu-gia">
                      Ưu đãi {TiLeGiamGia}% năm đầu
                    </span>
                  </>
                ) : (
                  <>
                    <span className="gia-goc">
                      <s>{DinhDangTien(Goi.GiaGoc)}</s>
                      <em>-{TiLeGiamGia}%</em>
                    </span>
                    <strong>
                      {DinhDangTien(
                        TinhGiaUuDai(Goi.GiaGoc, KieuThanhToanDaChon),
                      )}
                      <small>/tháng</small>
                    </strong>
                    <span className="ghi-chu-gia">
                      {KieuThanhToanDaChon === "nam"
                        ? "Thanh toán theo năm"
                        : "Thanh toán theo tháng"}
                    </span>
                  </>
                )}
              </div>
              <a
                className={
                  Goi.NoiBat
                    ? "nut-cong-khai nut-chinh nut-goi"
                    : "nut-cong-khai nut-phu nut-goi"
                }
                href="#lien-he"
                onClick={() => ChonGoi(Goi.Ma)}
              >
                {Goi.GiaGoc === null ? "Liên hệ tư vấn" : "Dùng thử miễn phí"}
                <ArrowRight aria-hidden size={17} />
              </a>
              <ul>
                {Goi.CacQuyenLoi.map((QuyenLoi) => (
                  <li key={QuyenLoi}>
                    <Check aria-hidden size={16} />
                    {QuyenLoi}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="chu-thich-bang-gia">
          Giá chưa bao gồm VAT. Ưu đãi áp dụng cho đơn vị đăng ký mới trong thời
          gian diễn ra chương trình.
        </p>
      </div>
    </section>
  );
}

const CacNhanXet = [
  {
    HoTen: "Nguyễn Minh Anh",
    VaiTro: "Nhà sản xuất",
    DonVi: "Lam Phương Media",
    SoSao: 5,
    NoiDung:
      "Trước đây mỗi tuần mất gần một ngày chỉ để xếp lịch Studio và gọi điện xác nhận ê-kíp. Giờ mọi thứ nằm trên một màn hình, cả đội nhìn là hiểu.",
  },
  {
    HoTen: "Trần Quốc Huy",
    VaiTro: "Trưởng kho thiết bị",
    DonVi: "Sao Mai Production",
    SoSao: 5,
    NoiDung:
      "Quét QR để xuất nhập kho nhanh hơn hẳn. Thiết bị nào đang ở ca quay nào, ai đang giữ, tôi đều biết ngay mà không cần sổ sách.",
  },
  {
    HoTen: "Lê Thu Hà",
    VaiTro: "Điều phối sản xuất",
    DonVi: "Kênh Ánh Dương",
    SoSao: 5,
    NoiDung:
      "Cảnh báo trùng lịch giúp chúng tôi không ít lần. Hệ thống báo trước và gợi ý luôn máy quay thay thế, không còn cảnh rối phút chót.",
  },
  {
    HoTen: "Phạm Gia Bảo",
    VaiTro: "Đạo diễn",
    DonVi: "Studio Mộc",
    SoSao: 4,
    NoiDung:
      "Mở điện thoại là thấy ca quay của mình, thiết bị và người cùng làm. Giao diện rõ ràng, ê-kíp mới vào cũng dùng được ngay.",
  },
  {
    HoTen: "Võ Ngọc Trâm",
    VaiTro: "Giám đốc vận hành",
    DonVi: "Hải Đăng Entertainment",
    SoSao: 5,
    NoiDung:
      "Báo cáo vận hành giúp ban giám đốc thấy rõ hiệu suất Studio và thiết bị. Chúng tôi giảm gần 30% chi phí thuê ngoài chỉ sau một quý.",
  },
  {
    HoTen: "Đặng Hoàng Long",
    VaiTro: "Kỹ thuật viên ánh sáng",
    DonVi: "Mây Trắng Creative",
    SoSao: 5,
    NoiDung:
      "Đội hỗ trợ phản hồi rất nhanh, hướng dẫn tận tình. Chỉ một buổi chiều là cả phòng kỹ thuật đã làm quen xong.",
  },
] as const;

const PhanBoDanhGia = [
  [5, 86],
  [4, 11],
  [3, 2],
  [2, 1],
  [1, 0],
] as const;

function LayChuCaiDau(HoTen: string) {
  const CacTu = HoTen.trim().split(/\s+/);
  const TuDau = CacTu[0] ?? "";
  const TuCuoi = CacTu[CacTu.length - 1] ?? "";
  return `${TuDau.charAt(0)}${TuCuoi.charAt(0)}`.toUpperCase();
}

function DanhGiaKhachHang() {
  return (
    <section
      className="phan-cong-khai phan-danh-gia"
      id="danh-gia"
      aria-labelledby="tieu-de-danh-gia"
    >
      <div className="khung-noi-dung-cong-khai">
        <div className="luoi-tong-quan-danh-gia">
          <div className="tieu-de-phan">
            <h2 id="tieu-de-danh-gia">Hơn 1.200 ê-kíp sản xuất đã tin chọn</h2>
            <p>
              Từ Studio độc lập đến kênh truyền hình, khách hàng chọn MEDIOPS vì
              sự rõ ràng, tốc độ và đội ngũ đồng hành tận tâm.
            </p>
          </div>
          <div className="tong-quan-danh-gia">
            <div className="diem-trung-binh">
              <strong>4,9</strong>
              <DanhGiaSao SoSao={5} KichThuoc={18} />
              <span>Dựa trên 1.248 đánh giá</span>
            </div>
            <ul aria-label="Phân bổ số sao">
              {PhanBoDanhGia.map(([SoSao, TiLe]) => (
                <li key={SoSao}>
                  <span>{SoSao} sao</span>
                  <span className="thanh-ti-le" aria-hidden="true">
                    <i style={{ width: `${TiLe}%` }} />
                  </span>
                  <span>{TiLe}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="luoi-nhan-xet">
          {CacNhanXet.map((NhanXet) => (
            <figure className="the-nhan-xet" key={NhanXet.HoTen}>
              <div className="dau-the-nhan-xet">
                <DanhGiaSao SoSao={NhanXet.SoSao} />
                <Quote aria-hidden size={22} />
              </div>
              <blockquote>{NhanXet.NoiDung}</blockquote>
              <figcaption>
                <span className="chu-cai-dau" aria-hidden="true">
                  {LayChuCaiDau(NhanXet.HoTen)}
                </span>
                <span>
                  <strong>{NhanXet.HoTen}</strong>
                  <small>
                    {NhanXet.VaiTro} · {NhanXet.DonVi}
                  </small>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

type DuLieuLienHe = z.infer<typeof SchemaLienHe>;

const NhanGoiQuanTam: Record<DuLieuLienHe["GoiQuanTam"], string> = {
  ChuaChon: "Tôi cần được tư vấn",
  KhoiDau: "Gói Khởi đầu",
  ChuyenNghiep: "Gói Chuyên nghiệp",
  DoanhNghiep: "Gói Doanh nghiệp",
};

function LienHe({ GoiDaChon: GoiDaChon }: { GoiDaChon: MaGoiDichVu | null }) {
  const {
    register: Register,
    handleSubmit: HandleSubmit,
    reset: Reset,
    setValue: SetValue,
    formState: { errors: Errors, isSubmitting: IsSubmitting },
  } = useForm<DuLieuLienHe>({
    resolver: zodResolver(SchemaLienHe),
    defaultValues: {
      HoTen: "",
      Email: "",
      SoDienThoai: "",
      TenDonVi: "",
      GoiQuanTam: "ChuaChon",
      NoiDung: "",
    },
  });

  useEffect(() => {
    if (GoiDaChon !== null) {
      SetValue("GoiQuanTam", GoiDaChon);
    }
  }, [GoiDaChon, SetValue]);

  function XuLyGuiLienHe(DuLieu: DuLieuLienHe) {
    toast.success(
      `Cảm ơn ${DuLieu.HoTen}! Chuyên viên MEDIOPS sẽ liên hệ với bạn trong vòng 24 giờ làm việc.`,
    );
    Reset();
  }

  const CacKenhLienHe = [
    [Phone, "Đường dây nóng", "1900 6868"],
    [Mail, "Email", "hotro@mediops.vn"],
    [MapPin, "Văn phòng", "Quận 1, TP. Hồ Chí Minh"],
  ] as const;

  return (
    <section
      className="phan-cong-khai phan-lien-he"
      id="lien-he"
      aria-labelledby="tieu-de-lien-he"
    >
      <div className="khung-noi-dung-cong-khai luoi-lien-he">
        <div className="noi-dung-lien-he">
          <h2 id="tieu-de-lien-he">Nhận tư vấn và bản dùng thử miễn phí</h2>
          <p>
            Để lại thông tin, chuyên viên của chúng tôi sẽ thiết lập không gian
            dùng thử phù hợp với quy mô đội ngũ của bạn chỉ trong một ngày làm
            việc.
          </p>
          <ul className="danh-sach-kenh-lien-he">
            {CacKenhLienHe.map(([BieuTuong, Nhan, GiaTri]) => (
              <li key={Nhan}>
                <span>
                  <BieuTuong aria-hidden size={18} />
                </span>
                <span>
                  <small>{Nhan}</small>
                  <strong>{GiaTri}</strong>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <form
          className="bieu-mau-lien-he"
          noValidate
          onSubmit={HandleSubmit(XuLyGuiLienHe)}
        >
          <div className="hang-truong-lien-he">
            <label>
              <span>Họ và tên</span>
              <input
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                {...Register("HoTen")}
              />
              {Errors.HoTen && <em role="alert">{Errors.HoTen.message}</em>}
            </label>
            <label>
              <span>Email công việc</span>
              <input
                autoComplete="email"
                placeholder="ban@donvi.vn"
                type="email"
                {...Register("Email")}
              />
              {Errors.Email && <em role="alert">{Errors.Email.message}</em>}
            </label>
          </div>
          <div className="hang-truong-lien-he">
            <label>
              <span>Số điện thoại</span>
              <input
                autoComplete="tel"
                inputMode="tel"
                placeholder="0901234567"
                {...Register("SoDienThoai")}
              />
              {Errors.SoDienThoai && (
                <em role="alert">{Errors.SoDienThoai.message}</em>
              )}
            </label>
            <label>
              <span>Tên đơn vị (không bắt buộc)</span>
              <input
                autoComplete="organization"
                placeholder="Công ty, Studio hoặc kênh"
                {...Register("TenDonVi")}
              />
              {Errors.TenDonVi && (
                <em role="alert">{Errors.TenDonVi.message}</em>
              )}
            </label>
          </div>
          <label>
            <span>Gói quan tâm</span>
            <select {...Register("GoiQuanTam")}>
              {Object.entries(NhanGoiQuanTam).map(([GiaTri, Nhan]) => (
                <option key={GiaTri} value={GiaTri}>
                  {Nhan}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Nhu cầu của bạn</span>
            <textarea
              placeholder="Ví dụ: đội 20 người, 3 Studio, cần quản lý khoảng 300 thiết bị…"
              rows={4}
              {...Register("NoiDung")}
            />
            {Errors.NoiDung && <em role="alert">{Errors.NoiDung.message}</em>}
          </label>
          <button
            className="nut-cong-khai nut-chinh"
            disabled={IsSubmitting}
            type="submit"
          >
            {IsSubmitting ? "Đang gửi…" : "Gửi yêu cầu tư vấn"}
            <ArrowRight aria-hidden size={18} />
          </button>
          <p className="ghi-chu-bieu-mau">
            <ShieldCheck aria-hidden size={15} />
            Thông tin của bạn được bảo mật và chỉ dùng để liên hệ tư vấn.
          </p>
        </form>
      </div>
    </section>
  );
}

function KeuGoiCuoi() {
  return (
    <section className="phan-keu-goi" aria-labelledby="tieu-de-keu-goi">
      <div className="khung-noi-dung-cong-khai noi-dung-keu-goi">
        <img src={LogoChinh} alt="MEDIOPS" height={2000} width={2000} />
        <div>
          <h2 id="tieu-de-keu-goi">
            Buổi quay tiếp theo, hãy để MEDIOPS lo phần điều phối.
          </h2>
          <p>Mọi nguồn lực sản xuất, một nhịp điều phối.</p>
        </div>
        <div className="hanh-dong-keu-goi">
          <a className="nut-cong-khai nut-chinh" href="#lien-he">
            Bắt đầu miễn phí
            <ArrowRight aria-hidden size={18} />
          </a>
          <Link className="nut-cong-khai nut-phu" to="/dang-nhap">
            <LogIn aria-hidden size={18} />
            Đăng nhập
          </Link>
        </div>
      </div>
    </section>
  );
}

export function TrangChu() {
  const [MoMenu, SetMoMenu] = useState(false);
  const [GoiDaChon, SetGoiDaChon] = useState<MaGoiDichVu | null>(null);

  return (
    <div className="trang-chu-cong-khai">
      <a className="bo-qua-dieu-huong" href="#noi-dung-chinh">
        Đi đến nội dung chính
      </a>
      <header className="dau-trang-cong-khai">
        <div className="khung-noi-dung-cong-khai noi-dung-dau-trang">
          <a href="#dau-trang" aria-label="MEDIOPS - Trang chủ">
            <ThuongHieu />
          </a>
          <nav
            className="dieu-huong-desktop"
            aria-label="Điều hướng trang giới thiệu"
          >
            {CacMucDieuHuong.map(([DuongDan, Nhan]) => (
              <a href={DuongDan} key={DuongDan}>
                {Nhan}
              </a>
            ))}
          </nav>
          <div className="hanh-dong-dau-trang">
            <Link className="lien-ket-dang-nhap" to="/dang-nhap">
              Đăng nhập
            </Link>
            <a className="nut-cong-khai nut-chinh nut-gon" href="#lien-he">
              Dùng thử miễn phí
            </a>
          </div>
          <button
            aria-expanded={MoMenu}
            aria-label={MoMenu ? "Đóng trình đơn" : "Mở trình đơn"}
            className="nut-menu"
            onClick={() => SetMoMenu((DangMo) => !DangMo)}
            type="button"
          >
            {MoMenu ? (
              <X aria-hidden size={21} />
            ) : (
              <Menu aria-hidden size={21} />
            )}
          </button>
        </div>
        {MoMenu && (
          <nav
            className="dieu-huong-mobile"
            aria-label="Điều hướng trang giới thiệu trên thiết bị nhỏ"
          >
            {CacMucDieuHuong.map(([DuongDan, Nhan]) => (
              <a
                href={DuongDan}
                key={DuongDan}
                onClick={() => SetMoMenu(false)}
              >
                {Nhan}
              </a>
            ))}
            <Link to="/dang-nhap" onClick={() => SetMoMenu(false)}>
              Đăng nhập
            </Link>
          </nav>
        )}
      </header>

      <main id="noi-dung-chinh">
        <div id="dau-trang" />
        <AnhHung />
        <ChiSoNiemTin />
        <NangLucSanPham />
        <QuyTrinhSanXuat />
        <XemTruocSanPham />
        <DieuPhoiTaiNguyen />
        <XungDotLich />
        <LuongQR />
        <BangGia ChonGoi={SetGoiDaChon} />
        <DanhGiaKhachHang />
        <LienHe GoiDaChon={GoiDaChon} />
        <KeuGoiCuoi />
      </main>

      <footer className="chan-trang-cong-khai">
        <div className="khung-noi-dung-cong-khai noi-dung-chan-trang">
          <ThuongHieu Gon />
          <p>
            Nền tảng lập lịch và điều phối nguồn lực sản xuất truyền thông. ©{" "}
            {new Date().getFullYear()} MEDIOPS.
          </p>
          <a href="#dau-trang">Trở về đầu trang</a>
        </div>
      </footer>
    </div>
  );
}
