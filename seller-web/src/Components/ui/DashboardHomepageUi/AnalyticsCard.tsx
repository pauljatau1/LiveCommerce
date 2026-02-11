import { useNavigate } from "react-router-dom";
import { formatChangeFromLastWeek } from "@/util/helpers";
import type { ComponentType } from "react";

interface AnalyticsCardProps {
  id: string;
  title: string;
  icon: ComponentType<{ color?: string; width?: number; height?: number; className?: string }>;
  current: string;
  value: number | undefined | null;
  type: string | undefined;
  iconColor: string;
  iconBackground: string;
  link: string;
}

// Map Tailwind color classes to hex values
const colorMap: Record<string, string> = {
  "green-600": "#16a34a",
  "blue-600": "#2563eb",
  "purple-600": "#9333ea",
  "orange-600": "#ea580c",
};

const getIconColor = (iconColorClass: string): string => {
  const colorMatch = iconColorClass.match(/text-([a-z]+-\d+)/);
  const colorKey = colorMatch ? colorMatch[1] : "green-600";
  return colorMap[colorKey] || colorMap["green-600"];
};

export default function AnalyticsCard({
  title,
  icon: Icon,
  current,
  value,
  type,
  iconColor,
  iconBackground,
  link,
}: AnalyticsCardProps) {
  const navigate = useNavigate();
  const trend = value !== undefined && value !== null && value >= 0 ? "up" : "down";
  const changeText = formatChangeFromLastWeek(value, type);
  const iconColorHex = getIconColor(iconColor);

  return (
    <div
      onClick={() => navigate(link)}
      className="w-full h-full p-6 border border-solid border-#EDF2F7 bg-white rounded-2xl shadow-[0px_3px_8px_-1px_rgba(50,50,71,0.05)] flex flex-col justify-start items-start gap-2.5 cursor-pointer hover:shadow-[0px_4px_12px_-1px_rgba(50,50,71,0.08)] transition-shadow"
    >
      {/* Mobile Layout */}
      <div className="sm:hidden self-stretch flex flex-col justify-start items-start gap-2">
        {/* Icon */}
        <div className={`w-11 h-11 relative ${iconBackground} rounded-[100px] flex items-center justify-center`}>
          <Icon width={16} height={16} color={iconColorHex} />
        </div>
        
        {/* Title and Value */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2.5">
          <div className="self-stretch inline-flex justify-start items-center gap-2">
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-1">
              <div className="self-stretch inline-flex justify-start items-center gap-3">
                <div className="justify-start text-slate-500 text-xs font-semibold font-['Lexend'] leading-4">
                  {title}
                </div>
              </div>
              <div className="justify-start text-gray-900 text-xl font-semibold font-['Lexend'] leading-7">
                {current}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex self-stretch flex-col justify-start items-start gap-4">
        <div className="self-stretch flex flex-col justify-start items-start gap-2.5">
          <div className="self-stretch inline-flex justify-start items-center gap-2">
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-1">
              <div className="self-stretch inline-flex justify-start items-center gap-3">
                <div className="justify-start text-slate-500 text-xs font-semibold font-['Lexend'] leading-4">
                  {title}
                </div>
              </div>
              <div className="self-stretch justify-start">
                {title === "Payable Balance" ? (
                  <>
                    <span className="text-gray-900 text-xl font-semibold font-['Lexend'] line-through leading-7">₦</span>
                    <span className="text-gray-900 text-xl font-semibold font-['Lexend'] leading-7"> {current}</span>
                  </>
                ) : (
                  <span className="text-gray-900 text-xl font-semibold font-['Lexend'] leading-7">{current}</span>
                )}
              </div>
            </div>
            <div className="w-11 h-11 flex justify-end items-start">
              <div className={`w-11 h-11 relative ${iconBackground} rounded-[100px] flex items-center justify-center`}>
                <Icon width={16} height={16} color={iconColorHex} />
              </div>
            </div>
          </div>
          <div className="self-stretch inline-flex justify-start items-center gap-2.5">
            <div className="inline-flex flex-col justify-start items-start gap-2.5">
              <div className={`px-2 py-0.5 ${trend === "up" ? "bg-green-100" : "bg-red-100"} rounded-md flex flex-col justify-start items-center gap-2.5`}>
                <div className="p-0.5 inline-flex justify-start items-center gap-1.5">
                  <div className={`justify-center ${trend === "up" ? "text-green-600" : "text-red-600"} text-[10px] font-bold font-['Inter'] leading-4`}>
                    {changeText || "+0.00%"}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 justify-center text-slate-500 text-[10px] font-medium font-['Inter'] leading-4">
              vs last week
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

