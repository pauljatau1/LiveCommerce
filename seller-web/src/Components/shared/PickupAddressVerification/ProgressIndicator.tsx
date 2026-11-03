import { CheckCircle } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="relative mx-6 mt-4">
      <div className="absolute top-1/2 h-1 w-full bg-gray-200 dark:bg-gray-700 -translate-y-1/2 rounded-full"></div>
      <div
        className="absolute top-1/2 h-1 bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-500 -translate-y-1/2 transition-all duration-300 ease-in-out rounded-full"
        style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
      ></div>
      <div className="relative flex justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-medium transition-all duration-200 ease-in-out z-10 border-2 ${
              index < currentStep
                ? "bg-green-600 text-white border-green-600 shadow-md shadow-green-100 dark:shadow-none"
                : index === currentStep
                ? "bg-white text-green-600 border-green-600 ring-4 ring-green-100 dark:ring-green-900 dark:bg-gray-800"
                : "bg-white text-gray-400 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
            }`}
          >
            {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

