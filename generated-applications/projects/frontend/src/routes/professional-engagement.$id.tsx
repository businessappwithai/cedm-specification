import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/professional-engagement/$id')({
  component: ProfessionalEngagementDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProfessionalEngagementDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="professional_engagement" recordId={id} />;
}
