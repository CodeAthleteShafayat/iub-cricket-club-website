import PostDetail from "@/components/posts/PostDetail";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  return <PostDetail postId={postId} />;
}
