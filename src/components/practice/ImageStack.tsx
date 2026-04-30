import { useEffect, useState } from 'react';

interface AssetImageProps {
  candidates: string[];
  alt: string;
}

function AssetImage({ candidates, alt }: AssetImageProps) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);

  useEffect(() => {
    setIndex(0);
    setFailed([]);
  }, [candidates.join('|')]);

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
      onError={() => {
        setFailed((values) => [...values, current]);
        setIndex((value) => value + 1);
      }}
    />
  );
}

interface ImageStackProps {
  candidateGroups: string[][];
  label: string;
}

export function ImageStack({ candidateGroups, label }: ImageStackProps) {
  if (candidateGroups.length === 0) {
    return <div className="image-placeholder">{label} image unavailable</div>;
  }

  return (
    <div className="image-stack">
      {candidateGroups.map((candidates, index) => (
        <AssetImage key={`${candidates.join('|')}-${index}`} candidates={candidates} alt={`${label} ${index + 1}`} />
      ))}
    </div>
  );
}
