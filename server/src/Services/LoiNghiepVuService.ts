import type { ChiTietXungDot } from "./ThuatToanXungDotService.js";

export class LoiKhongTimThay extends Error {}

export class LoiDuLieuKhongHopLe extends Error {}

export class LoiXungDotDuLieu extends Error {}

export class LoiVanHanhKho extends Error {
  constructor(
    Message: string,
    public readonly MaTrangThai: number,
    public readonly MaLoi: string,
    public readonly DuLieuBoSung?: Record<string, unknown>,
  ) {
    super(Message);
  }
}

export class LoiSuCoBaoTri extends Error {
  constructor(
    Message: string,
    public readonly MaTrangThai: number,
    public readonly MaLoi: string,
  ) {
    super(Message);
  }
}

export class LoiXungDotLichCaQuay extends Error {
  constructor(
    Message: string,
    public readonly DanhSachXungDot: ChiTietXungDot[],
  ) {
    super(Message);
  }
}
