/**
 * The old address of the Logic step.
 *
 * Rules and workflows were once separate wizard steps and this page was the
 * first of them. They are one step now — a rule decides and the process acts
 * on what it decided, often in the same diagram — so the page lives at
 * `/projects/$id/logic`.
 *
 * This redirect stays because the old URL is in people's history and in links
 * they have already sent each other. It is a redirect rather than a copy of
 * the page: two routes rendering one screen is how they drift.
 */

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$id/rules-design")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/projects/$id/logic", params: { id: params.id } });
  },
});
