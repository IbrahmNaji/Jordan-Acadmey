import api from './client';

export type SparePartListingStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export interface SparePartListing {
  id: string;
  partName: string;
  partNumber: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  description: string | null;
  price: string | null;
  currency: string;
  mediaPaths: string[];
  status: SparePartListingStatus;
  publishedAt: string | null;
  createdAt: string;
}

export async function fetchSparePartListings() {
  return (await api.get<{ items: SparePartListing[] }>('/parts/listings')).data.items;
}

export async function createSparePartListing(input: {
  partName: string;
  partNumber?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  description?: string;
  price?: number;
  currency: string;
  mediaPaths: string[];
}) {
  return (await api.post<SparePartListing>('/parts/listings', input)).data;
}

export async function setSparePartListingStatus(id: string, status: SparePartListingStatus) {
  return (await api.patch<SparePartListing>(`/parts/listings/${id}/status`, { status })).data;
}

