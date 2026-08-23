import PostForm from "@/components/posts/PostForm";

export default function NewPostPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-navy">
        New Post
      </h1>
      <div className="card mt-6 p-5 sm:p-6">
        <PostForm />
      </div>
    </div>
  );
}
