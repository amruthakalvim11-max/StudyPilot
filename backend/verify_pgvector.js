const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    const result = await prisma.$queryRawUnsafe("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';");
    console.log('PGVECTOR_VERIFICATION_RESULT:', result);
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
