import { useEffect, useState } from 'react';

import {
  useGetServicesQuery,
  useLazyGetServiceProvidersQuery,
} from '@/services/services';
import type { ServiceProvider } from '@/types/services/services';

type UseGetServiceProvidersProps = {
  identifier: 'UTILITY' | 'CABLETV' | 'AIRTIME' | 'DATA';
};

const useGetServiceProviders = ({
  identifier,
}: UseGetServiceProvidersProps) => {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);

  const {
    data: servicesData,
    isLoading: isLoadingServices,
    isSuccess: isSuccessServices,
  } = useGetServicesQuery();

  const [GetServiceProviders, { isLoading }] =
    useLazyGetServiceProvidersQuery();

  useEffect(() => {
    if (isSuccessServices && servicesData) {
      const serviceData = servicesData?.data.find(
        (data) => data.identifier === identifier
      );

      if (serviceData) {
        GetServiceProviders({ billServiceId: serviceData._id })
          .unwrap()
          .then((response) => {
            setProviders(response.data);
          });
      }
    }
  }, [GetServiceProviders, identifier, isSuccessServices, servicesData]);

  return { providers, isLoading: isLoadingServices || isLoading };
};

export default useGetServiceProviders;
