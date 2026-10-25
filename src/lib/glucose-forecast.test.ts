import { describe, expect, it } from "vitest";
import { BIN_MS, forecastFromLogs, forecastMetadata, predictHistory } from "./glucose-forecast";

const now = Date.parse("2026-10-24T14:30:00Z");
const history = [105, 108, 110, 112, 115];
const logs = history.map((glucoseReading, i) => ({ glucoseReading, timestamp: new Date(now - (4-i)*BIN_MS).toISOString() }));
describe("Evidence-based glucose forecasting", () => {
  it("does not invent readings or predictions from an empty history", () => {
    expect(forecastFromLogs([], now)).toMatchObject({ readings: [], points: [], anchor: null });
  });
  it("requires all five consecutive recorded intervals", () => {
    expect(forecastFromLogs(logs.filter((_, i) => i !== 2), now).points).toHaveLength(0);
  });
  it("rejects readings older than 20 minutes", () => {
    expect(forecastFromLogs(logs, now + 21*60_000).points).toHaveLength(0);
  });
  it("uses deterministic trained predictions, not random values", () => {
    expect(predictHistory(history)).toEqual(predictHistory(history));
    expect(predictHistory(history)).toEqual([116.9, 119.2, 121.5, 123.8]);
    const output = predictHistory(history);
    expect(output).toHaveLength(4);
    expect(output?.[0]).toBeGreaterThan(40);
    expect(output?.[3]).toBeLessThan(400);
  });
  it("predicts only the evaluated 15–60 minute horizons", () => {
    expect(forecastFromLogs(logs, now).points.map(p => (p.timestamp-now)/60_000)).toEqual([15,30,45,60]);
  });
  it("rejects out-of-range inputs instead of clamping them", () => {
    expect(predictHistory([105,108,110,112,401])).toBeNull();
    expect(forecastFromLogs(logs.map((log,i)=>i===4?{...log,glucoseReading:401}:log),now).points).toHaveLength(0);
  });
  it("keeps training, validation and testing file identifiers separate", () => {
    const all = [...forecastMetadata.trainParticipants, ...forecastMetadata.validationParticipants, ...forecastMetadata.testParticipants];
    expect(new Set(all).size).toBe(17);
    expect(forecastMetadata.trainWindows).toBe(85665);
    expect(forecastMetadata.rawReadings).toBe(356146);
  });
});