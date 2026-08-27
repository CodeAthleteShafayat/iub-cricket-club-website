import AlbumDetail from "@/components/gallery/AlbumDetail";

// Next 16: dynamic params are a Promise and must be awaited in the server
// component before being handed to the client component.
export default async function AlbumPage({
  params,
}: {
  params: Promise<{ albumId: string }>;
}) {
  const { albumId } = await params;
  return <AlbumDetail albumId={albumId} />;
}
