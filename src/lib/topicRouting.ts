import type { RegionDefinition } from '../types';
import { P3_TOPIC_ID_TO_REGION_ID, P3_TOPIC_ID_TO_REGION_NAME } from './p3SkillContract';
import type { QuestionRouteEvidenceStatus } from './questionRouteEvidence';

export interface TopicRoutingMetadata {
  primaryTopicId?: string;
  confidence?: string;
  reviewRequired?: boolean;
  reviewReasons?: string[];
  evidenceUsed?: string[];
  routingSource?: string;
  recordSource?: 'topic-routing-sidecar' | 'source-record';
  paperFamily?: string;
  evidenceStatus?: QuestionRouteEvidenceStatus;
  mappedRegionId?: string;
  topicDistribution?: Array<{
    topicId: string;
    fitPercent?: number;
    mappedRegionId?: string;
  }>;
}

export { P3_TOPIC_ID_TO_REGION_ID, P3_TOPIC_ID_TO_REGION_NAME };

export function regionForTopicRouting(
  routing: TopicRoutingMetadata | undefined,
  regions: RegionDefinition[],
): RegionDefinition | undefined {
  if (!routing) return undefined;
  if (routing.mappedRegionId) {
    const mapped = regions.find((region) => region.id === routing.mappedRegionId);
    if (mapped) return mapped;
  }
  if (!routing.primaryTopicId) return undefined;
  return regions.find((region) => region.topicIds?.includes(routing.primaryTopicId as string));
}
