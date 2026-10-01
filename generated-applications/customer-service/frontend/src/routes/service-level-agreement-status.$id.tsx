import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/service-level-agreement-status/$id')({
  component: ServiceLevelAgreementStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ServiceLevelAgreementStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="service_level_agreement_status" recordId={id} />;
}
