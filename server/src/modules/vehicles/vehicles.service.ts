import { Prisma, VehicleListingStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { AuthUser } from '../../middleware/auth';
import { hasPermission } from '../../config/permissions';
import { notifyRoles } from '../../utils/notifications';
import { createCustomerForPerson } from '../../utils/customer';
import { INQUIRY_CONSENT_PURPOSE, CONSENT_VERSION } from '../../config/consent';

const include = {
  assignedTo: { select: { id: true, fullName: true } },
  reviewedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.VehicleListingInclude;
const mediaPath = (v: string) => (/^\/?uploads\/vehicles\/[A-Za-z0-9._/-]{1,240}$/.test(v) && !v.includes('..')) || /^\/media\/[0-9a-f-]{36}$/i.test(v);
const scope = (u: AuthUser): Prisma.VehicleListingWhereInput => u.role === 'AGENT' ? { assignedToId: u.id } : {};

export interface VehicleInput {
  ownerCustomerId?: string; ownerName?: string; ownerPhone?: string; make: string; model: string; year: number;
  mileage?: number; transmission?: string; fuelType?: string; vin?: string;
  city: string; description?: string; askingPrice: number; currency?: string;
  isPriceNegotiable?: boolean;
  mediaPaths: string[]; ownerAuthorizationMethod: 'SIGNED_DOCUMENT'|'RECORDED_CALL'|'VERIFIED_MESSAGE'|'IN_PERSON';
  ownerAuthorizationNote: string; ownerAuthorizationPath?: string;
}
export class VehiclesService {
  async list(user: AuthUser, q: { status?: VehicleListingStatus; search?: string; page: number; pageSize: number }) {
    const where: Prisma.VehicleListingWhereInput = { ...scope(user), ...(q.status && { status: q.status }), ...(q.search && { OR: [
      { make: { contains: q.search, mode: 'insensitive' } }, { model: { contains: q.search, mode: 'insensitive' } },
      { owner: { fullName: { contains: q.search, mode: 'insensitive' } } },
    ] }) };
    const [items,total] = await Promise.all([
      prisma.vehicleListing.findMany({ where, include, orderBy: { updatedAt: 'desc' }, skip: (q.page-1)*q.pageSize, take: q.pageSize }),
      prisma.vehicleListing.count({ where }),
    ]);
    return { items,total,page:q.page,pageSize:q.pageSize };
  }
  async detail(id: string, user: AuthUser) {
    const item = await prisma.vehicleListing.findFirst({ where: { id, ...scope(user) }, include });
    if (!item) throw new AppError(404,'VEHICLE_NOT_FOUND');
    if (hasPermission(user.role, 'vehicles:contacts')) {
      const owner = await prisma.customer.findUnique({ where: { id: item.ownerCustomerId }, select: { id: true, fullName: true, phone: true, email: true, city: true, contacts: { select: { type: true, value: true, label: true, isPrimary: true } } } });
      return { ...item, owner };
    }
    return item;
  }
  async owners(user: AuthUser, q: string) {
    return prisma.customer.findMany({ where: {
      archivedAt:null, ...(q && { OR:[{fullName:{contains:q,mode:'insensitive'}},{phone:{contains:q}}] }),
      ...(user.role==='AGENT' && {leads:{some:{assignedToId:user.id}}}),
    }, select:{id:true,fullName:true,phone:true,city:true},orderBy:{fullName:'asc'},take:20 });
  }
  async create(input: VehicleInput, user: AuthUser) {
    let ownerId=input.ownerCustomerId;
    if(ownerId){
      const owner=await prisma.customer.findFirst({where:{id:ownerId,archivedAt:null,...(user.role==='AGENT'&&{leads:{some:{assignedToId:user.id}}})},select:{id:true}});
      if(!owner) throw new AppError(400,'INVALID_OR_OUT_OF_SCOPE_OWNER');
    }else if(!input.ownerName?.trim()) throw new AppError(400,'VEHICLE_OWNER_REQUIRED');
    if(!input.mediaPaths.every(mediaPath)|| (input.ownerAuthorizationPath&&!mediaPath(input.ownerAuthorizationPath))) throw new AppError(400,'INVALID_MEDIA_PATH');
    return prisma.$transaction(async(tx)=>{
      if(!ownerId){
        const owner=await createCustomerForPerson({fullName:input.ownerName!,phone:input.ownerPhone},tx);
        ownerId=owner.id;
      }
      return tx.vehicleListing.create({data:{
        ownerCustomerId:ownerId!,assignedToId:user.role==='AGENT'?user.id:null,
        make:input.make.trim(),model:input.model.trim(),year:input.year,mileage:input.mileage??null,
        transmission:input.transmission?.trim()||null,fuelType:input.fuelType?.trim()||null,vin:input.vin?.trim().toUpperCase()||null,
        city:input.city.trim(),description:input.description?.trim()||null,askingPrice:input.askingPrice,currency:input.currency||'SYP',
        isPriceNegotiable:input.isPriceNegotiable??false,conditionVerifiedAt:null,inspectionReference:null,mediaPaths:input.mediaPaths,
        ownerAuthorizationMethod:input.ownerAuthorizationMethod,ownerAuthorizationNote:input.ownerAuthorizationNote.trim(),
        ownerAuthorizationPath:input.ownerAuthorizationPath||null,ownerAuthorizedAt:new Date(),status:'APPROVED',publishedAt:new Date(),
      },include});
    });
  }
  async update(id:string,input:Partial<VehicleInput>,user:AuthUser) {
    const v=await this.detail(id,user);
    if(input.mediaPaths&&!input.mediaPaths.every(mediaPath)) throw new AppError(400,'INVALID_MEDIA_PATH');
    if(input.ownerCustomerId && input.ownerCustomerId!==v.ownerCustomerId){const owner=await prisma.customer.findFirst({where:{id:input.ownerCustomerId,archivedAt:null,...(user.role==='AGENT'&&{leads:{some:{assignedToId:user.id}}})},select:{id:true}});if(!owner)throw new AppError(400,'INVALID_OR_OUT_OF_SCOPE_OWNER');}
    if(input.ownerAuthorizationPath && !mediaPath(input.ownerAuthorizationPath))throw new AppError(400,'INVALID_MEDIA_PATH');
    const data:Prisma.VehicleListingUpdateInput={
      ...(input.ownerCustomerId&&{owner:{connect:{id:input.ownerCustomerId}}}),
      ...(input.make!==undefined&&{make:input.make.trim()}),...(input.model!==undefined&&{model:input.model.trim()}),
      ...(input.year!==undefined&&{year:input.year}),...(input.mileage!==undefined&&{mileage:input.mileage}),
      ...(input.transmission!==undefined&&{transmission:input.transmission||null}),...(input.fuelType!==undefined&&{fuelType:input.fuelType||null}),
      ...(input.vin!==undefined&&{vin:input.vin.toUpperCase()||null}),...(input.city!==undefined&&{city:input.city.trim()}),
      ...(input.description!==undefined&&{description:input.description||null}),...(input.askingPrice!==undefined&&{askingPrice:input.askingPrice}),
      ...(input.currency!==undefined&&{currency:input.currency}),...(input.isPriceNegotiable!==undefined&&{isPriceNegotiable:input.isPriceNegotiable}),
      ...(input.mediaPaths&&{mediaPaths:input.mediaPaths}),
      ...(input.ownerAuthorizationMethod&&{ownerAuthorizationMethod:input.ownerAuthorizationMethod}),
      ...(input.ownerAuthorizationNote&&{ownerAuthorizationNote:input.ownerAuthorizationNote.trim(),ownerAuthorizedAt:new Date()}),
      ...(input.ownerAuthorizationPath!==undefined&&{ownerAuthorizationPath:input.ownerAuthorizationPath||null}),
    };
    return prisma.$transaction(async(tx)=>{
      if(input.ownerName!==undefined||input.ownerPhone!==undefined){
        await tx.customer.update({where:{id:v.ownerCustomerId},data:{
          ...(input.ownerName!==undefined&&{fullName:input.ownerName.trim()}),
          ...(input.ownerPhone!==undefined&&{phone:input.ownerPhone.trim()||null}),
        }});
      }
      return tx.vehicleListing.update({where:{id},data,include});
    });
  }
  async submit(id:string,user:AuthUser) {
    const v=await this.detail(id,user);
    if(!['DRAFT','REJECTED'].includes(v.status)) throw new AppError(409,'INVALID_VEHICLE_TRANSITION');
    const item=await prisma.vehicleListing.update({where:{id},data:{status:'PENDING',moderationNote:null},include});
    await notifyRoles(['ADMIN','MANAGER'],{type:'VEHICLE_REVIEW',title:'إعلان مركبة بانتظار المراجعة',body:`${item.make} ${item.model} ${item.year}`,link:'/admin/vehicles',entityType:'VehicleListing',entityId:id,dedupeKey:`vehicle-review-${id}-${item.updatedAt.getTime()}`});
    return item;
  }
  async review(id:string,status:'APPROVED'|'REJECTED',note:string|undefined,user:AuthUser) {
    const v=await prisma.vehicleListing.findUnique({where:{id}});
    if(!v) throw new AppError(404,'VEHICLE_NOT_FOUND');
    if(v.status!=='PENDING') throw new AppError(409,'INVALID_VEHICLE_TRANSITION');
    if(status==='REJECTED'&&!note?.trim()) throw new AppError(400,'REJECTION_NOTE_REQUIRED');
    return prisma.vehicleListing.update({where:{id},data:{status,moderationNote:note?.trim()||null,reviewedById:user.id,reviewedAt:new Date(),publishedAt:status==='APPROVED'?new Date():null},include});
  }
  async close(id:string,status:'SOLD'|'ARCHIVED'|'APPROVED') {
    const v=await prisma.vehicleListing.findUnique({where:{id}});
    if(!v) throw new AppError(404,'VEHICLE_NOT_FOUND');
    if(status==='APPROVED' ? v.status!=='SOLD' : v.status!=='APPROVED') throw new AppError(409,'INVALID_VEHICLE_TRANSITION');
    return prisma.vehicleListing.update({where:{id},data:{status,soldAt:status==='SOLD'?new Date():null,...(status==='APPROVED'&&{publishedAt:new Date()})},include});
  }
  async publicList() {
    return prisma.vehicleListing.findMany({where:{status:'APPROVED',publishedAt:{not:null}},select:{id:true,make:true,model:true,year:true,mileage:true,transmission:true,fuelType:true,city:true,description:true,askingPrice:true,currency:true,isPriceNegotiable:true,mediaPaths:true,publishedAt:true},orderBy:{publishedAt:'desc'}});
  }
  async publicDetail(id:string) { return prisma.vehicleListing.findFirst({where:{id,status:'APPROVED',publishedAt:{not:null}},select:{id:true,make:true,model:true,year:true,mileage:true,transmission:true,fuelType:true,city:true,description:true,askingPrice:true,currency:true,isPriceNegotiable:true,mediaPaths:true,publishedAt:true}}); }
  async inquiry(id:string,input:{fullName:string;phone:string;email?:string},ip?:string|null) {
    const listing=await prisma.vehicleListing.findFirst({where:{id,status:'APPROVED',publishedAt:{not:null}},select:{id:true,make:true,model:true,year:true}});
    if(!listing) throw new AppError(404,'VEHICLE_NOT_FOUND');
    const source=await prisma.campaignSource.upsert({where:{name:'استفسار سوق المركبات'},update:{isActive:true},create:{name:'استفسار سوق المركبات',channel:'OTHER',description:'استفسارات إعلانات المركبات العامة'},select:{id:true}});
    const lead=await prisma.$transaction(async tx=>{
      const customer=await createCustomerForPerson({fullName:input.fullName,phone:input.phone,email:input.email,city:null},tx);
      const created=await tx.lead.create({data:{fullName:input.fullName.trim(),phone:input.phone.trim(),email:input.email?.trim().toLowerCase()||null,customerId:customer.id,sourceId:source.id,status:'NEW',notes:`استفسار عن المركبة: ${listing.make} ${listing.model} ${listing.year}`}});
      await tx.vehicleInquiry.create({data:{listingId:id,leadId:created.id}});
      await tx.activity.create({data:{leadId:created.id,userId:null,type:'VEHICLE_INQUIRY',content:`استفسار عام عن المركبة ${listing.make} ${listing.model} ${listing.year}`,metadata:{listingId:id}}});
      await tx.consentRecord.create({data:{customerId:customer.id,leadId:created.id,purpose:INQUIRY_CONSENT_PURPOSE,version:CONSENT_VERSION,source:'public_vehicle_inquiry',ipAddress:ip??null}});
      return created;
    });
    await notifyRoles(['ADMIN','MANAGER'],{type:'VEHICLE_INQUIRY',title:'استفسار جديد عن مركبة',body:`${input.fullName} — ${listing.make} ${listing.model}`,link:`/admin/leads/${lead.id}`,entityType:'Lead',entityId:lead.id,dedupeKey:`vehicle-inquiry-${lead.id}`});
    return {ok:true};
  }
}
