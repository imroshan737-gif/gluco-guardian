import artifact from "./models/glucose-model.json";
import type { LogEntry } from "./glucosense";

export const forecastMetadata = artifact.metadata;
export const BIN_MS = 15 * 60_000;
export interface Reading { timestamp: number; glucose: number }
export interface ForecastPoint extends Reading { lower: number; upper: number }

export function recordedReadings(logs: Pick<LogEntry, "timestamp" | "glucoseReading">[], now: number): Reading[] {
  return logs.flatMap(log => {
    const timestamp = Date.parse(log.timestamp);
    const glucose = log.glucoseReading;
    return glucose !== undefined && Number.isFinite(glucose) && glucose > 0 &&
      Number.isFinite(timestamp) && timestamp <= now ? [{ timestamp, glucose }] : [];
  }).sort((a, b) => a.timestamp - b.timestamp);
}

export function predictHistory(history: number[]): number[] | null {
  if (history.length !== 5 || history.some(value => !Number.isFinite(value) || value < 40 || value > 400)) return null;
  const last = history[4];
  const delta = [0, 0, 0, 0];
  for (const tree of artifact.trees) {
    let node = 0;
    while (tree.left[node] !== -1) {
      node = history[tree.feature[node]] <= tree.threshold[node] ? tree.left[node] : tree.right[node];
    }
    tree.value[node].forEach((value, i) => { delta[i] += value / artifact.trees.length; });
  }
  const predictions = delta.map(value => Math.round((last + value) * 10) / 10);
  return predictions.some(value => value < 40 || value > 400 || !Number.isFinite(value)) ? null : predictions;
}

export function forecastFromLogs(logs: Pick<LogEntry, "timestamp" | "glucoseReading">[], now = Date.now()):
  { readings: Reading[]; points: ForecastPoint[]; reason: string; anchor: Reading | null } {
  const readings = recordedReadings(logs, now);
  const empty = (reason: string) => ({ readings, points: [], reason, anchor: null });
  const latest = readings.at(-1);
  if (!latest) return empty("No glucose readings recorded yet.");
  if (now - latest.timestamp > 20 * 60_000) return empty("Forecast paused: the newest glucose reading is more than 20 minutes old.");
  const latestBin = Math.floor(latest.timestamp / BIN_MS);
  const bins = new Map<number, number[]>();
  readings.forEach(reading => {
    const bin = Math.floor(reading.timestamp / BIN_MS);
    if (bin >= latestBin - 4) bins.set(bin, [...(bins.get(bin) ?? []), reading.glucose]);
  });
  const history: number[] = [];
  for (let i = latestBin - 4; i <= latestBin; i++) {
    const values = bins.get(i);
    if (!values?.length) return empty("Forecast needs glucose readings in five consecutive 15-minute intervals. Missing readings are never invented.");
    if (values.some(value => value < 40 || value > 400)) return empty("Forecast unavailable: a recent reading is outside the model’s 40–400 mg/dL research range.");
    history.push(values.reduce((sum, value) => sum + value, 0) / values.length);
  }
  const predictions = predictHistory(history);
  if (!predictions) return empty("Forecast unavailable: the model output is outside its supported research range.");
  const anchor = { timestamp: latestBin * BIN_MS, glucose: history[4] };
  const points = predictions.map((glucose, i) => ({
    timestamp: anchor.timestamp + forecastMetadata.horizons[i] * 60_000,
    glucose,
    lower: Math.round((glucose - forecastMetadata.metrics[i].intervalRadius) * 10) / 10,
    upper: Math.round((glucose + forecastMetadata.metrics[i].intervalRadius) * 10) / 10,
  }));
  return { readings, points, reason: "Experimental forecast from recorded glucose history; not treatment guidance.", anchor };
}