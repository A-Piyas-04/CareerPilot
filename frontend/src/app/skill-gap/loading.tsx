import { ListCardSkeleton } from "@/components/ui";

export default function SkillGapLoading() {
  return (
    <main className="min-h-[calc(100vh-49px)] bg-zinc-50 px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <ListCardSkeleton count={6} />
      </div>
    </main>
  );
}
