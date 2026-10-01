import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/healthcare-provider-status/$id')({
  component: HealthcareProviderStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function HealthcareProviderStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="healthcare_provider_status" recordId={id} />;
}
