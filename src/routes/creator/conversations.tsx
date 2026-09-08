import { createFileRoute } from "@tanstack/react-router";
import { CreatorWorkspace } from "@/components/CreatorWorkspace";

export const Route = createFileRoute("/creator/conversations")({
  component: () => <CreatorWorkspace section="Conversations" />,
});
