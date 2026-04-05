import { getSession } from "@/lib/glucosense";

interface Props { open: boolean; onClose: () => void; }

export default function EmergencySOSModal({ open, onClose }: Props) {
  const session = getSession();

  const smsTemplate = `URGENT: I may be experiencing a hypoglycaemic episode. My name is ${session?.fullName || '[Name]'}. I am a diabetic patient. Please check on me immediately. If I am unresponsive, call emergency services.`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative glass-card max-w-lg w-full p-6 border-destructive/40" onClick={e => e.stopPropagation()} style={{ borderColor: 'rgba(230,57,70,0.4)' }}>
        <h2 className="font-heading text-destructive text-xl mb-4 flex items-center gap-2">🆘 Hypoglycaemia Emergency</h2>
        
        <div className="space-y-4 text-sm font-body text-foreground/80">
          <div className="glass-card p-4">
            <h3 className="font-heading text-xs text-primary mb-2">IMMEDIATE STEPS</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>Eat 15g of fast-acting carbohydrates</strong> — glucose tablets, juice, regular soda, or honey</li>
              <li><strong>Wait 15 minutes</strong> — sit or lie down safely</li>
              <li><strong>Recheck your blood glucose</strong> — if still below 70 mg/dL, repeat step 1</li>
              <li><strong>Once stable</strong> — eat a snack with protein and complex carbs</li>
            </ol>
          </div>

          <div className="glass-card p-4">
            <h3 className="font-heading text-xs text-warning mb-2">SMS TEMPLATE</h3>
            <p className="text-foreground/60 text-xs mb-2">Copy this message to send to an emergency contact:</p>
            <p className="bg-muted/30 p-3 rounded-lg text-xs">{smsTemplate}</p>
            <button onClick={() => navigator.clipboard.writeText(smsTemplate)} className="mt-2 text-xs text-primary hover:underline">📋 Copy to clipboard</button>
          </div>

          <div className="glass-card p-4">
            <h3 className="font-heading text-xs text-safe mb-2">HELPLINE REFERENCES</h3>
            <p className="text-xs text-foreground/60">WHO Diabetes helpline: Refer to your country-specific emergency number (e.g. 911 in the US, 112 in the EU, 999 in the UK)</p>
            <p className="text-xs text-foreground/40 mt-1">International Diabetes Federation: <span className="text-primary">idf.org</span></p>
          </div>
        </div>

        <button onClick={onClose} className="mt-4 w-full py-2 glass-card text-sm text-foreground/60 hover:text-foreground transition-colors text-center">Close</button>
      </div>
    </div>
  );
}
