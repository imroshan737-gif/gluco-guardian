import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import GlucosePredictionChart from "./GlucosePredictionChart";

vi.mock("react-chartjs-2", () => ({ Line: () => null }));

describe("glucose prediction information", () => {
  it("offers logging directly from an empty graph", () => {
    const onLogReading = vi.fn();
    render(<TooltipProvider><GlucosePredictionChart logs={[]} timeRange="3H" onTimeRangeChange={() => {}} onLogReading={onLogReading} /></TooltipProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Log glucose" }));
    expect(onLogReading).toHaveBeenCalledOnce();
  });
  it("can reveal recorded readings outside the selected window", () => {
    const onTimeRangeChange = vi.fn();
    const logs = [{ timestamp: new Date(Date.now() - 48 * 3600_000).toISOString(), glucoseReading: 105 }] as import("@/lib/glucosense").LogEntry[];
    render(<TooltipProvider><GlucosePredictionChart logs={logs} timeRange="3H" onTimeRangeChange={onTimeRangeChange} /></TooltipProvider>);
    fireEvent.click(screen.getByRole("button", { name: "View all recorded readings" }));
    expect(onTimeRangeChange).toHaveBeenCalledWith("All");
  });
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