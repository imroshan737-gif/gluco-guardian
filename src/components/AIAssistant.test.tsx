import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AIAssistant from "./AIAssistant";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));

describe("real health assistant", () => {
  it("answers 1+1 and hi instantly without calling the AI service", async () => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    invoke.mockClear();
    render(<AIAssistant />);
    fireEvent.click(screen.getByRole("button", { name: "AI Medical Assistant" }));
    for (const question of ["1+1", "hi"]) {
      fireEvent.change(screen.getByRole("textbox", { name: "Health question" }), { target: { value: question } });
      fireEvent.click(screen.getByRole("button", { name: "Send question" }));
      await waitFor(() => expect(screen.getByRole("textbox", { name: "Health question" })).toHaveValue(""));
    }
    expect(invoke).not.toHaveBeenCalled();
    expect(screen.getByText("1 + 1 = 2")).toBeInTheDocument();
  });
  it("sends the question to the service and retains it after a failure for explicit retry", async () => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    invoke.mockClear();
    Element.prototype.scrollIntoView = vi.fn();
    invoke.mockResolvedValueOnce({ data: null, error: new Error("Unavailable") });
    invoke.mockResolvedValueOnce({ data: { answer: "Insulin helps cells use glucose.", sources: [], evidenceStatus: "no_match" }, error: null });
    render(<AIAssistant />);
    fireEvent.click(screen.getByRole("button", { name: "AI Medical Assistant" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Health question" }), { target: { value: "How does insulin work?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send question" }));
    await screen.findByRole("alert");
    expect(invoke).toHaveBeenCalledWith("health-assistant", { body: { messages: [{ role: "user", content: "How does insulin work?" }] } });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByText("Insulin helps cells use glucose.");
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(invoke).toHaveBeenCalledTimes(2);
  });
});