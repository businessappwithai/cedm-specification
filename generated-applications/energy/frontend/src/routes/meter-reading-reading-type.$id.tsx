import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/meter-reading-reading-type/$id')({
  component: MeterReadingReadingTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MeterReadingReadingTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="meter_reading_reading_type" recordId={id} />;
}
