import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/organization-status/$id')({
  component: OrganizationStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function OrganizationStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="organization_status" recordId={id} />;
}
