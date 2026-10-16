import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/wave-wave-type/$id')({
  component: WaveWaveTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function WaveWaveTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="wave_wave_type" recordId={id} />;
}
