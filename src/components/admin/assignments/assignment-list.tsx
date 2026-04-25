import { AssignmentRecord } from "@/types/assignment";
import { Loader2 } from "lucide-react";
import { AssignmentCard } from "./assignment-card";

interface AssignmentListProps {
  assignments: AssignmentRecord[];
  loading: boolean;
  searchQuery: string;
  onReviewed?: () => void;
}

export function AssignmentList({ assignments, loading, searchQuery, onReviewed }: AssignmentListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid gap-6">
      {filteredAssignments.map((assignment) => (
        <AssignmentCard key={assignment.id} assignment={assignment} onReviewed={onReviewed} />
      ))}
    </div>
  );
}
