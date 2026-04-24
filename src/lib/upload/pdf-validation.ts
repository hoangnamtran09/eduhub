const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024;
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46];

export async function validatePdfFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return "Please upload a PDF file";
  }

  if (file.size <= 0) {
    return "PDF file is empty";
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return "PDF file must be 25MB or smaller";
  }

  if (file.type && file.type !== "application/pdf") {
    return "Invalid PDF content type";
  }

  const header = new Uint8Array(await file.slice(0, PDF_MAGIC_BYTES.length).arrayBuffer());
  const hasPdfHeader = PDF_MAGIC_BYTES.every((byte, index) => header[index] === byte);

  if (!hasPdfHeader) {
    return "Invalid PDF file";
  }

  return null;
}
