import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Filler, Legend
} from "chart.js";
import ParticlesBackground from "@/components/ParticlesBackground";
import Navbar from "@/components/Navbar";
import StatusBar from "@/components/StatusBar";
import GlassTiltCard from "@/components/GlassTiltCard";
import { getSession, getBMIData } from "@/lib/glucosense";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Filler, Legend);

// ── Workout plans per BMI category ───────────────────────────────────────
const workoutPlans = {
  underweight: {
    goal: "Build muscle mass & improve strength",
    warning: "Avoid high-intensity cardio — focus on strength and eating enough calories.",
    weeks: [
      {
        week: "Week 1–2", focus: "Foundation",
        days: [
          { day: "Mon", exercises: ["Bodyweight squats 3×12", "Push-ups 3×10", "Plank 3×20s"] },
          { day: "Wed", exercises: ["Dumbbell rows 3×12", "Lunges 3×10", "Glute bridges 3×15"] },
          { day: "Fri", exercises: ["Wall push-ups 3×15", "Step-ups 3×12", "Dead bug 3×10"] },
        ]
      },
      {
        week: "Week 3–4", focus: "Strength",
        days: [
          { day: "Mon", exercises: ["Goblet squats 3×12", "Push-ups 4×12", "Dumbbell press 3×10"] },
          { day: "Wed", exercises: ["Romanian deadlift 3×10", "Bent-over rows 3×12", "Side plank 3×30s"] },
          { day: "Fri", exercises: ["Bulgarian split squat 3×10", "Incline push-up 3×12", "Farmer carry 3×30s"] },
        ]
      },
    ],
    nutrition: ["Eat 3 meals + 2 snacks daily", "High protein: eggs, paneer, dal, chicken", "Add healthy fats: nuts, ghee, avocado", "Target 300–500 kcal surplus per day"],
    cardio: "Light walking 20 min, 3x/week only",
  },
  normal: {
    goal: "Maintain fitness & optimize glucose control",
    warning: "You're in a healthy range — focus on consistency and diabetes management.",
    weeks: [
      {
        week: "Week 1–2", focus: "Cardio + Strength",
        days: [
          { day: "Mon", exercises: ["Brisk walk/jog 30 min", "Bodyweight squats 3×15", "Push-ups 3×12"] },
          { day: "Wed", exercises: ["Cycling 20 min", "Dumbbell rows 3×12", "Plank 3×30s"] },
          { day: "Fri", exercises: ["Jump rope 15 min", "Lunges 3×12", "Glute bridges 3×15"] },
          { day: "Sat", exercises: ["Yoga or stretching 30 min"] },
        ]
      },
      {
        week: "Week 3–4", focus: "Endurance",
        days: [
          { day: "Mon", exercises: ["Jog 35 min", "Squats 4×15", "Mountain climbers 3×20"] },
          { day: "Wed", exercises: ["Swim or cycle 30 min", "Pull-ups 3×8", "Core circuit 3×"] },
          { day: "Fri", exercises: ["HIIT 20 min (low impact)", "Deadlifts 3×10", "Plank variations 3×"] },
          { day: "Sat", exercises: ["Active recovery — walk + stretch"] },
        ]
      },
    ],
    nutrition: ["Balanced plate: 40% carbs, 30% protein, 30% fat", "Time carbs around workouts", "Stay hydrated — 2.5–3L water/day", "Monitor glucose before and after exercise"],
    cardio: "30–45 min moderate cardio, 4–5x/week",
  },
  overweight: {
    goal: "Reduce body fat & improve insulin sensitivity",
    warning: "Low-impact cardio is best — protect your joints while building endurance.",
    weeks: [
      {
        week: "Week 1–2", focus: "Low Impact Cardio",
        days: [
          { day: "Mon", exercises: ["Brisk walk 30 min", "Chair squats 3×12", "Seated leg raises 3×15"] },
          { day: "Wed", exercises: ["Swimming or water aerobics 30 min", "Wall push-ups 3×12", "Standing calf raises 3×20"] },
          { day: "Fri", exercises: ["Cycling (low resistance) 30 min", "Resistance band rows 3×12", "Plank (knees) 3×20s"] },
        ]
      },
      {
        week: "Week 3–4", focus: "Fat Burn",
        days: [
          { day: "Mon", exercises: ["Power walk 40 min", "Bodyweight squats 3×15", "Push-ups (incline) 3×12"] },
          { day: "Wed", exercises: ["Elliptical 30 min", "Dumbbell curls 3×12", "Side steps 3×20"] },
          { day: "Fri", exercises: ["Interval walk (1 min fast, 2 min slow) 30 min", "Deadlifts light 3×12", "Core crunches 3×15"] },
          { day: "Sat", exercises: ["Yoga for flexibility 30 min"] },
        ]
      },
    ],
    nutrition: ["300–500 kcal deficit per day", "Reduce refined carbs and sugary drinks", "Increase fibre: vegetables, oats, lentils", "Protein at every meal to preserve muscle"],
    cardio: "40–50 min low-impact cardio, 5x/week",
  },
  obese: {
    goal: "Safe weight loss & blood sugar management",
    warning: "Start slow — consult your doctor before beginning. Prioritize walking and water-based exercise.",
    weeks: [
      {
        week: "Week 1–2", focus: "Getting Started",
        days: [
          { day: "Mon", exercises: ["Walk 15–20 min (flat surface)", "Seated arm circles 2×20", "Seated marching 2×30s"] },
          { day: "Wed", exercises: ["Water walking if available 20 min", "Chair push-ups 2×10", "Ankle rotations 2×15"] },
          { day: "Fri", exercises: ["Walk 20 min", "Wall sit 2×15s", "Deep breathing stretches 5 min"] },
        ]
      },
      {
        week: "Week 3–4", focus: "Building Habit",
        days: [
          { day: "Mon", exercises: ["Walk 25 min", "Chair squats 2×12", "Resistance band pulls 2×10"] },
          { day: "Wed", exercises: ["Swim or pool walking 20 min", "Seated leg press 2×12", "Plank (knees) 2×15s"] },
          { day: "Fri", exercises: ["Walk 30 min", "Wall push-ups 3×10", "Seated twists 2×15"] },
          { day: "Sat", exercises: ["Gentle yoga or stretching 20 min"] },
        ]
      },
    ],
    nutrition: ["500 kcal deficit (medically guided)", "Avoid processed food, maida, and sugar", "Eat slowly — stop at 80% full", "High protein + high fibre every meal", "Check glucose after every meal"],
    cardio: "Walk 20–30 min daily — build up slowly",
  },
};

