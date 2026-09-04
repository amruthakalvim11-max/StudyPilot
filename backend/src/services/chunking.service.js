const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE) || 1000;
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP) || 200;

/**
 * Chunks a large text into smaller segments with overlap.
 * @param {string} text - The full text to chunk.
 * @param {string} materialId - The associated StudyMaterial ID.
 * @returns {Array<object>} Array of chunk objects { materialId, chunkIndex, text, page }
 */
exports.chunkText = (text, materialId) => {
  if (!text || text.trim().length === 0) return [];
  
  const chunks = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + CHUNK_SIZE;
    
    // Attempt to end on a word boundary if we aren't at the end of the text
    if (endIndex < text.length) {
      let nextSpace = text.indexOf(' ', endIndex);
      let prevSpace = text.lastIndexOf(' ', endIndex);
      
      if (prevSpace > startIndex) {
        endIndex = prevSpace;
      } else if (nextSpace !== -1) {
        endIndex = nextSpace;
      }
    }

    const chunkText = text.substring(startIndex, endIndex).trim();
    
    if (chunkText.length > 0) {
      chunks.push({
        materialId,
        chunkIndex,
        text: chunkText,
        page: null // Simplification: page numbers require advanced parsing not available uniformly across all extractors
      });
      chunkIndex++;
    }

    // Advance startIndex by chunk size minus overlap, ensuring progress
    startIndex += (CHUNK_SIZE - CHUNK_OVERLAP);
    
    // Prevent infinite loops if overlap >= chunk size
    if (startIndex <= chunks[chunks.length - 1].startIndex) {
        startIndex = endIndex;
    }
  }

  return chunks;
};
