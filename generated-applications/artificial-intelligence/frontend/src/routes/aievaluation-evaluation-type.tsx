import { createFileRoute, Outlet, useChildMatches } from '@tanstack/react-router';
import { BusEntityPage } from '@/components/admin/bus-entity-page';

export const Route = createFileRoute('/aievaluation-evaluation-type')({
  component: AIEvaluationEvaluationTypeListPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom window for this entity without touching the shared infrastructure.
function AIEvaluationEvaluationTypeListPage() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <BusEntityPage entityName="ai_evaluation_evaluation_type" />;
}
