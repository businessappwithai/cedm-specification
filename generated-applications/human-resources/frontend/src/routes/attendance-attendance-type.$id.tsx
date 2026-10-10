import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/attendance-attendance-type/$id')({
  component: AttendanceAttendanceTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AttendanceAttendanceTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="attendance_attendance_type" recordId={id} />;
}
