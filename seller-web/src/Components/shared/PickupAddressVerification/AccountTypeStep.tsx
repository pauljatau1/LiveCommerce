import { User, Building, Shield, Briefcase, CreditCard, Globe } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/Components/ui/radio-group";
import { Label } from "@/Components/ui/label";
import type { AccountType } from "@/schemas/pickupAddressSchema";

interface AccountTypeStepProps {
  accountType: AccountType | "";
  onAccountTypeChange: (value: AccountType) => void;
}

export function AccountTypeStep({ accountType, onAccountTypeChange }: AccountTypeStepProps) {
  return (
    <div className="py-6">
      <RadioGroup
        value={accountType}
        onValueChange={onAccountTypeChange}
        className="space-y-6"
      >
        <div
          className={`flex items-start space-x-4 rounded-xl border p-5 transition-all duration-200 hover:shadow-md cursor-pointer ${
            accountType === "individual"
              ? "border-green-600 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 shadow-lg shadow-green-100 dark:shadow-none"
              : "hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
          }`}
          onClick={() => onAccountTypeChange("individual")}
        >
          <RadioGroupItem value="individual" id="individual" className="mt-1" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center">
              <Label htmlFor="individual" className="font-medium text-lg flex items-center gap-2 cursor-pointer">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40">
                  <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                Individual Account
              </Label>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              For personal sellers, freelancers, or sole proprietors who don&apos;t have a
              registered business entity. Simpler verification requirements but with some
              limitations on transaction volumes.
            </p>
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Simpler Verification
              </span>
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 flex items-center gap-1">
                <User className="h-3 w-3" /> Personal Use
              </span>
            </div>
          </div>
        </div>

        <div
          className={`flex items-start space-x-4 rounded-xl border p-5 transition-all duration-200 hover:shadow-md cursor-pointer ${
            accountType === "business"
              ? "border-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-lg shadow-blue-100 dark:shadow-none"
              : "hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
          }`}
          onClick={() => onAccountTypeChange("business")}
        >
          <RadioGroupItem value="business" id="business" className="mt-1" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center">
              <Label htmlFor="business" className="font-medium text-lg flex items-center gap-2 cursor-pointer">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40">
                  <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Business Account
              </Label>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              For registered businesses, companies, partnerships or organizations with a formal
              business structure. Provides higher transaction limits and additional
              business-focused features.
            </p>
            <div className="flex gap-2 mt-2 text-xs flex-wrap">
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> Business Features
              </span>
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 flex items-center gap-1">
                <CreditCard className="h-3 w-3" /> Higher Limits
              </span>
              <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 flex items-center gap-1">
                <Globe className="h-3 w-3" /> Global Access
              </span>
            </div>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}

