import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/locker")({ component: LockerAlias });

function LockerAlias() {
  return <Navigate to="/score" />;
}
