import { api } from './client';

export type DealStatus = 'NEW_INQUIRY'|'CONTACTED'|'QUALIFIED'|'VIEWING_SCHEDULED'|'NEGOTIATION'|'AGREEMENT_PENDING'|'COMPLETED'|'LOST'|'CANCELLED';
export interface BrokerageDeal {
  id: string; status: DealStatus; expectedAmount?: string|null; finalAmount?: string|null; currency: string;
  listing: { id:string; make:string; model:string; year:number; ownerCustomerId:string; assignedToId:string|null };
  buyer: { id:string; fullName:string; phone:string|null }; seller:{id:string;fullName:string;phone:string|null};
  commissions?: Array<{id:string;payer:'BUYER'|'SELLER'|'OTHER';otherPayerName?:string|null;amountDue:string;currency:string;calculationType:'FIXED'|'PERCENTAGE';rateOrAmount:string;basisAmount:string;agreementReference:string;payments:Array<{id:string;amount:string;paidAt:string;reference?:string|null}>}>;
  history:Array<{id:string;from:DealStatus|null;to:DealStatus;reason?:string|null;createdAt:string}>;
  viewings:Array<{id:string;scheduledAt:string;status:string;location?:string|null}>;
}
export interface DealOptions { listings:Array<{id:string;make:string;model:string;year:number;ownerCustomerId:string;owner:{fullName:string}}>; customers:Array<{id:string;fullName:string;phone?:string|null}> }
export async function fetchBrokerageDeals(){return (await api.get<{items:BrokerageDeal[];total:number}>('/brokerage/deals')).data;}
export async function fetchDealOptions(search=''){return (await api.get<DealOptions>('/brokerage/deal-options',{params:{search}})).data;}
export async function createBrokerageDeal(input:{listingId:string;buyerCustomerId:string;expectedAmount?:number;currency:string}){return (await api.post('/brokerage/deals',input)).data;}
export async function updateBrokerageDeal(id:string,input:{status:DealStatus;reason?:string;finalAmount?:number}){return (await api.patch(`/brokerage/deals/${id}/status`,input)).data;}
export async function addCommission(id:string,input:Record<string,string|number>){return (await api.post(`/brokerage/deals/${id}/commissions`,input)).data;}
export async function addCommissionPayment(id:string,input:{amount:number;reference?:string}){return (await api.post(`/brokerage/commissions/${id}/payments`,input)).data;}
