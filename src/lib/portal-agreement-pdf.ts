import PDFDocument from 'pdfkit';
import type PDFKit from 'pdfkit';
import {
  getAgreementSectionPlainBody,
  PORTAL_AGREEMENT_TITLE,
  PORTAL_AGREEMENT_VERSION,
  type PortalAgreementSection,
} from '@/lib/portal-agreement';

export type AgreementPdfSignature = {
  signerName: string;
  clientEmail?: string;
  signedAtLabel: string;
  agreementVersion: string;
};

function addAgreementPageHeaders(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  const headerPages = new Set([2, 3, 4]);

  for (let i = 0; i < range.count; i++) {
    const pageNumber = i + 1;
    if (!headerPages.has(pageNumber)) {
      continue;
    }

    doc.switchToPage(range.start + i);

    const oldTopMargin = doc.page.margins.top;
    doc.page.margins.top = 0;

    const headerY = oldTopMargin / 2;

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#444444')
      .text(PORTAL_AGREEMENT_TITLE, 0, headerY, {
        width: doc.page.width,
        align: 'center',
        lineBreak: false,
      });

    doc.page.margins.top = oldTopMargin;
  }

  doc.fillColor('#000000');
}

function addPageNumbers(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  const pageCount = range.count;

  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(range.start + i);

    const oldBottomMargin = doc.page.margins.bottom;
    // Allow writing into the bottom margin without triggering a new page.
    doc.page.margins.bottom = 0;

    const { width } = doc.page;
    const footerY = doc.page.height - oldBottomMargin / 2;

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`Page ${i + 1} of ${pageCount}`, 0, footerY, {
        width,
        align: 'center',
        lineBreak: false,
      });

    doc.page.margins.bottom = oldBottomMargin;
  }

  doc.fillColor('#000000');
}

export async function buildPortalAgreementPdf(
  sections: PortalAgreementSection[],
  signature?: AgreementPdfSignature
): Promise<Buffer> {

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56, size: 'LETTER', bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text(PORTAL_AGREEMENT_TITLE, { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#444444')
      .text(`Version ${PORTAL_AGREEMENT_VERSION}`, { align: 'center' });
    doc.moveDown(1.5);
    doc.fillColor('#000000');

    for (const section of sections) {
      doc.fontSize(11).font('Helvetica-Bold').text(section.heading);
      doc.moveDown(0.35);

      if (section.subsections) {
        for (const subsection of section.subsections) {
          doc.fontSize(10).font('Helvetica-Bold').text(subsection.title);
          doc.font('Helvetica').text(subsection.body, { align: 'left', lineGap: 3 });
          doc.moveDown(0.5);
        }
      } else {
        doc.fontSize(10).font('Helvetica').text(getAgreementSectionPlainBody(section), {
          align: 'left',
          lineGap: 3,
        });
      }

      doc.moveDown(1);
    }

    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').text('Signature');
    doc.moveDown(0.35);

    if (signature) {
      doc.fontSize(10).font('Helvetica-Bold').text('Client');
      doc.font('Helvetica');
      doc.text(`Full Name: ${signature.signerName}`);
      if (signature.clientEmail) {
        doc.text(`Email: ${signature.clientEmail}`);
      }
      doc.text(`Electronically signed on: ${signature.signedAtLabel}`);
      doc.moveDown(0.75);
      doc.text(`Agreement version: ${signature.agreementVersion}`);
    } else {
      doc.fontSize(10).font('Helvetica-Oblique').text('Unsigned — pending client electronic signature in the portal.');
    }

    addAgreementPageHeaders(doc);
    addPageNumbers(doc);
    doc.end();
  });
}

export async function buildProjectAgreementBodyPdf(options: {
  title: string;
  body: string;
  documentVersion: string;
  signature?: AgreementPdfSignature;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56, size: 'LETTER', bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text(options.title, { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#444444')
      .text(`Version ${options.documentVersion}`, { align: 'center' });
    doc.moveDown(1.5);
    doc.fillColor('#000000');

    doc.fontSize(10).font('Helvetica').text(options.body.trim() || '—', {
      align: 'left',
      lineGap: 3,
    });

    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica-Bold').text('Signature');
    doc.moveDown(0.35);

    if (options.signature) {
      doc.fontSize(10).font('Helvetica-Bold').text('Client');
      doc.font('Helvetica');
      doc.text(`Full Name: ${options.signature.signerName}`);
      if (options.signature.clientEmail) {
        doc.text(`Email: ${options.signature.clientEmail}`);
      }
      doc.text(`Electronically signed on: ${options.signature.signedAtLabel}`);
      doc.moveDown(0.75);
      doc.text(`Agreement version: ${options.signature.agreementVersion}`);
    } else {
      doc.fontSize(10).font('Helvetica-Oblique').text('Unsigned — pending client electronic signature in the portal.');
    }

    addPageNumbers(doc);
    doc.end();
  });
}
