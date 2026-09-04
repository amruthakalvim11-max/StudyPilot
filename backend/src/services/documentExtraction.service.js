const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts text from a given file path based on its MIME type.
 * @param {string} filePath - Path to the uploaded file.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {Promise<string>} The extracted text.
 */
exports.extractText = async (filePath, mimeType) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist');
    }

    let text = '';

    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } 
    else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      mimeType === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } 
    else if (mimeType === 'text/plain') {
      text = fs.readFileSync(filePath, 'utf8');
    } 
    else {
      throw new Error('Unsupported file type for extraction');
    }

    // Clean up excessive whitespace
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    if (!cleanText) {
      throw new Error('Extracted text is empty');
    }

    return cleanText;
  } catch (error) {
    console.error('Text Extraction Error:', error);
    throw new Error('Failed to extract text: ' + error.message);
  }
};