// ── Weekly calorie burn chart data ───────────────────────────────────────
function getCalorieChartData(category: string) {
  const base = { underweight: 180, normal: 280, overweight: 320, obese: 200 };
  const b = base[category as keyof typeof base] || 250;
  return {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{
      label: "Est. Calories Burned",
      data: [b, 0, b + 20, 0, b + 40, b - 30, 0].map(v => v > 0 ? v + Math.round(Math.random() * 20) : 0),
      backgroundColor: "rgba(0,245,212,0.25)",
      borderColor: "#00F5D4",
      borderWidth: 2,
      borderRadius: 6,
    }]
  };
}

// ── BMI gauge zones ───────────────────────────────────────────────────────
const bmiZones = [
  { label: "Underweight", range: "<18.5", color: "#60A5FA" },
  { label: "Normal",      range: "18.5–24.9", color: "#22C97A" },
  { label: "Overweight",  range: "25–29.9",   color: "#F59E42" },
  { label: "Obese",       range: "≥30",        color: "#F25C6E" },
];

export default function HealthPlan() {
  const navigate = useNavigate();
  const session = getSession();

  useEffect(() => {
    if (!session) navigate('/auth');
    if (!session?.heightCm || !session?.weightKg) navigate('/settings');
  }, []);

  if (!session?.heightCm || !session?.weightKg) return null;

  const bmi = getBMIData(session.heightCm, session.weightKg);
  const plan = workoutPlans[bmi.category];
  const calorieData = getCalorieChartData(bmi.category);

  // BMI progress bar percentage (scale 10–45)
  const bmiPct = Math.min(100, Math.max(0, ((bmi.bmi - 10) / 35) * 100));

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(60,28,140,0.97)',
        borderColor: 'rgba(169,127,240,0.3)',
        borderWidth: 1,
        titleFont: { family: 'Orbitron', size: 10 },
        bodyFont: { family: 'DM Sans', size: 11 },
      },
    },
    scales: {
      x: { ticks: { color: 'rgba(169,127,240,0.6)', font: { family: 'DM Sans', size: 10 } }, grid: { color: 'rgba(123,76,224,0.08)' } },
      y: { ticks: { color: 'rgba(169,127,240,0.6)', font: { family: 'DM Sans', size: 10 } }, grid: { color: 'rgba(123,76,224,0.12)' } },
    },
  };

  return (
    <div className="min-h-screen page-transition relative">
      {/* Particles handled globally */}
      <Navbar />

      <main className="pt-20 pb-16 px-4 max-w-3xl mx-auto relative z-10">
        <h1 className="font-heading text-2xl mb-2 text-center">
          <span className="text-primary">Health</span> & Workout Plan
        </h1>
        <p className="text-center text-foreground/40 text-xs font-body mb-8">
          Personalised for {session.fullName} · Based on your BMI
        </p>

        {/* BMI Card */}
        <GlassTiltCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-xs text-primary">YOUR BMI</h3>
            <span className="text-xs font-heading px-3 py-1 rounded-full" style={{ background: `${bmi.color}22`, color: bmi.color, border: `1px solid ${bmi.color}44` }}>
              {bmi.label}
            </span>
          </div>

          <div className="flex items-end gap-4 mb-4">
            <div>
              <div className="font-heading text-5xl font-black" style={{ color: bmi.color }}>{bmi.bmi}</div>
              <div className="text-xs text-foreground/40 font-body">kg/m²</div>
            </div>
            <div className="text-xs text-foreground/50 font-body mb-1">
              <div>{session.heightCm} cm · {session.weightKg} kg</div>
              <div className="mt-1" style={{ color: bmi.color }}>{plan.goal}</div>
            </div>
          </div>

          {/* BMI bar */}
          <div className="relative mb-2">
            <div className="flex h-3 rounded-full overflow-hidden">
              <div className="flex-1" style={{ background: '#60A5FA' }} />
              <div className="flex-1" style={{ background: '#22C97A' }} />
              <div className="flex-1" style={{ background: '#F59E42' }} />
              <div className="flex-1" style={{ background: '#F25C6E' }} />
            </div>
            <div
              className="absolute top-0 w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all"
              style={{ left: `calc(${bmiPct}% - 6px)`, background: bmi.color }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-foreground/30 font-body">
            <span>10</span><span>18.5</span><span>25</span><span>30</span><span>45+</span>
          </div>

          {/* BMI zones legend */}
          <div className="flex flex-wrap gap-2 mt-3">
            {bmiZones.map(z => (
              <div key={z.label} className="flex items-center gap-1 text-[10px] text-foreground/50">
                <div className="w-2 h-2 rounded-full" style={{ background: z.color }} />
                {z.label} ({z.range})
              </div>
            ))}
          </div>

          {/* Warning */}
          <div className="mt-4 p-3 rounded-xl text-xs font-body" style={{ background: `${bmi.color}12`, border: `1px solid ${bmi.color}30`, color: bmi.color }}>
            ⚠️ {plan.warning}
          </div>
        </GlassTiltCard>

        {/* Calorie Burn Chart */}
        <GlassTiltCard className="mb-6">
          <h3 className="font-heading text-xs text-primary mb-4">📊 ESTIMATED WEEKLY CALORIE BURN</h3>
          <Bar data={calorieData} options={chartOptions} />
          <p className="text-[10px] text-foreground/30 font-body mt-2 text-center">Rest days shown as 0. Estimates based on your BMI category and plan intensity.</p>
        </GlassTiltCard>

        {/* Workout Plan */}
        <GlassTiltCard className="mb-6">
          <h3 className="font-heading text-xs text-primary mb-1">💪 YOUR 4-WEEK WORKOUT PLAN</h3>
          <p className="text-[10px] text-foreground/40 font-body mb-4">Goal: {plan.goal}</p>

          <div className="space-y-5">
            {plan.weeks.map((week, wi) => (
              <div key={wi}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-2 py-0.5 rounded-md text-[10px] font-heading" style={{ background: 'rgba(0,245,212,0.12)', color: '#00F5D4', border: '1px solid rgba(0,245,212,0.2)' }}>
                    {week.week}
                  </div>
                  <span className="text-xs text-foreground/40 font-body">Focus: {week.focus}</span>
                </div>
                <div className="grid gap-2">
                  {week.days.map((day, di) => (
                    <div key={di} className="p-3 rounded-xl" style={{ background: 'rgba(123,76,224,0.1)', border: '1px solid rgba(123,76,224,0.2)' }}>
                      <div className="text-[10px] font-heading text-primary mb-1">{day.day}</div>
                      <ul className="space-y-0.5">
                        {day.exercises.map((ex, ei) => (
                          <li key={ei} className="text-xs text-foreground/70 font-body flex items-start gap-1.5">
                            <span style={{ color: '#00F5D4' }}>›</span> {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassTiltCard>

        {/* Cardio recommendation */}
        <GlassTiltCard className="mb-6">
          <h3 className="font-heading text-xs text-primary mb-3">🏃 CARDIO RECOMMENDATION</h3>
          <p className="text-sm font-body text-foreground/70">{plan.cardio}</p>
        </GlassTiltCard>

        {/* Nutrition */}
        <GlassTiltCard className="mb-6">
          <h3 className="font-heading text-xs text-primary mb-3">🥗 NUTRITION GUIDELINES</h3>
          <ul className="space-y-2">
            {plan.nutrition.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs font-body text-foreground/70">
                <span className="text-primary mt-0.5">✓</span> {tip}
              </li>
            ))}
          </ul>
        </GlassTiltCard>

        {/* Glucose + Exercise note */}
        <GlassTiltCard className="mb-6">
          <h3 className="font-heading text-xs text-warning mb-3">⚡ GLUCOSE & EXERCISE SAFETY</h3>
          <ul className="space-y-2 text-xs font-body text-foreground/70">
            <li className="flex gap-2"><span className="text-warning">•</span> Check glucose before every workout</li>
            <li className="flex gap-2"><span className="text-warning">•</span> If below 100 mg/dL — eat 15g carbs first</li>
            <li className="flex gap-2"><span className="text-warning">•</span> Keep glucose tablets or juice nearby</li>
            <li className="flex gap-2"><span className="text-warning">•</span> Recheck glucose 30 min after exercise</li>
            <li className="flex gap-2"><span className="text-warning">•</span> Stop immediately if you feel dizzy or shaky</li>
          </ul>
        </GlassTiltCard>

        <button onClick={() => navigate('/settings')} className="w-full glass-card py-3 text-sm font-heading text-foreground/50 hover:text-foreground transition-colors text-center" style={{ borderRadius: 12 }}>
          ← Back to Settings
        </button>
      </main>

      <StatusBar />
    </div>
  );
}
