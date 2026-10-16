import { createFileRoute, Outlet, useChildMatches } from '@tanstack/react-router';
import { BusEntityPage } from '@/components/admin/bus-entity-page';

export const Route = createFileRoute('/material-issue-issue-type')({
  component: MaterialIssueIssueTypeListPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom window for this entity without touching the shared infrastructure.
function MaterialIssueIssueTypeListPage() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <BusEntityPage entityName="material_issue_issue_type" />;
}
