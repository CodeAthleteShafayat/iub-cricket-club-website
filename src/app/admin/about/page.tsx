import AboutContentForm from "@/components/admin/AboutContentForm";

export default function AdminAboutPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-navy">
        About Page Content
      </h1>
      <p className="mt-1 text-sm text-muted">
        This text and image appear in a section on the public About page.
      </p>
      <div className="card mt-6 p-5 sm:p-6">
        <AboutContentForm />
      </div>
    </div>
  );
}
