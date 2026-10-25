import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip as ChartTooltip, Legend, Filler } from "chart.js";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { forecastFromLogs, forecastMetadata as model } from "@/lib/glucose-forecast";
import type { LogEntry } from "@/lib/glucosense";

ChartJS.register(LinearScale, PointElement, LineElement, ChartTooltip, Legend, Filler);

interface Props { logs: LogEntry[]; timeRange: string; onTimeRangeChange: (range: string) => void }

export default function GlucosePredictionChart({ logs, timeRange, onTimeRangeChange }: Props) {
  const [infoOpen, setInfoOpen] = useState(false);
  const forecast = useMemo(() => forecastFromLogs(logs), [logs]);
  const css = getComputedStyle(document.documentElement);
  const color = (token: string, alpha = 1) => `hsl(${css.getPropertyValue(`--${token}`).trim()} / ${alpha})`;
  const now = Date.now();
  const hours = Number.parseInt(timeRange);
  const readings = forecast.readings.filter(reading => reading.timestamp >= now - hours * 3600_000);
  const actual = readings.map(reading => ({ x: reading.timestamp, y: reading.glucose }));
  const predicted = forecast.anchor ? [{ x: forecast.anchor.timestamp, y: forecast.anchor.glucose }, ...forecast.points.map(point => ({ x: point.timestamp, y: point.glucose }))] : [];
  const lower = forecast.points.map(point => ({ x: point.timestamp, y: point.lower }));
  const upper = forecast.points.map(point => ({ x: point.timestamp, y: point.upper }));
  const end = Math.max(now, forecast.points[forecast.points.length - 1]?.timestamp ?? now);
  const start = now - hours * 3600_000;

  return (
    <section className="lg:col-span-2 glass-card p-4 sm:p-6 relative min-w-0" aria-label="Glucose prediction">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8 text-primary" aria-label="How glucose prediction is calculated" onClick={() => setInfoOpen(true)}>
            <Info />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Model, calculation and research evidence</TooltipContent>
      </Tooltip>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pr-6">
        <h3 className="font-heading text-sm">Glucose Prediction</h3>
        <div className="flex gap-1" aria-label="Recorded history range">
          {["1H", "3H", "6H", "24H"].map(range => (
            <Button key={range} variant={timeRange === range ? "secondary" : "ghost"} size="sm" className="h-7 px-2 text-xs" aria-pressed={timeRange === range} onClick={() => onTimeRangeChange(range)}>{range}</Button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{timeRange} recorded history · {forecast.points.length ? "60-minute experimental forecast" : "Forecast awaiting eligible readings"}</p>
      <div className="h-64 sm:h-72 w-full">
        {readings.length > 0 ? (
          <Line data={{ datasets: [
            { label: "Recorded", data: actual, borderColor: color("primary"), backgroundColor: color("primary"), pointRadius: 3, tension: 0, fill: false },
            { label: "Experimental forecast", data: predicted, borderColor: color("accent"), backgroundColor: color("accent"), borderDash: [6,4], pointRadius: 2, tension: 0, fill: false },
            { label: "Upper empirical error band", data: upper, borderColor: color("accent",0), backgroundColor: color("accent",0.10), fill: "+1", pointRadius: 0 },
            { label: "Lower empirical error band", data: lower, borderColor: color("accent",0), pointRadius: 0, fill: false },
            { label: "Hypo threshold (70 mg/dL)", data: [{x:start,y:70},{x:end,y:70}], borderColor: color("destructive"), borderDash: [3,3], pointRadius: 0, fill: false },
          ] }} options={{ responsive: true, maintainAspectRatio: false, animation: false, parsing: false,
            plugins: { legend: {display:false}, tooltip: {backgroundColor:color("surface-strong"),titleColor:color("surface-strong-foreground"),bodyColor:color("surface-strong-foreground"),titleFont:{family:"Sora"},bodyFont:{family:"Manrope"},callbacks:{ title: items => items[0] ? new Date(items[0].parsed.x).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "", label: item => `${item.dataset.label}: ${item.parsed.y?.toFixed(1)} mg/dL` }} },
            scales: { x: {type:"linear",min:start,max:end,ticks:{color:color("muted-foreground"),maxTicksLimit:6,font:{family:"Manrope",size:10},callback:value=>new Date(Number(value)).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})},grid:{color:color("border",0.4)}}, y: {suggestedMin:40,suggestedMax:180,title:{display:true,text:"mg/dL",color:color("muted-foreground")},ticks:{color:color("muted-foreground"),font:{family:"Manrope",size:10}},grid:{color:color("border",0.4)}} }
          }} />
        ) : <div className="h-full flex items-center justify-center text-center text-sm text-muted-foreground">No recorded glucose in this time window.</div>}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary" />Recorded</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-accent" />Experimental forecast</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-destructive" />Hypo threshold (70 mg/dL)</span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground" role="status">{forecast.reason}</p>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-2xl max-h-[85svh] overflow-y-auto w-[calc(100%-2rem)] bg-background">
          <DialogHeader>
            <DialogTitle className="font-heading leading-relaxed pr-6">How glucose prediction is calculated</DialogTitle>
            <DialogDescription>Real recorded inputs. Reproducible training. Explicit research limitations.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 text-sm leading-relaxed font-body">
            <div className="border-l-4 border-accent pl-4">
              <p className="font-semibold text-foreground">{model.name}</p>
              <p className="text-muted-foreground">{model.treeCount} trained Extra Trees regression trees, maximum depth {model.maxDepth}. This is a glucose-only research ensemble, not an LLM or a large foundation model.</p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-2">Source data and training</h4>
              <p>{model.source}. The release contains {model.rawReadings.toLocaleString()} raw glucose records in {model.participantFiles} participant-ID files from 2023–2024.</p>
              <a href={model.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">Official dataset and download · DOI {model.doi}</a>
              <p className="text-muted-foreground mt-2">CC BY 4.0; credit: Alsuhaymi and colleagues. The publisher’s overview says 16 individuals while its table and archive contain 17 files; file count is not proof of independent people.</p>
              <p className="mt-2">{model.trainWindows.toLocaleString()} training windows ({model.trainParticipants.length} IDs), {model.validationWindows.toLocaleString()} validation windows ({model.validationParticipants.length} IDs), and {model.testWindows.toLocaleString()} test windows ({model.testParticipants.length} IDs). IDs were kept separate. Seed {model.seed}; trained {new Date(model.trainedAt).toLocaleDateString()}.</p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-2">Calculation steps</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Parse real timestamps, convert mmol/L to mg/dL (×18.0182), and remove invalid values. Remove exact shared observations between ID files ({model.duplicateObservationsRemoved.toLocaleString()} removed).</li>
                <li>Average glucose into clock-aligned 15-minute intervals. Require five consecutive intervals; never fill missing readings.</li>
                <li>Each tree uses those five historical averages to predict glucose changes at 15, 30, 45 and 60 minutes.</li>
                <li>Average the {model.treeCount} tree outputs and add each change to the latest interval’s glucose average.</li>
                <li>Show empirical error bands using the 90th percentile of validation errors for each horizon, not a personal certainty score.</li>
              </ol>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-2">Measured held-out test errors</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead><tr className="border-b border-border"><th className="py-2">Ahead</th><th>MAE</th><th>RMSE</th><th>Last-value MAE</th><th>Band coverage</th></tr></thead>
                  <tbody>{model.metrics.map(metric => <tr key={metric.minutes} className="border-b border-border"><td className="py-2">{metric.minutes} min</td><td>{metric.mae}</td><td>{metric.rmse}</td><td>{metric.persistenceMae}</td><td>{metric.testCoverage}%</td></tr>)}</tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Errors are in mg/dL. MAE is average absolute error; RMSE penalizes larger errors. The comparison repeats the last reading. Correlated, overlapping windows are not independent trials.</p>
            </div>
            <div className="border-t border-border pt-4">
              <h4 className="font-heading font-semibold mb-2">Limits and safety</h4>
              <p>The newest reading must be within 20 minutes; inputs and predicted values must be within 40–400 mg/dL. Forecasts stop at 60 minutes. 1H/3H/6H/24H select recorded history, not longer predictions.</p>
              <p className="mt-2">Insulin, meals, sleep, activity and stress are not inputs to this model. The separate risk gauge is still a rule-based score, not a trained probability.</p>
              <p className="mt-2 text-destructive font-semibold">Not clinically validated. A small type 1 diabetes dataset cannot establish safety for everyone. Manual readings differ from sensor data. Do not change insulin, delay care, or rely on these forecasts for treatment.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}