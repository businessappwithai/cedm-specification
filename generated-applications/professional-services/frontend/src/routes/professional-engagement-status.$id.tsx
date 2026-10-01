import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/professional-engagement-status/$id')({
  component: ProfessionalEngagementStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProfessionalEngagementStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="professional_engagement_status" recordId={id} />;
}
