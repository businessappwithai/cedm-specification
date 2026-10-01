import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/healthcare-provider-provider-type/$id')({
  component: HealthcareProviderProviderTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function HealthcareProviderProviderTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="healthcare_provider_provider_type" recordId={id} />;
}
