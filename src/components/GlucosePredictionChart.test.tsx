import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import GlucosePredictionChart from "./GlucosePredictionChart";

describe("glucose prediction information", () => {
  it("opens and closes the explanation without a missing trigger reference", () => {
    render(
      <TooltipProvider>
        <GlucosePredictionChart logs={[]} timeRange="1H" onTimeRangeChange={() => {}} />
      </TooltipProvider>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "How glucose prediction is calculated" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});