import { fn, col, Op } from 'sequelize';
import { RequestLog, FeedSource } from '../models';

export const requestLogRepository = {
  log: (entry: { path: string; method: string; clientId: string; feedSourceId?: number | null; statusCode?: number }) =>
    RequestLog.create({
      path: entry.path,
      method: entry.method,
      clientId: entry.clientId,
      feedSourceId: entry.feedSourceId ?? null,
      statusCode: entry.statusCode ?? 200,
    }),

  totalCount: () => RequestLog.count(),

  uniqueClientCount: async (): Promise<number> => {
    const rows = await RequestLog.findAll({
      attributes: [[fn('DISTINCT', col('clientId')), 'clientId']],
      raw: true,
    });
    return rows.length;
  },

  requestsPerFeed: async (): Promise<{ feedSourceId: number | null; feedName: string; count: number }[]> => {
    const rows = (await RequestLog.findAll({
      attributes: ['feedSourceId', [fn('COUNT', col('RequestLog.id')), 'count']],
      include: [{ model: FeedSource, as: 'feedSource', attributes: ['name'], required: false }],
      where: { feedSourceId: { [Op.ne]: null } },
      group: ['feedSourceId'],
      raw: true,
      nest: true,
    })) as unknown as { feedSourceId: number | null; count: string; feedSource: { name: string } | null }[];

    return rows
      .filter((r) => r.feedSourceId !== null)
      .map((r) => ({
        feedSourceId: r.feedSourceId,
        feedName: r.feedSource?.name ?? `Feed #${r.feedSourceId}`,
        count: Number(r.count),
      }))
      .sort((a, b) => b.count - a.count);
  },

  requestsPerClient: async (limit = 20): Promise<{ clientId: string; count: number }[]> => {
    const rows = (await RequestLog.findAll({
      attributes: ['clientId', [fn('COUNT', col('id')), 'count']],
      group: ['clientId'],
      raw: true,
    })) as unknown as { clientId: string; count: string }[];

    return rows
      .map((r) => ({ clientId: r.clientId, count: Number(r.count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },
};
