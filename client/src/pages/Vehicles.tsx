import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Car, ClipboardList, Send, ShieldCheck } from 'lucide-react';
import { createVehicle, fetchVehicleOwners, fetchVehicles, reviewVehicle, setVehicleState, submitVehicle, updateVehicle, type VehicleInput, type VehicleListing, type VehicleStatus } from '../api/vehicles';
import { useAuth } from '../store/auth';
import { getApiErrorMessage } from '../lib/apiError';

const inputClass='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500';
const labels:Record<VehicleStatus,string>={DRAFT:'مسودة',PENDING:'بانتظار المراجعة',APPROVED:'معتمد',REJECTED:'مرفوض',SOLD:'مباع',ARCHIVED:'مؤرشف'};
const statusClass:Record<VehicleStatus,string>={DRAFT:'bg-gray-100 text-gray-700',PENDING:'bg-amber-100 text-amber-800',APPROVED:'bg-green-100 text-green-700',REJECTED:'bg-red-100 text-red-700',SOLD:'bg-blue-100 text-blue-700',ARCHIVED:'bg-gray-100 text-gray-500'};
export default function Vehicles(){
 const qc=useQueryClient(); const user=useAuth(s=>s.user);
 const [ownerQuery,setOwnerQuery]=useState('');const [ownerId,setOwnerId]=useState('');
 const [error,setError]=useState('');const [success,setSuccess]=useState('');const [editing,setEditing]=useState<VehicleListing|null>(null);
 const [saving,setSaving]=useState(false);
 const owners=useQuery({queryKey:['vehicleOwners',ownerQuery],queryFn:()=>fetchVehicleOwners(ownerQuery),enabled:ownerQuery.trim().length>=2});
 const query=useQuery({queryKey:['vehicles'],queryFn:fetchVehicles});
 const refresh=()=>qc.invalidateQueries({queryKey:['vehicles']});
 const create=useMutation({mutationFn:createVehicle,onSuccess:async()=>{await refresh();setSuccess('حُفظت المركبة كمسودة. أرسلها للمراجعة من قائمة المركبات.');setError('');},onError:e=>setError(getApiErrorMessage(e) || 'تعذر إكمال العملية.')});
 const submit=useMutation({mutationFn:submitVehicle,onSuccess:refresh,onError:e=>setError(getApiErrorMessage(e) || 'تعذر إكمال العملية.')});
 const review=useMutation({mutationFn:({id,status,note}:{id:string;status:'APPROVED'|'REJECTED';note?:string})=>reviewVehicle(id,status,note),onSuccess:refresh,onError:e=>setError(getApiErrorMessage(e) || 'تعذر إكمال العملية.')});
 const state=useMutation({mutationFn:({id,status}:{id:string;status:'SOLD'|'ARCHIVED'})=>setVehicleState(id,status),onSuccess:refresh,onError:e=>setError(getApiErrorMessage(e) || 'تعذر إكمال العملية.')});
 async function onCreate(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError('');setSuccess('');setSaving(true);
  const form=event.currentTarget; const f=new FormData(form);
  if(!ownerId){setError('اختر المالك من سجل العملاء.');setSaving(false);return;}
  if(f.get('authorized')!=='on'){setError('يلزم توثيق موافقة المالك.');setSaving(false);return;}
  const input:VehicleInput={ownerCustomerId:ownerId,make:String(f.get('make')),model:String(f.get('model')),year:Number(f.get('year')),mileage:f.get('mileage')?Number(f.get('mileage')):undefined,transmission:String(f.get('transmission')||''),fuelType:String(f.get('fuelType')||''),vin:String(f.get('vin')||''),city:String(f.get('city')),description:String(f.get('description')||''),askingPrice:Number(f.get('price')),currency:String(f.get('currency')||'SYP'),isPriceNegotiable:f.get('negotiable')==='on',mediaPaths:String(f.get('media')||'').split('\n').map(x=>x.trim()).filter(Boolean),ownerAuthorized:true,ownerAuthorizationMethod:String(f.get('authorizationMethod')) as VehicleInput['ownerAuthorizationMethod'],ownerAuthorizationNote:String(f.get('authorizationNote')),ownerAuthorizationPath:String(f.get('authorizationPath')||'')};
  try{if(editing){const {ownerAuthorized:_ownerAuthorized,...patch}=input;await updateVehicle(editing.id,patch);await refresh();setSuccess('تم تحديث بيانات المسودة.');setEditing(null);}else{await create.mutateAsync(input);}form.reset();setOwnerId('');setOwnerQuery('');}catch{/* shown above */}finally{setSaving(false);}
 }
 const canModerate=user?.role==='ADMIN'||user?.role==='MANAGER';
 return <div className="space-y-6" dir="rtl">
  <div className="flex items-start gap-3"><span className="rounded-xl bg-flame-100 p-3 text-flame-700"><Car size={22}/></span><div><h2 className="text-xl font-bold">بيع وشراء المركبات</h2><p className="mt-1 text-sm text-steel-600">إدارة المركبات المعروضة للبيع واستفسارات الشراء والبيع، مع مراجعة البيانات قبل النشر.</p></div></div>
  {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{success&&<p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>}
  <form key={editing?.id??'new'} onSubmit={onCreate} className="space-y-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-steel-200 sm:p-6">
   <div className="flex items-start gap-3 border-b border-steel-100 pb-4">
    <span className="rounded-lg bg-flame-100 p-2.5 text-flame-700"><ClipboardList size={20}/></span>
    <div><h3 className="font-bold text-gray-900">{editing?'تعديل بيانات المركبة':'إضافة مركبة للبيع'}</h3><p className="mt-1 text-xs leading-6 text-steel-600">أدخل المعلومات الأساسية أولاً. الحقول المعلّمة بـ * مطلوبة؛ ويمكن إضافة باقي التفاصيل لاحقاً.</p></div>
   </div>

   <section className="space-y-3" aria-labelledby="vehicle-owner-heading">
    <h4 id="vehicle-owner-heading" className="text-sm font-bold text-gray-800">1. بيانات المالك</h4>
    <div className="grid gap-3 md:grid-cols-2">
     <label className="text-sm">ابحث عن المالك بالاسم أو الهاتف *<input className={inputClass} value={ownerQuery} onChange={e=>{setOwnerQuery(e.target.value);setOwnerId('')}} placeholder="اكتب حرفين على الأقل" autoComplete="off"/><span className="mt-1 block text-[11px] text-steel-500">يجب اختيار المالك من سجل العملاء.</span></label>
     <label className="text-sm">المالك *<select required className={inputClass} value={ownerId} onChange={e=>setOwnerId(e.target.value)}><option value="">{ownerQuery.trim().length<2?'ابدأ بالبحث عن المالك':'اختر من النتائج'}</option>{(owners.data??[]).map(o=><option key={o.id} value={o.id}>{o.fullName} — {o.phone||'بدون هاتف'}</option>)}</select>{ownerQuery.trim().length>=2&&!owners.isLoading&&!owners.data?.length&&<span className="mt-1 block text-xs text-amber-700">لا توجد نتيجة. تأكد من الاسم أو الرقم.</span>}</label>
    </div>
   </section>

   <section className="space-y-3" aria-labelledby="vehicle-basics-heading">
    <h4 id="vehicle-basics-heading" className="text-sm font-bold text-gray-800">2. بيانات المركبة والسعر</h4>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
     <label className="text-sm">الشركة المصنعة *<input name="make" required maxLength={80} defaultValue={editing?.make??''} className={inputClass} placeholder="مثال: Toyota"/></label>
     <label className="text-sm">الطراز *<input name="model" required maxLength={80} defaultValue={editing?.model??''} className={inputClass} placeholder="مثال: Corolla"/></label>
     <label className="text-sm">سنة الصنع *<input name="year" type="number" required min="1950" max={new Date().getFullYear()+1} defaultValue={editing?.year??''} className={inputClass} placeholder="2022"/></label>
     <label className="text-sm">المدينة *<input name="city" required defaultValue={editing?.city??''} className={inputClass} placeholder="دمشق"/></label>
     <label className="text-sm">السعر المطلوب *<input name="price" type="number" min="0.01" step="0.01" required defaultValue={editing?Number(editing.askingPrice):''} className={inputClass} placeholder="أدخل السعر"/></label>
     <label className="flex items-center gap-2 self-end rounded-lg border border-steel-200 px-3 py-3 text-sm"><input name="negotiable" type="checkbox" defaultChecked={editing?.isPriceNegotiable??false}/> السعر قابل للتفاوض</label>
    </div>
   </section>

   <section className="space-y-3" aria-labelledby="vehicle-authorization-heading">
    <h4 id="vehicle-authorization-heading" className="text-sm font-bold text-gray-800">3. توثيق موافقة المالك</h4>
    <div className="grid gap-3 md:grid-cols-2">
     <label className="text-sm">طريقة التوثيق *<select name="authorizationMethod" defaultValue={editing?.ownerAuthorizationMethod??'SIGNED_DOCUMENT'} className={inputClass}><option value="SIGNED_DOCUMENT">مستند موقع</option><option value="RECORDED_CALL">اتصال موثق</option><option value="VERIFIED_MESSAGE">رسالة موثقة</option><option value="IN_PERSON">حضور شخصي</option></select></label>
     <label className="text-sm">تفاصيل الموافقة *<textarea name="authorizationNote" required minLength={8} defaultValue={editing?.ownerAuthorizationNote??''} className={inputClass} rows={2} placeholder="اذكر متى وكيف وافق المالك على عرض المركبة."/></label>
    </div>
    <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-900"><input name="authorized" type="checkbox" required defaultChecked={!!editing} className="mt-1"/> أؤكد أن موافقة المالك موثقة وأنه أذن بعرض بيانات المركبة وصورها.</label>
   </section>

   <details className="rounded-lg border border-steel-200 bg-steel-50/50 p-4" open={Boolean(editing&&(editing.mileage||editing.transmission||editing.fuelType||editing.vin||editing.description||editing.mediaPaths.length||editing.ownerAuthorizationPath))}>
    <summary className="cursor-pointer text-sm font-semibold text-ink-900">تفاصيل إضافية (اختيارية)</summary>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
     <label className="text-sm">المسافة المقطوعة<input name="mileage" type="number" min="0" defaultValue={editing?.mileage??''} className={inputClass}/></label>
     <label className="text-sm">ناقل الحركة<input name="transmission" defaultValue={editing?.transmission??''} className={inputClass}/></label>
     <label className="text-sm">نوع الوقود<input name="fuelType" defaultValue={editing?.fuelType??''} className={inputClass}/></label>
     <label className="text-sm">رقم الهيكل<input name="vin" defaultValue={editing?.vin??''} className={inputClass}/></label>
     <label className="text-sm">العملة<input name="currency" defaultValue={editing?.currency??'SYP'} maxLength={3} className={inputClass}/></label>
     <label className="text-sm">مرجع مستند التفويض<input name="authorizationPath" placeholder="uploads/vehicles/authorization.pdf" defaultValue={editing?.ownerAuthorizationPath??''} className={inputClass}/></label>
     <label className="text-sm sm:col-span-2 lg:col-span-3">وصف المركبة<textarea name="description" maxLength={3000} rows={3} defaultValue={editing?.description??''} className={inputClass} placeholder="الحالة أو المواصفات الإضافية"/></label>
     <label className="text-sm sm:col-span-2 lg:col-span-3">مسارات الصور المحلية، مسار واحد في كل سطر<textarea name="media" rows={2} defaultValue={editing?.mediaPaths.join('\n')??''} className={inputClass} placeholder="uploads/vehicles/photo.jpg"/></label>
    </div>
   </details>

   <div className="flex flex-wrap items-center gap-3 border-t border-steel-100 pt-4">
    <button disabled={saving} className="btn-flame"><ShieldCheck size={16}/>{saving?'جارٍ الحفظ…':editing?'حفظ التعديلات':'حفظ المركبة كمسودة'}</button>
    {editing&&<button type="button" onClick={()=>{setEditing(null);setOwnerId('');setOwnerQuery('');}} className="rounded-lg border px-4 py-2 text-sm">إلغاء</button>}
    <span className="text-xs text-steel-500">بعد الحفظ، أرسل الإعلان للمراجعة من قائمة المركبات.</span>
   </div>
  </form>
  <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-steel-200"><div className="border-b p-4 font-bold">المركبات المسجلة ({query.data?.total??0})</div>{query.isLoading?<p className="p-5">جارٍ التحميل…</p>:!query.data?.items.length?<p className="p-5 text-sm text-steel-500">لا توجد مركبات مسجلة بعد. ابدأ بإضافة أول مركبة من النموذج أعلاه.</p>:<div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead className="bg-steel-50 text-xs"><tr><th className="p-3">المركبة</th><th className="p-3">المالك</th><th className="p-3">الحالة</th><th className="p-3">الإجراءات</th></tr></thead><tbody>{query.data.items.map(v=><tr key={v.id} className="border-t"><td className="p-3 font-semibold">{v.make} {v.model} {v.year}<small className="block text-steel-500">{Number(v.askingPrice).toLocaleString()} {v.currency}</small></td><td className="p-3">{v.owner.fullName}<small className="block text-steel-500">{v.owner.phone}</small></td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${statusClass[v.status]}`}>{labels[v.status]}</span>{v.moderationNote&&<small className="block text-red-700">{v.moderationNote}</small>}</td><td className="p-3"><div className="flex flex-wrap gap-2">{['DRAFT','REJECTED'].includes(v.status)&&<><button className="rounded border px-2 py-1 text-xs" onClick={()=>{setEditing(v);setOwnerId(v.ownerCustomerId);setOwnerQuery(v.owner.fullName);window.scrollTo({top:0,behavior:'smooth'});}}>تعديل</button><button className="inline-flex items-center gap-1 rounded bg-ink-900 px-2.5 py-1.5 text-xs text-white" onClick={()=>submit.mutate(v.id)}><Send size={13}/>إرسال للمراجعة</button></>}{canModerate&&v.status==='PENDING'&&<><button aria-label="اعتماد الإعلان" className="rounded bg-green-700 px-2 py-1 text-xs text-white" onClick={()=>review.mutate({id:v.id,status:'APPROVED'})}><BadgeCheck size={14}/></button><button className="rounded bg-red-700 px-2 py-1 text-xs text-white" onClick={()=>review.mutate({id:v.id,status:'REJECTED',note:window.prompt('سبب الرفض')||''})}>رفض</button></>}{canModerate&&v.status==='APPROVED'&&<><button className="rounded bg-blue-700 px-2 py-1 text-xs text-white" onClick={()=>state.mutate({id:v.id,status:'SOLD'})}>مباع</button><button className="rounded bg-gray-600 px-2 py-1 text-xs text-white" onClick={()=>state.mutate({id:v.id,status:'ARCHIVED'})}>أرشفة</button></>}</div></td></tr>)}</tbody></table></div>}</section>
 </div>;
}


