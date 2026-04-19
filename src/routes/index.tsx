import { createFileRoute } from "@tanstack/react-router";
import { MedicationChecker } from "@/components/MedicationChecker";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Chrono-Med Check · Advanced Healthcare Analysis" },
      {
        name: "description",
        content:
          "Advanced clinical support software for analyzing drug interactions and pharmaceutical safety.",
      },
    ],
  }),
});

function Index() {
  return <MedicationChecker />;
}
