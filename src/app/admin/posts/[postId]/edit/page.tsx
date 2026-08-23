import EditPostForm from "@/components/posts/EditPostForm";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-navy">
        Edit Post
      </h1>
      <div className="card mt-6 p-5 sm:p-6">
        <EditPostForm postId={postId} />
      </div>
    </div>
  );
}
