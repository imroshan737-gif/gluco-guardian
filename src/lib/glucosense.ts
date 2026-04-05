// GlucoSense AI — Core logic for risk calculation, insights, and data management
// All calculations are client-side. No backend required.

export interface UserProfile {
  fullName: string;
  email: string;
  password: string;
  age: number;
  diabetesType: string;
  glucoseRange: string;
  emergencyContactName?: string;
  alertPreferences?: { sound: boolean; notification: boolean; vibration: boolean };
  aiSensitivity?: 'conservative' | 'balanced' | 'aggressive';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  glucoseReading?: number;
  lastMealTime: string;
  mealType: string;
  insulinDose: number;
  insulinTime: string;
  sleepHours: number;
  activityLevel: string;
  stressLevel: number;
  riskScore: number;
  riskLevel: string;
  insights: InsightCard[];
}

export interface InsightCard {
  id: string;
  severity: 'safe' | 'caution' | 'high' | 'critical';
  text: string;
  explanation: string;
  action: string;
}

// Weighted risk calculation
// Insulin: 35%, Meal: 25%, Sleep: 20%, Stress: 10%, Activity: 10%
export function calculateRiskScore(data: {
  insulinDose: number;
  insulinTime: string;
  lastMealTime: string;
  mealType: string;
  sleepHours: number;
  stressLevel: number;
  activityLevel: string;
  glucoseReading?: number;
  sensitivity?: 'conservative' | 'balanced' | 'aggressive';
}): number {
  const now = new Date();

  // Insulin factor (35%)
  const insulinTimeDiff = (now.getTime() - new Date(data.insulinTime).getTime()) / (1000 * 60 * 60);
  let insulinFactor = 0;
  if (data.insulinDose > 0) {
    if (insulinTimeDiff < 1) insulinFactor = 0.9;
    else if (insulinTimeDiff < 2) insulinFactor = 0.7;
    else if (insulinTimeDiff < 3) insulinFactor = 0.5;
    else if (insulinTimeDiff < 4) insulinFactor = 0.3;
    else insulinFactor = 0.1;
    insulinFactor *= Math.min(data.insulinDose / 10, 1.5);
  }

  // Meal factor (25%) — longer since meal = higher risk
  const mealTimeDiff = (now.getTime() - new Date(data.lastMealTime).getTime()) / (1000 * 60 * 60);
  let mealFactor = Math.min(mealTimeDiff / 6, 1);
  if (data.mealType === 'fasted') mealFactor = 1;
  else if (data.mealType === 'carb-heavy') mealFactor *= 0.5;
  else if (data.mealType === 'protein-heavy') mealFactor *= 0.8;
  else if (data.mealType === 'mixed') mealFactor *= 0.65;

  // Sleep factor (20%) — less sleep = higher risk
  let sleepFactor = 0;
  if (data.sleepHours < 5) sleepFactor = 0.9;
  else if (data.sleepHours < 6) sleepFactor = 0.7;
  else if (data.sleepHours < 7) sleepFactor = 0.4;
  else sleepFactor = 0.15;

  // Stress factor (10%)
  const stressFactor = data.stressLevel / 10;

  // Activity factor (10%)
  let activityFactor = 0;
  if (data.activityLevel === 'intense') activityFactor = 0.85;
  else if (data.activityLevel === 'moderate') activityFactor = 0.6;
  else if (data.activityLevel === 'light') activityFactor = 0.35;
  else activityFactor = 0.1;

  let raw = (insulinFactor * 35 + mealFactor * 25 + sleepFactor * 20 + stressFactor * 10 + activityFactor * 10);

  // Direct glucose reading override
  if (data.glucoseReading !== undefined && data.glucoseReading > 0) {
    if (data.glucoseReading < 55) raw = Math.max(raw, 90);
    else if (data.glucoseReading < 70) raw = Math.max(raw, 75);
    else if (data.glucoseReading < 100) raw = Math.max(raw, raw * 0.8);
    else if (data.glucoseReading > 180) raw = Math.min(raw, 30);
  }

  // Sensitivity adjustment
  const sens = data.sensitivity || 'balanced';
  if (sens === 'conservative') raw *= 0.8;
  else if (sens === 'aggressive') raw *= 1.2;

  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function getRiskLevel(score: number): string {
  if (score <= 30) return 'safe';
  if (score <= 55) return 'caution';
  if (score <= 75) return 'elevated';
  return 'critical';
}

export function getRiskLabel(level: string): string {
  if (level === 'safe') return 'SAFE';
  if (level === 'caution') return 'CAUTION';
  if (level === 'elevated') return 'HIGH RISK';
  return 'CRITICAL';
}

export function getInsulinStatus(insulinTime: string): string {
  const hrs = (Date.now() - new Date(insulinTime).getTime()) / (1000 * 60 * 60);
  if (hrs < 2) return 'Active';
  if (hrs < 4) return 'Fading';
  return 'Cleared';
}

export function getTimeSince(time: string): string {
  const mins = Math.floor((Date.now() - new Date(time).getTime()) / (1000 * 60));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function generateInsights(entry: Omit<LogEntry, 'id' | 'timestamp' | 'riskScore' | 'riskLevel' | 'insights'>): InsightCard[] {
  const insights: InsightCard[] = [];
  const now = new Date();
  const insulinHrs = (now.getTime() - new Date(entry.insulinTime).getTime()) / (1000 * 60 * 60);
  const mealHrs = (now.getTime() - new Date(entry.lastMealTime).getTime()) / (1000 * 60 * 60);

  if (entry.insulinDose > 0 && insulinHrs < 3 && mealHrs > 3) {
    insights.push({
      id: crypto.randomUUID(),
      severity: 'critical',
      text: 'Insulin still active with no recent meal — elevated crash risk.',
      explanation: `Your insulin was taken ${insulinHrs.toFixed(1)} hours ago and is still active (window: 4h). Your last meal was ${mealHrs.toFixed(1)} hours ago. Without recent food intake, blood glucose may drop rapidly.`,
      action: 'Consider eating a snack with 15-20g of fast-acting carbohydrates now.',
    });
  }

  if (entry.sleepHours < 6) {
    insights.push({
      id: crypto.randomUUID(),
      severity: 'caution',
      text: `Only ${entry.sleepHours} hours of sleep — impaired glucose regulation likely.`,
      explanation: 'Sleep deprivation reduces insulin sensitivity and impairs the body\'s ability to regulate glucose. Studies show even one night of poor sleep can increase insulin resistance.',
      action: 'Monitor glucose more frequently today and consider reducing insulin dose after consulting your care plan.',
    });
  }

  if (entry.activityLevel === 'intense' && insulinHrs < 4) {
    insights.push({
      id: crypto.randomUUID(),
      severity: 'high',
      text: 'Intense exercise with active insulin — high hypoglycaemia risk.',
      explanation: 'Physical activity increases glucose uptake by muscles. Combined with active insulin, this creates a dual glucose-lowering effect that can cause rapid drops.',
      action: 'Have a carbohydrate snack before exercise and keep glucose tablets nearby.',
    });
  }

  if (entry.stressLevel >= 7) {
    insights.push({
      id: crypto.randomUUID(),
      severity: 'caution',
      text: 'High stress detected — glucose levels may be unpredictable.',
      explanation: 'Stress hormones (cortisol, adrenaline) can cause glucose to rise initially, then crash. High stress also impairs decision-making about food and medication timing.',
      action: 'Practice a brief breathing exercise and check glucose within the next 30 minutes.',
    });
  }

  if (entry.mealType === 'fasted' && mealHrs > 5) {
    insights.push({
      id: crypto.randomUUID(),
      severity: 'high',
      text: `Fasting for ${mealHrs.toFixed(0)}+ hours — glucose reserves may be depleted.`,
      explanation: 'Extended fasting depletes liver glycogen stores, reducing the body\'s ability to maintain baseline glucose levels, especially if insulin is active.',
      action: 'Eat a balanced meal soon. If glucose drops below 70 mg/dL, consume 15g fast-acting carbs immediately.',
    });
  }

  if (entry.glucoseReading && entry.glucoseReading < 80 && entry.glucoseReading >= 70) {
    insights.push({
      id: crypto.randomUUID(),
      severity: 'caution',
      text: `Glucose at ${entry.glucoseReading} mg/dL — approaching hypoglycaemia threshold.`,
      explanation: 'Your current glucose reading is within the lower normal range. If insulin is still active or you haven\'t eaten recently, it may continue to drop.',
      action: 'Consider a small snack and recheck in 15-30 minutes.',
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: crypto.randomUUID(),
      severity: 'safe',
      text: 'All factors look balanced — low risk at this time.',
      explanation: 'Your current combination of meal timing, insulin status, sleep, activity, and stress levels suggests stable glucose regulation.',
      action: 'Continue monitoring and log your next meal or insulin dose when it occurs.',
    });
  }

  return insights;
}

export function generatePredictionData(currentGlucose: number, riskScore: number): { labels: string[]; actual: (number | null)[]; predicted: number[]; upper: number[]; lower: number[] } {
  const labels: string[] = [];
  const actual: (number | null)[] = [];
  const predicted: number[] = [];
  const upper: number[] = [];
  const lower: number[] = [];
  const now = new Date();

  // Past 2 hours (simulated from current reading)
  for (let i = -120; i <= 0; i += 15) {
    const t = new Date(now.getTime() + i * 60000);
    labels.push(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const variance = (Math.random() - 0.5) * 15;
    const val = currentGlucose + variance + (i / 120) * (riskScore > 50 ? 20 : 5);
    actual.push(Math.round(val));
    predicted.push(Math.round(val));
    upper.push(Math.round(val + 10));
    lower.push(Math.round(val - 10));
  }

  // Future 2 hours (prediction)
  const dropRate = riskScore / 100 * 0.5;
  let lastVal = currentGlucose;
  for (let i = 15; i <= 120; i += 15) {
    const t = new Date(now.getTime() + i * 60000);
    labels.push(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    actual.push(null);
    lastVal -= dropRate * 15 * (0.8 + Math.random() * 0.4);
    const p = Math.round(Math.max(40, lastVal));
    predicted.push(p);
    upper.push(Math.round(p + 15 + i / 10));
    lower.push(Math.round(Math.max(35, p - 15 - i / 10)));
  }

  return { labels, actual, predicted, upper, lower };
}

// LocalStorage helpers
const USERS_KEY = 'glucosense_users';
const SESSION_KEY = 'glucosense_session';
const LOGS_KEY = 'glucosense_logs';

export function getUsers(): Record<string, UserProfile> {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; }
}

export function saveUser(user: UserProfile) {
  const users = getUsers();
  users[user.email] = user;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loginUser(email: string, password: string): UserProfile | null {
  const users = getUsers();
  const user = users[email];
  if (user && user.password === password) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }
  return null;
}

export function getSession(): UserProfile | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateProfile(updates: Partial<UserProfile>) {
  const session = getSession();
  if (!session) return;
  const updated = { ...session, ...updates };
  saveUser(updated);
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
}

export function getLogs(): LogEntry[] {
  try { return JSON.parse(localStorage.getItem(LOGS_KEY) || '[]'); } catch { return []; }
}

export function saveLog(entry: LogEntry) {
  const logs = getLogs();
  logs.unshift(entry);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function clearAllData() {
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LOGS_KEY);
}

export function exportDataAsJson(): string {
  return JSON.stringify({
    users: getUsers(),
    session: getSession(),
    logs: getLogs(),
  }, null, 2);
}

export function getLatestLog(): LogEntry | null {
  const logs = getLogs();
  return logs.length > 0 ? logs[0] : null;
}

export function getTimelineSummary(logs: LogEntry[]): { mostCommonRiskTime: string; avgRiskScore: number; highRiskCount: number; pattern: string } {
  if (logs.length === 0) return { mostCommonRiskTime: 'N/A', avgRiskScore: 0, highRiskCount: 0, pattern: 'No data logged yet.' };

  const avgRisk = Math.round(logs.reduce((s, l) => s + l.riskScore, 0) / logs.length);
  const highRiskLogs = logs.filter(l => l.riskScore > 55);
  
  // Find most common time period
  const hours = logs.map(l => new Date(l.timestamp).getHours());
  const periods: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  hours.forEach(h => {
    if (h >= 5 && h < 12) periods.morning++;
    else if (h >= 12 && h < 17) periods.afternoon++;
    else if (h >= 17 && h < 21) periods.evening++;
    else periods.night++;
  });
  const topPeriod = Object.entries(periods).sort((a, b) => b[1] - a[1])[0][0];

  let pattern = 'Not enough data to identify patterns yet.';
  if (highRiskLogs.length >= 3) {
    const hrHours = highRiskLogs.map(l => new Date(l.timestamp).getHours());
    const hrPeriods: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    hrHours.forEach(h => {
      if (h >= 5 && h < 12) hrPeriods.morning++;
      else if (h >= 12 && h < 17) hrPeriods.afternoon++;
      else if (h >= 17 && h < 21) hrPeriods.evening++;
      else hrPeriods.night++;
    });
    const topHrPeriod = Object.entries(hrPeriods).sort((a, b) => b[1] - a[1])[0];
    if (topHrPeriod[1] >= 2) {
      pattern = `${topHrPeriod[1]} of your ${highRiskLogs.length} high-risk events occurred in the ${topHrPeriod[0]} — consider a ${topHrPeriod[0]} snack routine.`;
    }
  }

  return { mostCommonRiskTime: topPeriod, avgRiskScore: avgRisk, highRiskCount: highRiskLogs.length, pattern };
}
