export function PhotoCredit({ photo }: { photo: { photographer: string; profile: string; page: string } }) {
  return <span className="photo-credit">Photo: <a href={photo.profile} target="_blank" rel="noopener noreferrer">{photo.photographer}</a> / <a href={photo.page} target="_blank" rel="noopener noreferrer">Unsplash</a></span>;
}
