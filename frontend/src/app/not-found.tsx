import { ErrorPageContent } from "@/components/layout/error-page-content";

export default function NotFound() {
  return (
    <ErrorPageContent
      icon="notFound"
      title="Page not found"
      description="The page you're looking for doesn't exist or may have moved. Head back to your workspace to continue."
    />
  );
}
