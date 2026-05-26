import { describe, it, expect } from "vitest";
import { generatePDF, PDFData } from "../../../src/utils/pdf";

const mockData: PDFData = {
  teacherName: "Mario Rossi",
  teacherAddress: "Via Roma 1, HK",
  teacherEmail: "mario@test.com",
  teacherPhone: "+852 1234 5678",
  brNumber: "BR-12345",
  bankDetails: "HSBC 123-456-789",
  customerName: "Scuola Italiana HK",
  customerAddress: "123 Nathan Road, HK",
  invoiceNumber: "INV-2026-0001",
  issueDate: "2026-05-27",
  dueDate: "2026-06-26",
  subtotal: 1000,
  discountPercent: 10,
  discountAmount: 100,
  total: 900,
  paymentTerms: "30 giorni",
  notes: "Nota di prova",
  items: [
    { description: "Lezione individuale", lesson_date: "2026-05-20", hours: 2, rate: 500, amount: 1000 },
  ],
  language: "it",
};

describe("generatePDF", () => {
  it("should generate a valid PDF with all fields", () => {
    const doc = generatePDF(mockData);
    expect(doc).toBeDefined();
    const buf = doc.output("arraybuffer");
    expect(buf.byteLength).toBeGreaterThan(500);
    // Verifica che sia un PDF valido (inizia con %PDF)
    const bytes = new Uint8Array(buf);
    const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    expect(header).toBe("%PDF");
  });

  it("should generate English PDF", () => {
    const doc = generatePDF({ ...mockData, language: "en" });
    expect(doc.output("arraybuffer").byteLength).toBeGreaterThan(500);
  });

  it("should handle null/empty optional fields", () => {
    const doc = generatePDF({
      ...mockData,
      brNumber: null,
      bankDetails: null,
      paymentTerms: null,
      notes: null,
      teacherEmail: undefined,
      teacherPhone: undefined,
      discountPercent: 0,
      discountAmount: 0,
    });
    expect(doc.output("arraybuffer").byteLength).toBeGreaterThan(500);
  });

  it("should handle multiple items", () => {
    const doc = generatePDF({
      ...mockData,
      items: [
        { description: "Lezione 1", lesson_date: "2026-05-20", hours: 2, rate: 500, amount: 1000 },
        { description: "Lezione 2", lesson_date: "2026-05-22", hours: 1.5, rate: 500, amount: 750 },
        { description: "Lezione 3", lesson_date: "2026-05-24", hours: 1, rate: 600, amount: 600 },
      ],
      subtotal: 2350,
      discountPercent: 0,
      discountAmount: 0,
      total: 2350,
    });
    const buf = doc.output("arraybuffer");
    expect(buf.byteLength).toBeGreaterThan(500);
  });
});
