// GlucoSense — Notifications library

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'reminder' | 'activity' | 'insight';
  severity: 'critical' | 'high' | 'caution' | 'safe';
  time: string;
  read: boolean;
}

const NOTIF_KEY = 'glucosense_notifications';

export function getNotifications(): Notification[] {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]'); } catch { return []; }
}

export function saveNotifications(notifs: Notification[]) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
}

export function markAllRead() {
  const notifs = getNotifications().map(n => ({ ...n, read: true }));
  saveNotifications(notifs);
}

export function markOneRead(id: string) {
  const notifs = getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
  saveNotifications(notifs);
}

export function clearNotifications() {
  localStorage.removeItem(NOTIF_KEY);
}

export function generateNotificationsFromLogs() {
  try {
    const logs = JSON.parse(localStorage.getItem('glucosense_logs') || '[]');
    if (!logs.length) return;

    const latest = logs[0];
    const existing = getNotifications();
    const newNotifs: Notification[] = [];

    if (latest.riskScore >= 75) {
      newNotifs.push({
        id: crypto.randomUUID(),
        title: 'Critical Risk Detected',
        message: `Your risk score is ${latest.riskScore}/100. Take action immediately.`,
        type: 'alert',
        severity: 'critical',
        time: new Date().toISOString(),
        read: false,
      });
    } else if (latest.riskScore >= 55) {
      newNotifs.push({
        id: crypto.randomUUID(),
        title: 'Elevated Risk',
        message: `Risk score ${latest.riskScore}/100. Monitor your glucose closely.`,
        type: 'alert',
        severity: 'high',
        time: new Date().toISOString(),
        read: false,
      });
    }

    if (latest.insights?.length) {
      latest.insights.slice(0, 2).forEach((insight: { text: string; severity: string }) => {
        newNotifs.push({
          id: crypto.randomUUID(),
          title: 'AI Insight',
          message: insight.text,
          type: 'insight',
          severity: insight.severity as Notification['severity'],
          time: new Date().toISOString(),
          read: false,
        });
      });
    }

    saveNotifications([...newNotifs, ...existing].slice(0, 50));
  } catch {
    // fail silently
  }
}
