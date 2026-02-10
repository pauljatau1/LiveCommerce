import axios, { type AxiosResponse } from 'axios';
import { BASE_URL } from '@/Constants/Server';

export interface PublicResource {
  _id: string;
  title: string;
  link: string;
  // Allow additional properties without enforcing a strict shape
  [key: string]: unknown;
}

/**
 * Fetch public Auqli University resources (YouTube videos).
 * Mirrors the behaviour of the v1 AuqliUniversity component.
 */
async function fetchAuqliUniversityResources(): Promise<PublicResource[]> {
  const response: AxiosResponse<PublicResource[]> = await axios.get(
    `${BASE_URL}/public/resources`,
    {
      params: {
        resourceType: 'youtube',
        category: 'auqli_university',
      },
    }
  );

  return response.data;
}

export const resourcesService = {
  fetchAuqliUniversityResources,
};

export default resourcesService;


