import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/hotel-reservation-status/$id')({
  component: HotelReservationStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function HotelReservationStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="hotel_reservation_status" recordId={id} />;
}
