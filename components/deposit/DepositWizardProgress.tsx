import DepositProgressBar from "./DepositProgressBar";

interface DepositWizardProgressProps {
  currentStep: number;
  canGoToStep: (step: number) => boolean;
  onStepClick?: (step: number) => void;
}

export default function DepositWizardProgress({
  currentStep,
  canGoToStep,
  onStepClick,
}: DepositWizardProgressProps) {
  // Mapear los pasos del wizard a la estructura del ProgressBar original
  const wizardSteps = [
    { id: "Paso 1", name: "Cuenta Origen", href: "#" },
    { id: "Paso 2", name: "Cuenta Destino", href: "#" },
    { id: "Paso 3", name: "Comprobante", href: "#" },
    { id: "Paso 4", name: "Confirmar", href: "#" },
  ];

  // Determinar el estado de cada paso
  const stepsWithStatus = wizardSteps.map((step, index) => {
    const stepNumber = index + 1;
    let status: "complete" | "current" | "upcoming";

    if (stepNumber < currentStep) {
      status = "complete";
    } else if (stepNumber === currentStep) {
      status = "current";
    } else {
      status = "upcoming";
    }

    return { ...step, status };
  });

  // Crear componente que usa la estructura original pero con nuestros datos
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {stepsWithStatus.map((step, index) => {
          const stepNumber = index + 1;
          const isClickable = canGoToStep(stepNumber);

          return (
            <li key={step.name} className="md:flex-1">
              {step.status === "complete" ? (
                <button
                  onClick={() => isClickable && onStepClick?.(stepNumber)}
                  disabled={!isClickable}
                  className="group flex flex-col border-0 border-t-4 border-indigo-600 hover:border-indigo-800 dark:border-indigo-500 dark:hover:border-indigo-400 pt-4 w-full text-left disabled:opacity-50 rounded-none"
                >
                  <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-800 dark:text-indigo-400 dark:group-hover:text-indigo-300">
                    {step.id}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {step.name}
                  </span>
                </button>
              ) : step.status === "current" ? (
                <div className="flex flex-col border-t-4 border-indigo-600 pt-4 dark:border-indigo-500">
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {step.id}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {step.name}
                  </span>
                </div>
              ) : (
                <div className="group flex flex-col border-t-4 border-gray-200 pt-4 hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20">
                  <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300">
                    {step.id}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {step.name}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
