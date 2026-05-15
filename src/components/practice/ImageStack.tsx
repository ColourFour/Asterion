import { useCallback, useEffect, useMemo, useState } from 'react';

export type ImageStackAvailability = 'pending' | 'available' | 'unavailable';

interface AssetImageProps {
  candidates: string[];
  alt: string;
  groupIndex: number;
  onStatusChange?: (groupIndex: number, status: ImageStackAvailability) => void;
}

function AssetImage({ candidates, alt, groupIndex, onStatusChange }: AssetImageProps) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const [status, setStatus] = useState<ImageStackAvailability>(candidates.length ? 'pending' : 'unavailable');

  useEffect(() => {
    setIndex(0);
    setFailed([]);
    setStatus(candidates.length ? 'pending' : 'unavailable');
  }, [candidates]);

  useEffect(() => {
    onStatusChange?.(groupIndex, status);
  }, [groupIndex, onStatusChange, status]);

  const current = candidates[index];
  if (!current) {
    return (
      <div className="image-placeholder">
        <span>{alt} image unavailable</span>
        {import.meta.env.DEV && failed.length ? <small>Failed: {failed.join(', ')}</small> : null}
      </div>
    );
  }

  return (
    <img
      src={current}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setStatus('available')}
      onError={() => {
        const next = index + 1;
        setFailed((values) => [...values, current]);
        if (next >= candidates.length) setStatus('unavailable');
        setIndex(next);
      }}
    />
  );
}

interface ImageStackProps {
  candidateGroups: string[][];
  label: string;
  onAvailabilityChange?: (status: ImageStackAvailability) => void;
}

function dedupeCandidateGroups(candidateGroups: string[][]): string[][] {
  const seen = new Set<string>();
  return candidateGroups.reduce<string[][]>((groups, candidates) => {
    const uniqueCandidates = Array.from(new Set(candidates));
    const key = uniqueCandidates.join('|');
    if (seen.has(key)) return groups;
    seen.add(key);
    groups.push(uniqueCandidates);
    return groups;
  }, []);
}

export function ImageStack({ candidateGroups, label, onAvailabilityChange }: ImageStackProps) {
  const visibleCandidateGroups = useMemo(() => dedupeCandidateGroups(candidateGroups), [candidateGroups]);
  const groupKey = visibleCandidateGroups.map((group) => group.join('|')).join('||');
  const [groupStatuses, setGroupStatuses] = useState<ImageStackAvailability[]>(() => (
    visibleCandidateGroups.map((group) => (group.length ? 'pending' : 'unavailable'))
  ));

  const updateGroupStatus = useCallback((index: number, status: ImageStackAvailability) => {
    setGroupStatuses((current) => {
      if (current[index] === status) return current;
      return current.map((value, statusIndex) => (statusIndex === index ? status : value));
    });
  }, []);

  useEffect(() => {
    setGroupStatuses(visibleCandidateGroups.map((group) => (group.length ? 'pending' : 'unavailable')));
  }, [groupKey, visibleCandidateGroups]);

  const stackStatus = useMemo<ImageStackAvailability>(() => {
    if (visibleCandidateGroups.length === 0) return 'unavailable';
    if (groupStatuses.some((status) => status === 'unavailable')) return 'unavailable';
    if (groupStatuses.length === visibleCandidateGroups.length && groupStatuses.every((status) => status === 'available')) return 'available';
    return 'pending';
  }, [visibleCandidateGroups.length, groupStatuses]);

  useEffect(() => {
    onAvailabilityChange?.(stackStatus);
  }, [onAvailabilityChange, stackStatus]);

  if (visibleCandidateGroups.length === 0) {
    return <div className="image-placeholder">{label} image unavailable</div>;
  }

  return (
    <div className="image-stack">
      {visibleCandidateGroups.map((candidates, index) => (
        <AssetImage
          key={`${candidates.join('|')}-${index}`}
          candidates={candidates}
          alt={`${label} ${index + 1}`}
          groupIndex={index}
          onStatusChange={updateGroupStatus}
        />
      ))}
    </div>
  );
}
