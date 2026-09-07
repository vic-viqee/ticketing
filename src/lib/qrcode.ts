import QRCode from "qrcode";

export async function generateQrCodeBuffer(text: string) {
  return QRCode.toBuffer(text, {
    width: 600,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}
