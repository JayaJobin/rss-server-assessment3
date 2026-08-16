import { FeedStatus, FeedHealth } from '../models/FeedStatus';

export const feedStatusRepository = {
  findAll: () => FeedStatus.findAll({ order: [['label', 'ASC']] }),

  upsert: async (params: {
    feedSourceId: number | null;
    label: string;
    status: FeedHealth;
    message?: string | null;
  }) => {
    const existing = await FeedStatus.findOne({ where: { feedSourceId: params.feedSourceId } });
    if (existing) {
      existing.label = params.label;
      existing.status = params.status;
      existing.message = params.message ?? null;
      existing.lastCheckedAt = new Date();
      await existing.save();
      return existing;
    }
    return FeedStatus.create({
      feedSourceId: params.feedSourceId,
      label: params.label,
      status: params.status,
      message: params.message ?? null,
      lastCheckedAt: new Date(),
    });
  },
};
