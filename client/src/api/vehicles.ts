import api from './client';

export type VehicleStatus = 'DRAFT'|'PENDING'|'APPROVED'|'REJECTED'|'SOLD'|'ARCHIVED';
export interface VehicleListing {
  id:string; ownerCustomerId:string; make:string; model:string; year:number; mileage:number|null; createdAt:string;
  transmission:string|null; fuelType:string|null; vin:string|null; city:string; description:string|null;
  askingPrice:string; currency:string; isPriceNegotiable:boolean;
  mediaPaths:string[]; status:VehicleStatus; moderationNote:string|null; publishedAt:string|null; ownerAuthorizationMethod:'SIGNED_DOCUMENT'|'RECORDED_CALL'|'VERIFIED_MESSAGE'|'IN_PERSON'; ownerAuthorizationNote:string; ownerAuthorizationPath:string|null;
  owner?:{id:string;fullName:string;phone:string|null;email?:string|null;city:string|null;contacts?:Array<{type:string;value:string;label:string|null;isPrimary:boolean}>}|null;
  assignedTo:{id:string;fullName:string}|null;
}
export interface PublicVehicle { id:string; make:string; model:string; year:number; mileage:number|null; transmission:string|null; fuelType:string|null; city:string; description:string|null; askingPrice:string; currency:string; isPriceNegotiable:boolean; mediaPaths:string[]; publishedAt:string|null; }
export interface VehicleOwner {id:string;fullName:string;phone:string|null;city:string|null}
export interface VehicleInput {
  ownerCustomerId?:string; ownerName?:string; ownerPhone?:string; make:string; model:string; year:number; mileage?:number; transmission?:string;
  fuelType?:string; vin?:string; city:string; description?:string; askingPrice:number; currency:string;
  isPriceNegotiable:boolean; mediaPaths:string[];
  ownerAuthorized:true; ownerAuthorizationMethod:'SIGNED_DOCUMENT'|'RECORDED_CALL'|'VERIFIED_MESSAGE'|'IN_PERSON';
  ownerAuthorizationNote:string; ownerAuthorizationPath?:string;
}
export async function fetchVehicles(){const {data}=await api.get<{items:VehicleListing[];total:number}>('/vehicles');return data;}
export async function fetchVehicle(id:string){const {data}=await api.get<VehicleListing>(`/vehicles/${id}`);return data;}
export async function fetchVehicleOwners(q:string){const {data}=await api.get<VehicleOwner[]>('/vehicles/owners',{params:{q}});return data;}
export async function createVehicle(input:VehicleInput){const {data}=await api.post<VehicleListing>('/vehicles',input);return data;}
export async function updateVehicle(id:string,input:Partial<Omit<VehicleInput,'ownerAuthorized'>>){const {data}=await api.patch<VehicleListing>(`/vehicles/${id}`,input);return data;}
export async function submitVehicle(id:string){const {data}=await api.post<VehicleListing>(`/vehicles/${id}/submit`);return data;}
export async function reviewVehicle(id:string,status:'APPROVED'|'REJECTED',note?:string){const {data}=await api.post<VehicleListing>(`/vehicles/${id}/review`,{status,note});return data;}
export async function setVehicleState(id:string,status:'SOLD'|'ARCHIVED'|'APPROVED'){const {data}=await api.post<VehicleListing>(`/vehicles/${id}/state`,{status});return data;}
export async function fetchPublicVehicles(){const {data}=await api.get<{items:PublicVehicle[]}>('/public/vehicles');return data.items;}
export async function submitVehicleInquiry(id:string,input:{fullName:string;phone:string;email?:string;consent:true}){await api.post(`/public/vehicles/${id}/inquiries`,input);}
