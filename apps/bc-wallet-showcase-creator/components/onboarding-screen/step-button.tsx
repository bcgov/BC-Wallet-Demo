import { ArrowRight } from "lucide-react";

interface StepButtonProps {
  title: string;
  details: string[];
  onClick: () => void;
}

const StepButton = ({ title, details, onClick }: StepButtonProps) => {
  return (
    <button
      className="flex items-center justify-between w-full px-3 py-2 my-2 text-left border rounded-lg shadow-sm 
      border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg
      hover:bg-foreground/10 transition-all duration-200"
      onClick={onClick}
    >
      <p className="text-sm font-semibold w-1/4">{title}</p>
      <div className="w-1/4">
        <ul className="text-xs text-foreground/80 space-y-1">
          {details.map((detail, index) => (
            <li key={index}>• {detail}</li>
          ))}
        </ul>
      </div>
      <p className="text-sm font-medium flex items-center gap-1 text-foreground">
        Add Step <ArrowRight strokeWidth={2.5} size={16} />
      </p>
    </button>
  );
};

export default StepButton;
