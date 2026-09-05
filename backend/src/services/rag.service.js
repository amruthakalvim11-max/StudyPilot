const prisma = require('../config/prisma');
const embeddingService = require('./embedding.service');

const TOP_K_DEFAULT = parseInt(process.env.RAG_TOP_K) || 5;

/**
 * Perform a semantic vector search across a user's study materials.
 * Uses pgvector cosine distance (<=>) for retrieval.
 */
exports.retrieveRelevantChunks = async ({ userId, query, materialIds = [], topK = TOP_K_DEFAULT, useMock = false }) => {
  if (!query || query.trim().length === 0) return [];

  // 1. Generate query embedding
  const queryEmbedding = await embeddingService.generateEmbedding(query, useMock);
  const queryEmbeddingString = `[${queryEmbedding.join(',')}]`;

  // 2. Perform vector similarity search
  // Security: JOIN StudyMaterial to guarantee that ONLY the authenticated user's chunks are returned.
  let results;

  try {
    if (materialIds.length > 0) {
      // Filter by specified materialIds AND userId
      results = await prisma.$queryRaw`
        SELECT 
          c.id AS "chunkId",
          c."chunkIndex",
          c.text,
          c.page,
          m.id AS "materialId",
          m."originalFilename" AS "materialName",
          1 - (c.embedding <=> ${queryEmbeddingString}::vector) AS similarity
        FROM "DocumentChunk" c
        JOIN "StudyMaterial" m ON c."materialId" = m.id
        WHERE m."userId" = ${userId} 
          AND m.id = ANY(${materialIds})
        ORDER BY c.embedding <=> ${queryEmbeddingString}::vector
        LIMIT ${topK}
      `;
    } else {
      // Search across ALL of the user's materials
      results = await prisma.$queryRaw`
        SELECT 
          c.id AS "chunkId",
          c."chunkIndex",
          c.text,
          c.page,
          m.id AS "materialId",
          m."originalFilename" AS "materialName",
          1 - (c.embedding <=> ${queryEmbeddingString}::vector) AS similarity
        FROM "DocumentChunk" c
        JOIN "StudyMaterial" m ON c."materialId" = m.id
        WHERE m."userId" = ${userId}
        ORDER BY c.embedding <=> ${queryEmbeddingString}::vector
        LIMIT ${topK}
      `;
    }

    return results.map(row => ({
      chunkId: row.chunkId,
      chunkIndex: row.chunkIndex,
      text: row.text,
      page: row.page,
      materialId: row.materialId,
      materialName: row.materialName,
      similarity: row.similarity
    }));

  } catch (error) {
    console.error('Semantic Retrieval Error:', error);
    throw new Error('Failed to retrieve relevant context');
  }
};
