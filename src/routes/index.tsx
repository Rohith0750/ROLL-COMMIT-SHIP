import { createFileRoute } from "@tanstack/react-router";
import { MedicationChecker } from "@/components/MedicationChecker";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Medication Conflict Checker · Temporal Analysis Engine" },
      {
        name: "description",
        content:
          "A futuristic time-traveler's pocket device for analyzing drug interactions and preventing harmful combinations of medicines and supplements.",
      },
    ],
  }),
});

function Index() {
  return <MedicationChecker />;
}
