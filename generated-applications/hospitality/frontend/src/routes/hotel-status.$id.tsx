import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/hotel-status/$id')({
  component: HotelStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function HotelStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="hotel_status" recordId={id} />;
}
