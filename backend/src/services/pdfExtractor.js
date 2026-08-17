const fs = require('fs');
const pdfModule = require('pdf-parse');
const axios = require('axios');

/**
 * Extracts raw textual content from a PDF file
 * Supports pdf-parse v2 class API (PDFParse) and legacy function signature
 * @param {Object} options
 * @param {string} [options.filePath] - Local file system path to the PDF
 * @param {string} [options.fileUrl] - Remote URL (e.g. Cloudinary)
 * @param {Buffer} [options.buffer] - Raw file buffer
 * @returns {Promise<string>} Extracted normalized text
 */
const extractTextFromPDF = async ({ filePath, fileUrl, buffer }) => {
  let dataBuffer = buffer;

  try {
    if (!dataBuffer && filePath && fs.existsSync(filePath)) {
      dataBuffer = fs.readFileSync(filePath);
    } else if (!dataBuffer && fileUrl) {
      if (fileUrl.startsWith('http')) {
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        dataBuffer = Buffer.from(response.data);
      } else if (fs.existsSync(fileUrl)) {
        dataBuffer = fs.readFileSync(fileUrl);
      }
    }

    if (!dataBuffer) {
      throw new Error('No PDF file data accessible for text extraction.');
    }

    let rawText = '';

    // Check if pdf-parse is function or has PDFParse class
    if (typeof pdfModule === 'function') {
      const parsedData = await pdfModule(dataBuffer);
      rawText = parsedData.text || '';
    } else if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: dataBuffer });
      await parser.load();
      const result = await parser.getText();
      rawText = result?.text || '';
    } else if (typeof pdfModule.default === 'function') {
      const parsedData = await pdfModule.default(dataBuffer);
      rawText = parsedData.text || '';
    } else {
      throw new Error('Unsupported pdf-parse module structure.');
    }

    const cleanText = (rawText || '').trim();

    if (cleanText.length < 15) {
      throw new Error(
        'Could not extract text from this PDF. The document may be scanned, image-only, or empty. Please upload a searchable PDF.'
      );
    }

    return cleanText;
  } catch (error) {
    console.error('[PDFExtractor Error]:', error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

module.exports = {
  extractTextFromPDF,
};
