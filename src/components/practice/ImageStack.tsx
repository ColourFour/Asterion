interface ImageStackProps {
  urls: string[];
  label: string;
}

export function ImageStack({ urls, label }: ImageStackProps) {
  if (urls.length === 0) {
    return <div className="image-placeholder">{label} image unavailable</div>;
  }

  return (
    <div className="image-stack">
      {urls.map((url, index) => (
        <img key={`${url}-${index}`} src={url} alt={`${label} ${index + 1}`} loading="lazy" />
      ))}
    </div>
  );
}
