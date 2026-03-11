import { Check } from "lucide-react";

const STEPS = [
  { value: "pending", label: "รอจัดส่ง" },
  { value: "shipped", label: "ส่งแล้ว" },
  { value: "delivered", label: "ส่งถึงแล้ว" },
] as const;

export function FulfillmentStepperReadOnly({ currentStatus }: { currentStatus: string | null }) {
  const value = currentStatus ?? "pending";
  const currentIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.value === value)
  );

  return (
    <div className="w-full">
      <div className="relative flex w-full items-stretch">
        <div
          className="absolute left-0 right-0 top-5 h-1 -translate-y-1/2 rounded-full bg-muted"
          aria-hidden
        />
        <div
          className="absolute left-0 top-5 h-1 -translate-y-1/2 rounded-full bg-primary transition-all duration-300"
          style={{
            width: currentIndex === 0 ? "0%" : `${(currentIndex / (STEPS.length - 1)) * 100}%`,
          }}
          aria-hidden
        />

        {STEPS.map((step, index) => {
          const isActive = step.value === value;
          const isPast = currentIndex > index;

          return (
            <div
              key={step.value}
              className="relative z-10 flex flex-1 flex-col items-center"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isPast
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/50 bg-muted/50 text-muted-foreground"
                }`}
                aria-hidden
              >
                {isPast ? <Check className="h-5 w-5" strokeWidth={2.5} /> : index + 1}
              </span>
              <span
                className={`mt-2 text-center text-xs font-medium ${
                  isActive ? "text-foreground" : isPast ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
