import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Car, ClipboardList, Eye, ImagePlus, Send, ShieldCheck, Trash2, X } from 'lucide-react';
import { createVehicle, fetchVehicle, fetchVehicles, reviewVehicle, setVehicleState, submitVehicle, updateVehicle, type VehicleInput, type VehicleListing, type VehicleStatus } from '../api/vehicles';
import { resolveMediaUrl, uploadImage } from '../api/media';
import { useAuth } from '../store/auth';
import { getApiErrorMessage } from '../lib/apiError';

const inputClass='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500';
const vehicleMakes=[['Toyota','تويوتا (Toyota)'],['Hyundai','هيونداي (Hyundai)'],['Kia','كيا (Kia)'],['Nissan','نيسان (Nissan)'],['Mercedes-Benz','مرسيدس (Mercedes-Benz)'],['BMW','بي إم دبليو (BMW)'],['Honda','هوندا (Honda)'],['Mitsubishi','ميتسوبيشي (Mitsubishi)'],['Suzuki','سوزوكي (Suzuki)'],['Chevrolet','شفروليه (Chevrolet)'],['Ford','فورد (Ford)'],['Volkswagen','فولكسفاغن (Volkswagen)'],['Lexus','لكزس (Lexus)'],['Jeep','جيب (Jeep)'],['Renault','رينو (Renault)'],['Peugeot','بيجو (Peugeot)'],['Chery','شيري (Chery)'],['Geely','جيلي (Geely)'],['MG','إم جي (MG)'],['BYD','بي واي دي (BYD)']] as const;
const latestVehicleYear=new Date().getFullYear()+1;
const yearOptions=Array.from({length:latestVehicleYear-1979},(_,index)=>latestVehicleYear-index);
const labels:Record<VehicleStatus,string>={DRAFT:'مسودة',PENDING:'بانتظار المراجعة',APPROVED:'معتمد',REJECTED:'مرفوض',SOLD:'مباع',ARCHIVED:'مؤرشف'};
const statusClass:Record<VehicleStatus,string>={DRAFT:'bg-gray-100 text-gray-700',PENDING:'bg-amber-100 text-amber-800',APPROVED:'bg-green-100 text-green-700',REJECTED:'bg-red-100 text-red-700',SOLD:'bg-blue-100 text-blue-700',ARCHIVED:'bg-gray-100 text-gray-500'};
export default function Vehicles(){
 const qc=useQueryClient(); const user=useAuth(s=>s.user);
 const [error,setError]=useState('');const [success,setSuccess]=useState('');const [editing,setEditing]=useState<VehicleListing|null>(null);
 const [detailId,setDetailId]=useState('');
 const [mediaPaths,setMediaPaths]=useState<string[]>([]);const [imageFiles,setImageFiles]=useState<File[]>([]);
 const [makeSelection,setMakeSelection]=useState('');
 const [saving,setSaving]=useState(false);
 const imagePreviews=useMemo(()=>imageFiles.map(file=>URL.createObjectURL(file)),[imageFiles]);
 useEffect(()=>()=>imagePreviews.forEach(url=>URL.revokeObjectURL(url)),[imagePreviews]);
 const query=useQuery({queryKey:['vehicles'],queryFn:fetchVehicles});
 const detail=useQuery({queryKey:['vehicle',detailId],queryFn:()=>fetchVehicle(detailId),enabled:!!detailId});
 const refresh=()=>qc.invalidateQueries({queryKey:['vehicles']});
 const create=useMutation({mutationFn:createVehicle,onSuccess:async()=>{await refresh();setSuccess('تمت إضافة المركبة ونشرها مباشرة في الموقع.');setError('');},onError:e=>setError(getApiErrorMessage(e) || 'تعذر إكمال العملية.')});
 const submit=useMutation({mutationFn:submitVehicle,onSuccess:refresh,onError:e=>setError(getApiErrorMessage(e) || 'تعذر إكمال العملية.')});
 const review=useMutation({mutationFn:({id,status,note}:{id:string;status:'APPROVED'|'REJECTED';note?:string})=>reviewVehicle(id,status,note),onSuccess:refresh,onError:e=>setError(getApiErrorMessage(e) || 'تعذر إكمال العملية.')});
 const state=useMutation({mutationFn:({id,status}:{id:string;status:'SOLD'|'ARCHIVED'})=>setVehicleState(id,status),onSuccess:refresh,onError:e=>setError(getApiErrorMessage(e) || 'تعذر إكمال العملية.')});
 async function startEditing(vehicle:VehicleListing){try{const item=await fetchVehicle(vehicle.id);setEditing(item);setMakeSelection(vehicleMakes.some(([value])=>value===item.make)?item.make:'OTHER');setMediaPaths(item.mediaPaths);setImageFiles([]);window.scrollTo({top:0,behavior:'smooth'});}catch(e){setError(getApiErrorMessage(e)||'تعذر تحميل بيانات المركبة للتعديل.');}}
 async function onCreate(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError('');setSuccess('');setSaving(true);
  const form=event.currentTarget; const f=new FormData(form);
  if(f.get('authorized')!=='on'){setError('يلزم توثيق موافقة المالك.');setSaving(false);return;}
  if(!editing&&!String(f.get('ownerName')||'').trim()){setError('أدخل اسم صاحب المركبة.');setSaving(false);return;}
  const selectedMake=String(f.get('make')||'');const make=selectedMake==='OTHER'?String(f.get('customMake')||'').trim():selectedMake;
  if(!make){setError('اختر الشركة المصنعة أو أدخل اسمها.');setSaving(false);return;}
  const authorizationMethod=String(f.get('authorizationMethod')) as VehicleInput['ownerAuthorizationMethod'];
  const methodLabel:Record<VehicleInput['ownerAuthorizationMethod'],string>={SIGNED_DOCUMENT:'مستند موقع',RECORDED_CALL:'اتصال موثق',VERIFIED_MESSAGE:'رسالة موثقة',IN_PERSON:'حضور شخصي'};
  const input:VehicleInput={...(editing?{ownerCustomerId:editing.ownerCustomerId}:{ownerName:String(f.get('ownerName')||'').trim(),ownerPhone:String(f.get('ownerPhone')||'').trim()||undefined}),make,model:String(f.get('model')),year:Number(f.get('year')),mileage:f.get('mileage')?Number(f.get('mileage')):undefined,transmission:String(f.get('transmission')||''),fuelType:String(f.get('fuelType')||''),vin:String(f.get('vin')||''),city:String(f.get('city')),description:String(f.get('description')||''),askingPrice:Number(f.get('price')),currency:String(f.get('currency')||'SYP'),isPriceNegotiable:f.get('negotiable')==='on',mediaPaths:[],ownerAuthorized:true,ownerAuthorizationMethod:authorizationMethod,ownerAuthorizationNote:editing?.ownerAuthorizationNote||`تم توثيق موافقة المالك على عرض المركبة عبر ${methodLabel[authorizationMethod]}.`,ownerAuthorizationPath:String(f.get('authorizationPath')||'')};
  try{const newPaths=await Promise.all(imageFiles.map(file=>uploadImage(file,'vehicles')));input.mediaPaths=[...mediaPaths,...newPaths];if(editing){const {ownerAuthorized:_ownerAuthorized,ownerName:_ownerName,ownerPhone:_ownerPhone,...patch}=input;await updateVehicle(editing.id,patch);await refresh();setSuccess('تم تحديث بيانات المسودة.');setEditing(null);}else{await create.mutateAsync(input);}form.reset();setMediaPaths([]);setImageFiles([]);setMakeSelection('');}catch(err){setError(err instanceof Error&&['اختر صورة بصيغة JPG أو PNG أو WebP.','حجم الصورة يجب ألا يتجاوز 5 ميغابايت.'].includes(err.message)?err.message:getApiErrorMessage(err)||'تعذر رفع الصور أو حفظ المركبة.');}finally{setSaving(false);}
 }
 const canModerate=user?.role==='ADMIN'||user?.role==='MANAGER';
 return <div className="space-y-6" dir="rtl">
  <div className="flex items-start gap-3"><span className="rounded-xl bg-flame-100 p-3 text-flame-700"><Car size={22}/></span><div><h2 className="text-xl font-bold">إضافة مركبات للبيع</h2><p className="mt-1 text-sm text-steel-600">أدخل بيانات المركبة الأساسية واحفظها لتظهر مباشرة في الموقع.</p></div></div>
  {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{success&&<p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>}
  <form key={editing?.id??'new'} onSubmit={onCreate} className="space-y-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-steel-200 sm:p-6">
   <div className="flex items-start gap-3 border-b border-steel-100 pb-4">
    <span className="rounded-lg bg-flame-100 p-2.5 text-flame-700"><ClipboardList size={20}/></span>
    <div><h3 className="font-bold text-gray-900">{editing?'تعديل بيانات المركبة':'إضافة مركبة للبيع'}</h3><p className="mt-1 text-xs leading-6 text-steel-600">أدخل بيانات المركبة الأساسية؛ ستُنشر مباشرة في الموقع بعد الحفظ.</p></div>
   </div>

   <section className="space-y-3" aria-labelledby="vehicle-owner-heading">
    <h4 id="vehicle-owner-heading" className="text-sm font-bold text-gray-800">1. صاحب المركبة</h4>
    {editing?<p className="rounded-lg bg-paper px-4 py-3 text-sm text-steel-700">المالك المسجل: <span className="font-semibold text-ink-900">{editing.owner?.fullName||'محفوظ في سجل المركبة'}</span>{editing.owner?.phone&&<span dir="ltr" className="mr-2 inline-block text-steel-600">{editing.owner.phone}</span>}</p>:<div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">اسم صاحب المركبة *<input name="ownerName" required minLength={2} maxLength={120} className={inputClass} placeholder="الاسم الكامل" autoComplete="name"/></label><label className="text-sm">رقم هاتف صاحب المركبة (اختياري)<input name="ownerPhone" type="tel" maxLength={24} className={inputClass} placeholder="09xxxxxxxx" dir="ltr" autoComplete="tel"/></label></div>}
   </section>

   <section className="space-y-3" aria-labelledby="vehicle-basics-heading">
    <h4 id="vehicle-basics-heading" className="text-sm font-bold text-gray-800">2. بيانات المركبة والسعر</h4>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
     <label className="text-sm">الشركة المصنعة *<select name="make" required defaultValue={editing?vehicleMakes.some(([value])=>value===editing.make)?editing.make:'OTHER':''} onChange={event=>setMakeSelection(event.target.value)} className={inputClass}><option value="" disabled>اختر الشركة المصنعة</option>{vehicleMakes.map(([value,label])=><option key={value} value={value}>{label}</option>)}<option value="OTHER">أخرى</option></select></label>
     {makeSelection==='OTHER'&&<label className="text-sm">اسم الشركة المصنعة *<input name="customMake" required maxLength={80} defaultValue={editing&&!vehicleMakes.some(([value])=>value===editing.make)?editing.make:''} className={inputClass} placeholder="اكتب اسم الشركة"/></label>}
     <label className="text-sm">الطراز *<input name="model" required maxLength={80} defaultValue={editing?.model??''} className={inputClass} placeholder="مثال: Corolla"/></label>
     <label className="text-sm">سنة الصنع *<select name="year" required defaultValue={editing?.year??''} className={inputClass}><option value="" disabled>اختر سنة الصنع</option>{yearOptions.map(year=><option key={year} value={year}>{year}</option>)}{editing&&editing.year<1980&&<option value={editing.year}>{editing.year}</option>}</select></label>
     <label className="text-sm">المدينة *<input name="city" required defaultValue={editing?.city??''} className={inputClass} placeholder="دمشق"/></label>
     <label className="text-sm">السعر المطلوب *<input name="price" type="number" min="0.01" step="0.01" required defaultValue={editing?Number(editing.askingPrice):''} className={inputClass} placeholder="أدخل السعر"/></label>
     <label className="flex items-center gap-2 self-end rounded-lg border border-steel-200 px-3 py-3 text-sm"><input name="negotiable" type="checkbox" defaultChecked={editing?.isPriceNegotiable??false}/> السعر قابل للتفاوض</label>
    </div>
   </section>

   <details className="rounded-lg border border-steel-200 bg-steel-50/50 p-4">
    <summary className="cursor-pointer text-sm font-semibold text-ink-900">تفاصيل إضافية (اختيارية)</summary>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
     <label className="text-sm">المسافة المقطوعة (اختياري)<input name="mileage" type="number" min="0" max="2000000" defaultValue={editing?.mileage??''} className={inputClass} placeholder="مثال: 85000 كم"/></label>
     <label className="text-sm">ناقل الحركة (اختياري)<input name="transmission" maxLength={40} defaultValue={editing?.transmission??''} className={inputClass} placeholder="أوتوماتيك أو عادي"/></label>
     <label className="text-sm">نوع الوقود (اختياري)<input name="fuelType" maxLength={40} defaultValue={editing?.fuelType??''} className={inputClass} placeholder="بنزين، ديزل، هايبرد…"/></label>
     <label className="text-sm">رقم الهيكل (اختياري)<input name="vin" maxLength={40} defaultValue={editing?.vin??''} className={inputClass} placeholder="رقم الهيكل" dir="ltr"/></label>
    </div>
   </details>

   <label className="block text-sm">وصف المركبة (اختياري)<textarea name="description" maxLength={3000} rows={4} defaultValue={editing?.description??''} className={inputClass} placeholder="أضف ملاحظات عن الحالة أو المواصفات، أو اتركه فارغاً."/></label>

   <section className="space-y-3 rounded-lg border border-steel-200 p-4" aria-labelledby="vehicle-images-heading">
    <div className="flex items-center justify-between gap-3"><div><h4 id="vehicle-images-heading" className="text-sm font-bold text-gray-800">صور المركبة</h4><p className="mt-1 text-xs text-steel-500">أضف حتى 12 صورة من جهازك، بصيغة JPG أو PNG أو WebP.</p></div><label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-ink-900 px-4 text-sm font-semibold text-white hover:bg-ink-800"><ImagePlus size={16}/> اختيار الصور<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={event=>{const selected=Array.from(event.target.files??[]);setImageFiles(current=>[...current,...selected].slice(0,Math.max(0,12-mediaPaths.length-current.length)));event.target.value='';}}/></label></div>
    {(mediaPaths.length>0||imagePreviews.length>0)&&<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{mediaPaths.map((path,index)=><div key={`${path}-${index}`} className="relative"><img src={resolveMediaUrl(path)} alt={`صورة المركبة ${index+1}`} className="aspect-video w-full rounded-lg object-cover"/><button type="button" aria-label="إزالة الصورة" onClick={()=>setMediaPaths(paths=>paths.filter((_,i)=>i!==index))} className="absolute left-2 top-2 rounded-full bg-white p-1.5 text-red-700 shadow"><Trash2 size={14}/></button></div>)}{imagePreviews.map((src,index)=><div key={`${src}-${index}`} className="relative"><img src={src} alt={`الصورة المختارة ${index+1}`} className="aspect-video w-full rounded-lg object-cover"/><button type="button" aria-label="إزالة الصورة المختارة" onClick={()=>setImageFiles(files=>files.filter((_,i)=>i!==index))} className="absolute left-2 top-2 rounded-full bg-white p-1.5 text-red-700 shadow"><Trash2 size={14}/></button></div>)}</div>}
   </section>

   <section className="space-y-3 rounded-lg border border-steel-200 p-4" aria-labelledby="vehicle-authorization-heading">
    <h4 id="vehicle-authorization-heading" className="text-sm font-bold text-gray-800">موافقة صاحب المركبة</h4>
    <label className="block max-w-md text-sm">كيف تم توثيق الموافقة؟ *<select name="authorizationMethod" required defaultValue={editing?.ownerAuthorizationMethod??''} className={inputClass}><option value="" disabled>اختر طريقة التوثيق</option><option value="SIGNED_DOCUMENT">مستند موقع</option><option value="RECORDED_CALL">اتصال موثق</option><option value="VERIFIED_MESSAGE">رسالة موثقة</option><option value="IN_PERSON">حضور شخصي</option></select></label>
    <label className="flex items-start gap-2 rounded-lg bg-flame-50 p-3 text-xs leading-6 text-flame-900"><input name="authorized" type="checkbox" required defaultChecked={!!editing} className="mt-1"/> أؤكد أن صاحب المركبة وافق على عرضها، وأن طريقة التوثيق المحددة صحيحة.</label>
   </section>

   <div className="flex flex-wrap items-center gap-3 border-t border-steel-100 pt-4">
    <button disabled={saving} className="btn-flame"><ShieldCheck size={16}/>{saving?'جارٍ الحفظ…':editing?'حفظ التعديلات':'حفظ ونشر المركبة'}</button>
    {editing&&<button type="button" onClick={()=>{setEditing(null);setMediaPaths([]);setImageFiles([]);setMakeSelection('');}} className="rounded-lg border px-4 py-2 text-sm">إلغاء</button>}
    {!editing&&<span className="text-xs text-steel-500">ستظهر المركبة مباشرة في صفحة المركبات بالموقع.</span>}
   </div>
  </form>
  <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-steel-200"><div className="border-b p-4 font-bold">المركبات المسجلة ({query.data?.total??0})</div>{query.isLoading?<p className="p-5">جارٍ التحميل…</p>:query.isError?<p role="alert" className="p-5 text-red-700">تعذّر تحميل المركبات. أعد المحاولة.</p>:!query.data?.items.length?<p className="p-5 text-sm text-steel-500">لا توجد مركبات مسجلة بعد. ابدأ بإضافة أول مركبة من النموذج أعلاه.</p>:<div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead className="bg-steel-50 text-xs"><tr><th className="p-3">المركبة</th><th className="p-3">الحالة</th><th className="p-3">الإجراءات</th></tr></thead><tbody>{query.data.items.map(v=><tr key={v.id} className="border-t"><td className="p-3 font-semibold">{v.make} {v.model} {v.year}<small className="block text-steel-500">{Number(v.askingPrice).toLocaleString()} {v.currency}</small></td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${statusClass[v.status]}`}>{labels[v.status]}</span>{v.moderationNote&&<small className="block text-red-700">{v.moderationNote}</small>}</td><td className="p-3"><div className="flex flex-wrap gap-2"><button className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs" onClick={()=>setDetailId(v.id)}><Eye size={13}/>التفاصيل</button>{['DRAFT','REJECTED'].includes(v.status)&&<><button className="rounded border px-2 py-1 text-xs" onClick={()=>startEditing(v)}>تعديل</button><button className="inline-flex items-center gap-1 rounded bg-ink-900 px-2.5 py-1.5 text-xs text-white" onClick={()=>submit.mutate(v.id)}><Send size={13}/>إرسال للمراجعة</button></>}{canModerate&&v.status==='PENDING'&&<><button aria-label="اعتماد الإعلان" className="rounded bg-green-700 px-2 py-1 text-xs text-white" onClick={()=>review.mutate({id:v.id,status:'APPROVED'})}><BadgeCheck size={14}/></button><button className="rounded bg-red-700 px-2 py-1 text-xs text-white" onClick={()=>review.mutate({id:v.id,status:'REJECTED',note:window.prompt('سبب الرفض')||''})}>رفض</button></>}{canModerate&&v.status==='APPROVED'&&<><button className="rounded bg-blue-700 px-2 py-1 text-xs text-white" onClick={()=>state.mutate({id:v.id,status:'SOLD'})}>مباع</button><button className="rounded bg-gray-600 px-2 py-1 text-xs text-white" onClick={()=>state.mutate({id:v.id,status:'ARCHIVED'})}>أرشفة</button></>}</div></td></tr>)}</tbody></table></div>}</section>
  {detailId&&<div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="تفاصيل المركبة"><article className="my-6 w-full max-w-3xl rounded-xl bg-white p-5 shadow-xl sm:p-7"><div className="flex justify-between gap-4"><div><h2 className="text-xl font-bold">تفاصيل المركبة</h2><p className="mt-1 text-sm text-steel-500">بيانات داخلية خاصة بلوحة الإدارة</p></div><button aria-label="إغلاق" onClick={()=>setDetailId('')} className="h-10 w-10 rounded-lg border"><X size={18}/></button></div>{detail.isLoading?<p className="py-8">جارٍ تحميل التفاصيل…</p>:detail.isError||!detail.data?<p role="alert" className="py-8 text-red-700">تعذّر تحميل تفاصيل المركبة.</p>:<div className="mt-5 space-y-5"><div className="grid gap-3 sm:grid-cols-2">{[['الشركة المصنعة',detail.data.make],['الموديل',detail.data.model],['سنة الصنع',detail.data.year],['السعر المطلوب',`${Number(detail.data.askingPrice).toLocaleString()} ${detail.data.currency}`],['الحالة',labels[detail.data.status]],['المدينة',detail.data.city],['المسافة المقطوعة',detail.data.mileage==null?'—':`${detail.data.mileage.toLocaleString()} كم`],['الوقود',detail.data.fuelType||'—'],['ناقل الحركة',detail.data.transmission||'—'],['رقم الهيكل',detail.data.vin||'—']].map(([label,value])=><div key={label} className="rounded-lg bg-paper p-3"><small className="text-steel-500">{label}</small><p className="mt-1 font-semibold">{value}</p></div>)}</div>{detail.data.description&&<p className="rounded-lg border p-3 text-sm leading-7">{detail.data.description}</p>}{detail.data.mediaPaths.length>0&&<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{detail.data.mediaPaths.map(path=><img key={path} src={resolveMediaUrl(path)} alt={`${detail.data!.make} ${detail.data!.model}`} className="aspect-video w-full rounded-lg object-cover"/>)}</div>}{canModerate&&<section className="rounded-lg border border-amber-200 bg-amber-50 p-4"><h3 className="font-bold">بيانات البائع</h3>{detail.data.owner?<div className="mt-2 space-y-1 text-sm"><p>{detail.data.owner.fullName}</p><p dir="ltr" className="text-right">{detail.data.owner.phone||'لا يوجد رقم هاتف'}</p>{detail.data.owner.email&&<p>{detail.data.owner.email}</p>}{detail.data.owner.contacts?.map((contact,index)=><p key={`${contact.type}-${contact.value}-${index}`}>{contact.label||contact.type}: {contact.value}</p>)}</div>:<p className="mt-2 text-sm text-steel-600">بيانات البائع غير متاحة.</p>}</section>}<p className="text-xs text-steel-500">تاريخ الإضافة: {new Date(detail.data.createdAt).toLocaleDateString('ar')}</p></div>}</article></div>}
 </div>;
}


