const prisma = require('../config/prisma');
const pricingConfig = require('../config/ai-pricing');

class AiUsageService {
  /**
   * Translates SDK usageMetadata to DB payload and derives cost.
   * Tolerates missing metadata explicitly as null.
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.model - e.g., 'gemini-2.5-flash'
   * @param {string} params.operation - 'TUTOR', 'RAG', 'FUNCTION_CALL', 'AGENT', 'STREAM'
   * @param {Object} params.usageMetadata - raw object from SDK
   * @param {boolean} params.failed - if request failed
   */
  async recordUsage({ userId, model, operation, usageMetadata, failed = false }) {
    // 1. Calculate Cost if metadata exists
    let inputTokens = null;
    let outputTokens = null;
    let totalTokens = null;
    let cachedTokens = null;
    
    let estimatedInputCost = null;
    let estimatedOutputCost = null;
    let estimatedTotalCost = null;

    if (usageMetadata) {
      inputTokens = usageMetadata.promptTokenCount ?? null;
      outputTokens = usageMetadata.candidatesTokenCount ?? null;
      totalTokens = usageMetadata.totalTokenCount ?? null;
      cachedTokens = usageMetadata.cachedContentTokenCount ?? null;
      
      const pricing = pricingConfig[model];
      if (pricing) {
        if (inputTokens !== null) {
          // If cached tokens are present, split input cost
          if (cachedTokens !== null && cachedTokens > 0) {
            const standardInput = Math.max(0, inputTokens - cachedTokens);
            const standardCost = (standardInput / 1000000) * pricing.inputPerMillionTokens;
            const cachedCost = (cachedTokens / 1000000) * pricing.cachedInputPerMillionTokens;
            estimatedInputCost = standardCost + cachedCost;
          } else {
            estimatedInputCost = (inputTokens / 1000000) * pricing.inputPerMillionTokens;
          }
        }
        
        if (outputTokens !== null) {
          estimatedOutputCost = (outputTokens / 1000000) * pricing.outputPerMillionTokens;
        }

        if (estimatedInputCost !== null || estimatedOutputCost !== null) {
          estimatedTotalCost = (estimatedInputCost || 0) + (estimatedOutputCost || 0);
        }
      }
    }

    // 2. Persist to DB
    const usageRecord = await prisma.aiUsage.create({
      data: {
        userId: userId || null,
        model,
        operation,
        inputTokens,
        outputTokens,
        totalTokens,
        cachedTokens,
        estimatedInputCost,
        estimatedOutputCost,
        estimatedTotalCost,
        status: failed ? 'FAILED' : 'SUCCESS',
        currency: pricingConfig[model]?.currency || 'USD'
      }
    });

    return usageRecord;
  }

  /**
   * Retrieves summary usage metrics for a given user
   */
  async getUsageSummary(userId) {
    if (!userId) return null;

    const aggregates = await prisma.aiUsage.aggregate({
      where: { userId },
      _count: { _all: true },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        estimatedTotalCost: true
      }
    });

    const byOperation = await prisma.aiUsage.groupBy({
      by: ['operation'],
      where: { userId },
      _count: { _all: true },
      _sum: {
        totalTokens: true,
        estimatedTotalCost: true
      }
    });

    return {
      totalRequests: aggregates._count._all,
      totalTokens: aggregates._sum.totalTokens || 0,
      inputTokens: aggregates._sum.inputTokens || 0,
      outputTokens: aggregates._sum.outputTokens || 0,
      totalCost: aggregates._sum.estimatedTotalCost || 0,
      byOperation: byOperation.map(op => ({
        operation: op.operation,
        requests: op._count._all,
        totalTokens: op._sum.totalTokens || 0,
        totalCost: op._sum.estimatedTotalCost || 0
      }))
    };
  }
}

module.exports = new AiUsageService();
