import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/certificate-of-analysis/$id')({
  component: CertificateOfAnalysisDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CertificateOfAnalysisDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="certificate_of_analysis" recordId={id} />;
}
