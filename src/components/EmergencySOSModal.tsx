import { getSession } from "@/lib/glucosense";

interface Props { open: boolean; onClose: () => void; }

export default function EmergencySOSModal({ open, onClose }: Props) {
  const session = getSession();

  const smsTemplate = `⚠️ URGENT: I may be experiencing low blood sugar (hypoglycaemia). My name is ${session?.fullName || '[Name]'}. I am diabetic and may need immediate help. Please check on me as soon as possible. 📍 My location: [Auto-shared] If I do not respond, please call emergency services (108).`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative glass-card max-w-lg w-full p-6 border-destructive/40 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ borderColor: 'rgba(230,57,70,0.4)' }}>
        
        <h2 className="font-heading text-destructive text-xl mb-4 flex items-center gap-2">🔴 Hypoglycaemia Emergency</h2>

        <div className="space-y-4 text-sm font-body text-foreground/80">

          {/* Immediate Action */}
          <div className="glass-card p-4">
            <h3 className="font-heading text-xs text-primary mb-3">⚡ IMMEDIATE ACTION</h3>
            <p className="text-xs text-foreground/60 mb-3">If blood sugar is below 70 mg/dL or symptoms appear:</p>
            <ol className="space-y-3 text-xs">
              <li>
                <strong className="text-foreground">1. Take 15g fast-acting sugar</strong>
                <ul className="mt-1 ml-3 space-y-0.5 text-foreground/60 list-none">
                  <li>• 3–4 teaspoons sugar in water</li>
                  <li>• 1 tablespoon honey</li>
                  <li>• 1 small glass fruit juice</li>
                  <li>• Glucose powder (e.g., Glucon-D)</li>
                </ul>
              </li>
              <li>
                <strong className="text-foreground">2. Wait 15 minutes</strong>
                <p className="ml-3 text-foreground/60 mt-0.5">Sit or lie down safely. Avoid walking or driving.</p>
              </li>
              <li>
                <strong className="text-foreground">3. Recheck blood sugar</strong>
                <ul className="mt-1 ml-3 space-y-0.5 text-foreground/60 list-none">
                  <li>• If still below 70 mg/dL → repeat step 1</li>
                  <li>• If normal → continue below</li>
                </ul>
              </li>
              <li>
                <strong className="text-foreground">4. Eat to stabilize</strong>
                <ul className="mt-1 ml-3 space-y-0.5 text-foreground/60 list-none">
                  <li>• Roti + sabzi</li>
                  <li>• Biscuits + milk</li>
                  <li>• Banana + peanuts</li>
                </ul>
              </li>
            </ol>
          </div>

          {/* Emergency Message */}
          <div className="glass-card p-4">
            <h3 className="font-heading text-xs text-warning mb-2">🚨 EMERGENCY MESSAGE</h3>
            <p className="text-foreground/60 text-xs mb-2">Tap to send:</p>
            <p className="bg-muted/30 p-3 rounded-lg text-xs leading-relaxed">{smsTemplate}</p>
            <button onClick={() => navigator.clipboard.writeText(smsTemplate)} className="mt-2 text-xs text-primary hover:underline">📋 Copy to clipboard</button>
          </div>

          {/* Helpline */}
          <div className="glass-card p-4">
            <h3 className="font-heading text-xs text-primary mb-3">📞 HELPLINE (INDIA)</h3>
            <ul className="text-xs space-y-1 text-foreground/70 list-none">
              <li>🚑 Ambulance: <strong className="text-foreground">108</strong></li>
              <li>🚨 Emergency (All-in-one): <strong className="text-foreground">112</strong></li>
              <li>👮 Police: <strong className="text-foreground">100</strong></li>
            </ul>
          </div>

          {/* When to seek help */}
          <div className="glass-card p-4">
            <h3 className="font-heading text-xs text-warning mb-3">⚠️ WHEN TO SEEK IMMEDIATE HELP</h3>
            <ul className="text-xs space-y-1 text-foreground/70 list-none">
              <li>• Unconscious or unable to respond</li>
              <li>• Seizures or severe confusion</li>
              <li>• No improvement after 2–3 cycles of sugar intake</li>
            </ul>
          </div>

          {/* Symptoms */}
          <div className="glass-card p-4">
            <h3 className="font-heading text-xs text-primary mb-3">💡 QUICK SYMPTOMS CHECK</h3>
            <div className="grid grid-cols-2 gap-1 text-xs text-foreground/70">
              <span>• Sweating</span>
              <span>• Shaking</span>
              <span>• Dizziness</span>
              <span>• Hunger</span>
              <span>• Confusion</span>
            </div>
          </div>

        </div>

        <button onClick={onClose} className="mt-4 w-full py-2 glass-card text-sm text-foreground/60 hover:text-foreground transition-colors text-center">Close</button>
      </div>
    </div>
  );
}
