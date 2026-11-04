import { describe, expect, it } from "vitest";
import { quickReply } from "./assistant-quick-replies";
describe("instant assistant exceptions", () => {
  it("computes 1+1 immediately", () => { expect(quickReply("1+1")).toBe("1 + 1 = 2"); });
  it("allows casual check-ins and varies greetings", () => { expect(quickReply("hi how r u")).not.toBeNull(); expect(quickReply("hi", 0)).not.toEqual(quickReply("hi", 1)); });
  it("does not swallow symptoms after a greeting", () => { expect(quickReply("hi, I have chest pain")).toBeNull(); });
  it("does not calculate medication instructions", () => { expect(quickReply("calculate 2*5 units of insulin")).toBeNull(); });
  it("keeps other unrelated questions out of the fast path", () => { expect(quickReply("Who won the cricket match?")).toBeNull(); });
  it("answers stretched greetings instantly", () => { for (const t of ["heyyy", "hii", "Hellooo!", "heyy how are you", "good morning"]) expect(quickReply(t)).not.toBeNull(); });
  it("handles division by zero safely", () => { expect(quickReply("2/0")).toBe("Division by zero is undefined."); expect(quickReply("alert(1)")).toBeNull(); });
});