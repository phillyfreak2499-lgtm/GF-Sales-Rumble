import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/submit")({ component: SubmitPage });

function SubmitPage() {
  return <Navigate to="/score" />;
}