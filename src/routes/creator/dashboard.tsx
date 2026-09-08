import { createFileRoute } from "@tanstack/react-router";
import { CreatorWorkspace } from "@/components/CreatorWorkspace";

export const Route = createFileRoute("/creator/dashboard")({
  component: () => <CreatorWorkspace />,
});
