// lib/imageUrl.ts (in the dashboard project)
export function resolveBookingImageUrl(
  bookingId: number | string,
  filename?: string | null
): string {
  if (!filename || !filename.trim()) return '';
  const clean = filename.trim().replace(/^\//, '');
  return `/api/uploads/bookings/${bookingId}/${clean}`;
}