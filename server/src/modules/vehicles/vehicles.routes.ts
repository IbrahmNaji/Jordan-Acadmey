import { Router } from 'express';
import { z } from 'zod';
import { VehicleListingStatus } from '@prisma/client';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { recordAudit, requestIp } from '../../utils/audit';
import { VehiclesService } from './vehicles.service';
const router=Router();const service=new VehiclesService();router.use(authenticate);
const uuid=z.string().uuid();const media=z.array(z.string().trim().min(1).max(260)).max(12).default([]);
const shape={
 ownerCustomerId:uuid,make:z.string().trim().min(1).max(80),model:z.string().trim().min(1).max(80),
 year:z.coerce.number().int().min(1950).max(new Date().getFullYear()+1),mileage:z.coerce.number().int().min(0).max(2000000).optional(),
 transmission:z.string().trim().max(40).optional(),fuelType:z.string().trim().max(40).optional(),vin:z.string().trim().max(40).optional(),
 city:z.string().trim().min(1).max(80),description:z.string().trim().max(3000).optional(),
 askingPrice:z.coerce.number().positive().max(1000000000),currency:z.string().trim().length(3).optional(),
 isPriceNegotiable:z.boolean().optional(),
 mediaPaths:media,ownerAuthorized:z.literal(true),ownerAuthorizationMethod:z.enum(['SIGNED_DOCUMENT','RECORDED_CALL','VERIFIED_MESSAGE','IN_PERSON']),
 ownerAuthorizationNote:z.string().trim().min(8).max(1000),ownerAuthorizationPath:z.string().trim().max(260).optional(),
};
const create=z.object(shape).strict();const update=z.object(shape).partial().omit({ownerAuthorized:true}).strict();
router.get('/owners',requirePermission('vehicles:write'),asyncHandler(async(req,res)=>{const q=z.object({q:z.string().trim().max(100).default('')}).parse(req.query);res.json(await service.owners(req.user!,q.q))}));
router.get('/',requirePermission('vehicles:read'),asyncHandler(async(req,res)=>{const q=z.object({status:z.nativeEnum(VehicleListingStatus).optional(),search:z.string().trim().max(100).optional(),page:z.coerce.number().int().min(1).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25)}).parse(req.query);res.json(await service.list(req.user!,q))}));
router.get('/:id',requirePermission('vehicles:read'),asyncHandler(async(req,res)=>res.json(await service.detail(uuid.parse(req.params.id),req.user!))));
router.post('/',requirePermission('vehicles:write'),validate({body:create}),asyncHandler(async(req,res)=>{const item=await service.create(req.body,req.user!);await recordAudit({actor:req.user,action:'vehicle.create',entityType:'VehicleListing',entityId:item.id,summary:'إنشاء مسودة إعلان مركبة',ip:requestIp(req)});res.status(201).json(item)}));
router.patch('/:id',requirePermission('vehicles:write'),validate({body:update}),asyncHandler(async(req,res)=>{const item=await service.update(uuid.parse(req.params.id),req.body,req.user!);await recordAudit({actor:req.user,action:'vehicle.update',entityType:'VehicleListing',entityId:item.id,summary:'تحديث بيانات إعلان مركبة',metadata:{fields:Object.keys(req.body)},ip:requestIp(req)});res.json(item)}));
router.post('/:id/submit',requirePermission('vehicles:write'),asyncHandler(async(req,res)=>{const item=await service.submit(uuid.parse(req.params.id),req.user!);await recordAudit({actor:req.user,action:'vehicle.submit',entityType:'VehicleListing',entityId:item.id,summary:'إرسال إعلان المركبة للمراجعة',ip:requestIp(req)});res.json(item)}));
router.post('/:id/review',requirePermission('vehicles:moderate'),validate({body:z.object({status:z.enum(['APPROVED','REJECTED']),note:z.string().trim().max(1000).optional()}).strict()}),asyncHandler(async(req,res)=>{const item=await service.review(uuid.parse(req.params.id),req.body.status,req.body.note,req.user!);await recordAudit({actor:req.user,action:'vehicle.review',entityType:'VehicleListing',entityId:item.id,summary:`مراجعة إعلان المركبة: ${item.status}`,metadata:{status:item.status,note:req.body.note??null},ip:requestIp(req)});res.json(item)}));
router.post('/:id/state',requirePermission('vehicles:moderate'),validate({body:z.object({status:z.enum(['SOLD','ARCHIVED'])}).strict()}),asyncHandler(async(req,res)=>{const item=await service.close(uuid.parse(req.params.id),req.body.status);await recordAudit({actor:req.user,action:'vehicle.state_change',entityType:'VehicleListing',entityId:item.id,summary:`تغيير حالة الإعلان إلى ${item.status}`,metadata:{status:item.status},ip:requestIp(req)});res.json(item)}));
export default router;
