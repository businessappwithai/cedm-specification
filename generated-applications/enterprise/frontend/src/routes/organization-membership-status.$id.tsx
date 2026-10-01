import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/organization-membership-status/$id')({
  component: OrganizationMembershipStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function OrganizationMembershipStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="organization_membership_status" recordId={id} />;
}
