import { redirect } from 'next/navigation';

// Single-category board for MVP: redirect to "all"
export default function Board({ params }: { params: { id: string } }) {
  redirect(`/salons/${params.id}/board/all`);
}
