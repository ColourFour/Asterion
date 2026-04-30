import type { TopicProfile } from '../../types';
import { checkmarkForRank } from '../../lib/mastery';
import { P3_TOPIC_MAP } from '../../lib/topicMap';

interface TopicGridProps {
  selectedTopic?: string;
  profiles: Record<string, TopicProfile>;
  onSelect: (topic: string) => void;
}

export function TopicGrid({ selectedTopic, profiles, onSelect }: TopicGridProps) {
  return (
    <div className="topic-grid">
      {P3_TOPIC_MAP.map((topic) => {
        const profile = profiles[topic.label];
        return (
          <button key={topic.id} type="button" className={selectedTopic === topic.label ? 'topic-tile selected' : 'topic-tile'} onClick={() => onSelect(topic.label)}>
            <strong>{topic.label}</strong>
            <span>{profile ? checkmarkForRank(profile.rank) : '○'}</span>
          </button>
        );
      })}
    </div>
  );
}
