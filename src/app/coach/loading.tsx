import { GenericPageSkeleton } from "@/presentation/components/skeletons";

export default function CoachLoading() {
  return (
    <div className="screen">
      <div className="page-head">
        <div className="page-title">
          <GenericPageSkeleton />
        </div>
      </div>
    </div>
  );
}
