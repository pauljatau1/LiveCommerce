import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog";
import {
  profileCompletionSchema,
  pickupAddressSchema,
  type ProfileCompletionFormData,
  type PickupAddressFormData,
  type AccountType,
} from "@/schemas/pickupAddressSchema";
import { Form } from "@/Components/ui/form/form";
import { Button } from "@/Components/ui/button";
import { useForm } from "react-hook-form";
import { VideoModal } from "./PickupAddressVerification/VideoModal";
import { InitialView } from "./PickupAddressVerification/InitialView";
import { sellerUtils } from "@/util/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { sellerService } from "@/services/sellerService";
import { useQueryClient } from "@tanstack/react-query";
import { useNotification } from "@/Hooks/useNotification";
import { AccountTypeStep } from "./PickupAddressVerification/AccountTypeStep";
import { locationService } from "@/services/locationService";
import { ProgressIndicator } from "./PickupAddressVerification/ProgressIndicator";
import { verificationService } from "@/services/verificationServiceV2";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ProfileCompletionStep } from "./PickupAddressVerification/ProfileCompletionStep";
import { getYoutubeVideoId, getYoutubeThumbnail } from "@/util/helpers";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronRight, ChevronLeft, MapPin, CheckSquare, Loader2 } from "lucide-react";
import  AddressStep  from "./PickupAddressVerification/AddressStep";
import StarIcon from "@/assets/icons/StarIcon";

interface PickupAddressVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPending?: boolean;
  title?: string;
  message?: string;
}

type ViewType = "initial" | "verification";

