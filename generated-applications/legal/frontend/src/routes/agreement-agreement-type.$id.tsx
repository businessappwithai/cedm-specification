import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/agreement-agreement-type/$id')({
  component: AgreementAgreementTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AgreementAgreementTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="agreement_agreement_type" recordId={id} />;
}