export default function PickupAddressVerificationModal({
  isOpen,
  onClose,
  isPending = false,
  title,
  message,
}: PickupAddressVerificationModalProps) {
  const [currentView, setCurrentView] = useState<ViewType>("initial");
  const [currentStep, setCurrentStep] = useState(0);
  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  // Retrieve current seller using sellerUtils to drive conditional UI and defaults
  const currentSeller = useMemo(() => sellerUtils.getSeller(), []);

  // Per requirement: show the complete-profile step only if seller?.storeName && seller?.phoneNumber is true
  const showCompleteProfileStep = !(currentSeller?.storeName && currentSeller?.phoneNumber);

  // Profile completion form
  const profileForm = useForm<ProfileCompletionFormData>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      phoneNumber: currentSeller?.phoneNumber || "",
      storeName: currentSeller?.storeName || "",
    },
  });

  // Address form
  const addressForm = useForm<PickupAddressFormData>({
    resolver: zodResolver(pickupAddressSchema),
    defaultValues: {
      country: "nigeria",
      state: "",
      city: "",
      streetAddress1: "",
      streetAddress2: "",
      zipCode: "",
    },
  });

  // Fetch states
  const selectedState = addressForm.watch("state");
  const {
    data: states,
    isLoading: isLoadingStates,
    isError: isErrorStates,
  } = useQuery({
    queryKey: ["states"],
    queryFn: () => locationService.fetchStates(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Find selected state object to get ISO code
  const selectedStateObj = states?.find((s) => s.name === selectedState);

  // Fetch cities when state is selected
  const {
    data: cities,
    isLoading: isLoadingCities,
    isError: isErrorCities,
  } = useQuery({
    queryKey: ["cities", selectedStateObj?.isoCode],
    queryFn: () => {
      if (!selectedStateObj?.isoCode) throw new Error("State code not found");
      return locationService.fetchCities(selectedStateObj.isoCode);
    },
    enabled: !!selectedStateObj?.isoCode,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Onboarding video details
  const onboardingVideoUrl = "https://www.youtube.com/watch?v=nAMdwpL_u90";
  const videoId = getYoutubeVideoId(onboardingVideoUrl);
  const thumbnailUrl = videoId ? getYoutubeThumbnail(videoId) : null;

  // Set default title and message based on status
  const defaultTitle = "Pickup Address Required";
  const defaultMessage = showCompleteProfileStep
    ? "Your seller account does not have a pickup address, store name and phone number yet. To access product listing features and start selling on Auqli, you need to add a pickup address, store name and phone number."
    : "Your seller account does not have a pickup address yet. To access product listing features and start selling on Auqli as a new seller, you need to add a pickup address.";

  const displayTitle = title || defaultTitle;
  const displayMessage = message || defaultMessage;

  // Verification steps (conditionally include complete-profile step first)
  const verificationSteps = useMemo(() => {
    const steps: Array<{
      id: string;
      title: string;
      description: string;
      content: React.ReactNode;
    }> = [];

    if (showCompleteProfileStep) {
      steps.push({
        id: "complete-profile",
        title: "Complete Profile",
        description: "Confirm or update your store name and phone number",
        content: <ProfileCompletionStep form={profileForm} />,
      });
    }

    steps.push({
      id: "account-type",
      title: "Account Type",
      description: "Choose the type of account you're creating",
      content: (
        <AccountTypeStep
          accountType={accountType}
          onAccountTypeChange={(value) => setAccountType(value)}
        />
      ),
    });

    steps.push({
      id: "address-info",
      title: "Address Information",
      description: "Enter your pickup address details",
      content: (
        <AddressStep
          form={addressForm}
          states={states || []}
          cities={cities || []}
          isLoadingStates={isLoadingStates}
          isLoadingCities={isLoadingCities}
          isErrorStates={isErrorStates}
          isErrorCities={isErrorCities}
        />
      ),
    });

    return steps;
  }, [
    showCompleteProfileStep,
    accountType,
    profileForm,
    addressForm,
    states,
    cities,
    isLoadingStates,
    isLoadingCities,
    isErrorStates,
    isErrorCities,
  ]);

  // Profile completion mutation
  const profileMutation = useMutation({
    mutationFn: (data: ProfileCompletionFormData) =>
      sellerService.completeSellerProfile({
        phoneNumber: data.phoneNumber,
        storeName: data.storeName,
      }),
  });

  // Account type selection mutation
  const accountTypeMutation = useMutation({
    mutationFn: (accountType: AccountType) => verificationService.selectAccountType(accountType),
  });

  // Address update mutation
  const addressMutation = useMutation({
    mutationFn: async (data: {
      accountType: AccountType;
      addressData: PickupAddressFormData;
    }) => {
      if (data.accountType === "individual") {
        const seller = sellerUtils.getSeller();
        return verificationService.updateIndividualInformation({
          firstName: seller?.firstName || "",
          lastName: seller?.lastName || "",
          sellerAddress: {
            country: data.addressData.country,
            state: data.addressData.state,
            city: data.addressData.city,
            addressLine1: data.addressData.streetAddress1,
            addressLine2: data.addressData.streetAddress2 || "",
            zipCode: data.addressData.zipCode,
          },
        });
      } else {
        const seller = sellerUtils.getSeller();
        return verificationService.addBusinessInformation({
          businessEmail: seller?.email || "",
          businessNumber: seller?.phoneNumber || "",
          businessAddress: {
            country: data.addressData.country,
            state: data.addressData.state,
            city: data.addressData.city,
            addressLine1: data.addressData.streetAddress1,
            addressLine2: data.addressData.streetAddress2 || "",
            zipCode: data.addressData.zipCode,
          },
        });
      }
    },
  });

  const validateCurrentStep = useCallback(() => {
    const step = verificationSteps[currentStep]?.id;
    if (step === "complete-profile") {
      return profileForm.formState.isValid;
    }
    if (step === "account-type") {
      return !!accountType;
    }
    if (step === "address-info") {
      return addressForm.formState.isValid;
    }
    return true;
  }, [currentStep, verificationSteps, profileForm.formState.isValid, accountType, addressForm.formState.isValid]);

  const nextStep = useCallback(() => {
    // If at the last step, submit
    if (currentStep === verificationSteps.length - 1) {
      handleSubmit();
      return;
    }
    if (currentStep < verificationSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, verificationSteps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      setCurrentView("initial");
      setCurrentStep(0);
      setAccountType("");
    }
  }, [currentStep]);

  const handleSubmit = async () => {
    try {
      // 0. Optionally complete seller profile (storeName and phoneNumber) if step is included
      let profileCompletedOk = true;
      if (showCompleteProfileStep) {
        const profileData = profileForm.getValues();
        try {
          await profileMutation.mutateAsync(profileData);
          profileCompletedOk = true;
        } catch {
          profileCompletedOk = false;
        }
      }

      if (!profileCompletedOk) {
        showNotification(
          "Could not complete profile update. Please try again.",
          "error",
          "dismissible"
        );
        return;
      }

      // 1. Select account type
      if (!accountType) {
        showNotification("Please select an account type", "warning", "dismissible");
        return;
      }

      await accountTypeMutation.mutateAsync(accountType);

      // 2. Update address information based on account type
      const addressData = addressForm.getValues();
      const result = await addressMutation.mutateAsync({
        accountType,
        addressData,
      });

      if (result.status === 200) {
        // Success notification
        showNotification("Pickup address added successfully!", "information", "dismissible");

        // Close the modal and reload
        onClose();

        // Force refresh the parent component
        queryClient.invalidateQueries({ queryKey: ["sellerDetails"] });
      } else {
        showNotification(
          "Could not complete address update. Please try again.",
          "error",
          "dismissible"
        );
      }
    } catch (error) {
      console.error("Error submitting address:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to add pickup address",
        "error",
        "dismissible"
      );
    }
  };

  const handleStartVerification = () => {
    setCurrentView("verification");
    setCurrentStep(0);
  };

  const openVideoModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoId) {
      setActiveVideo(videoId);
    }
  };

  const closeVideoModal = () => {
    setActiveVideo(null);
  };

  const getCurrentStepData = () => {
    return verificationSteps[currentStep];
  };

  const isLoading =
    profileMutation.isPending || accountTypeMutation.isPending || addressMutation.isPending;

  // Add useEffect to scroll to top when step changes
  useEffect(() => {
    const stepContentContainer = document.querySelector(".step-content-container");
    if (stepContentContainer) {
      stepContentContainer.scrollTop = 0;
    }
  }, [currentStep]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        {/* @ts-ignore - DialogContent accepts children but types are not properly defined */}
        <DialogContent
          className={`${
            currentView === "initial" ? "max-w-xl" : "sm:max-w-3xl"
          } max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl border-0 p-0 flex flex-col`}
        >
          {currentView === "initial" ? (
            <InitialView
              title={displayTitle}
              message={displayMessage}
              isPending={isPending}
              videoId={videoId}
              thumbnailUrl={thumbnailUrl}
              onClose={onClose}
              onStartVerification={handleStartVerification}
              onOpenVideo={openVideoModal}
            />
          ) : (
            <>
              <DialogHeader className="px-6 pt-6 pb-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-b">
                <div className="flex items-center gap-2 mb-1">
                  {getCurrentStepData().id === "account-type" && (
                    <StarIcon color="#14AE5C" width={20} height={20} />
                  )}
                  {getCurrentStepData().id === "address-info" && (
                    <MapPin className="h-5 w-5 text-green-600" />
                  )}
                  {/* @ts-ignore - DialogTitle accepts children but types are not properly defined */}
                  <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    {getCurrentStepData().title}
                  </DialogTitle>
                </div>
                {/* @ts-ignore - DialogDescription accepts children but types are not properly defined */}
                <DialogDescription className="text-gray-600 text-left dark:text-gray-300">
                  {getCurrentStepData().description}
                </DialogDescription>
              </DialogHeader>

              {/* Progress Indicator */}
              <ProgressIndicator currentStep={currentStep} totalSteps={verificationSteps.length} />

              {/* Step Content */}
              <div className="px-6 pb-4 flex-1 overflow-y-auto step-content-container">
                {getCurrentStepData().id === "complete-profile" ? (
                  <Form {...profileForm}>
                    <div>{getCurrentStepData().content}</div>
                  </Form>
                ) : getCurrentStepData().id === "address-info" ? (
                  <Form {...addressForm}>
                    <div>{getCurrentStepData().content}</div>
                  </Form>
                ) : (
                  getCurrentStepData().content
                )}
              </div>

              {/* Navigation Buttons */}
              <DialogFooter className="flex gap-2 justify-between sm:justify-between px-6 py-4 border-t bg-gray-50 dark:bg-gray-900 sticky bottom-0 left-0 right-0 z-10 shadow-md">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={isLoading}
                  className="gap-2 px-4 border-[#27272E] hover:bg-gray-100  dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>

                <Button
                  onClick={nextStep}
                  disabled={!validateCurrentStep() || isLoading}
                  className={`gap-2 px-5 ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : currentStep === verificationSteps.length - 1
                        ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-md shadow-green-100 dark:shadow-none"
                        : "bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 shadow-md shadow-blue-100/50 dark:shadow-none"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : currentStep === verificationSteps.length - 1 ? (
                    <>
                      Submit Address
                      <CheckSquare className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      {activeVideo && <VideoModal videoId={activeVideo} onClose={closeVideoModal} />}
    </>
  );
}

