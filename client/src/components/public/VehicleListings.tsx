import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CalendarDays, Car, Fuel, Gauge, ImageOff, MapPin, Send, Settings2 } from 'lucide-react';
import { fetchPublicVehicles, submitVehicleInquiry, type PublicVehicle } from '../../api/vehicles';
import { resolveMediaUrl } from '../../api/media';

const field='w-full border border-ink-900/15 bg-white px-3 py-2 text-sm';
function Inquiry({ vehicle }: { vehicle: PublicVehicle }) {
 const [message,setMessage]=useState('');const [open,setOpen]=useState(false);
 const mutation=useMutation({mutationFn:(input:{fullName:string;phone:string;email?:string;consent:true})=>submitVehicleInquiry(vehicle.id,input),onSuccess:()=>setMessage('وصل استفسارك إلى فريق بيع وشراء المركبات.')});
 function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const d=new FormData(e.currentTarget);mutation.mutate({fullName:String(d.get('name')),phone:String(d.get('phone')),email:String(d.get('email')||'')||undefined,consent:true});}
 return <div className="mt-5 border-t border-ink-900/10 pt-4">
  <button type="button" aria-expanded={open} onClick={()=>setOpen(value=>!value)} className="btn-flame justify-center">استفسر عن المركبة <Send size={14}/></button>
  {open&&<form onSubmit={submit} className="mt-4 grid gap-2 sm:grid-cols-2">
   <label className="text-xs">الاسم<input name="name" required minLength={2} className={field}/></label>
   <label className="text-xs">رقم الهاتف<input name="phone" required minLength={6} className={field} dir="ltr"/></label>
   <label className="text-xs sm:col-span-2">البريد الإلكتروني (اختياري)<input name="email" type="email" className={field}/></label>
   <label className="flex items-start gap-2 text-xs leading-6 sm:col-span-2"><input name="consent" type="checkbox" required className="mt-1"/>أوافق على استخدام بياناتي للتواصل بشأن هذا الاستفسار وفق سياسة الخصوصية.</label>
   {message&&<p role="status" className="text-xs text-green-700 sm:col-span-2">{message}</p>}
   {mutation.isError&&<p role="alert" className="text-xs text-red-700 sm:col-span-2">تعذر إرسال الاستفسار حالياً. حاول لاحقاً.</p>}
   <button disabled={mutation.isPending} className="btn-flame justify-center sm:col-span-2">أرسل الاستفسار <Send size={14}/></button>
  </form>}
 </div>;
}
function VehicleGallery({ vehicle }: { vehicle: PublicVehicle }) {
 const paths=vehicle.mediaPaths??[];
 const [selectedPath,setSelectedPath]=useState<string|null>(paths[0]??null);
 const [failedPaths,setFailedPaths]=useState<string[]>([]);
 const visiblePaths=paths.filter(path=>!failedPaths.includes(path));
 const currentPath=visiblePaths.includes(selectedPath??'')?selectedPath:visiblePaths[0];
 return <div className="space-y-2">
  <div className="relative overflow-hidden rounded-xl bg-steel-100">
   {currentPath?<img src={resolveMediaUrl(currentPath)} alt={`${vehicle.make} ${vehicle.model} ${vehicle.year}`} loading="lazy" className="aspect-[4/3] w-full object-cover" onError={()=>setFailedPaths(current=>current.includes(currentPath)?current:[...current,currentPath])}/>:<div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 text-steel-500"><ImageOff size={30}/><span className="text-sm">لا تتوفر صورة للمركبة</span></div>}
   {visiblePaths.length>1&&<span className="absolute bottom-3 left-3 rounded-full bg-black/75 px-3 py-1 text-xs font-semibold text-white">{visiblePaths.length} صور</span>}
  </div>
  {visiblePaths.length>1&&<div className="grid grid-cols-3 gap-2">{visiblePaths.slice(0,3).map((path,index)=><button type="button" key={path} onClick={()=>setSelectedPath(path)} aria-label={`عرض الصورة ${index+1}`} aria-pressed={currentPath===path} className={`overflow-hidden rounded-lg border-2 ${currentPath===path?'border-flame-500':'border-transparent'}`}><img src={resolveMediaUrl(path)} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" onError={()=>setFailedPaths(current=>current.includes(path)?current:[...current,path])}/></button>)}</div>}
 </div>;
}
export default function PublicVehicles(){
 const q=useQuery({queryKey:['publicVehicles'],queryFn:fetchPublicVehicles});
 const [city,setCity]=useState('');const [currency,setCurrency]=useState('');const [minimum,setMinimum]=useState('');const [maximum,setMaximum]=useState('');
 const cities=useMemo(()=>Array.from(new Set((q.data??[]).map(vehicle=>vehicle.city).filter(Boolean))),[q.data]);
 const currencies=useMemo(()=>Array.from(new Set((q.data??[]).map(vehicle=>vehicle.currency).filter(Boolean))),[q.data]);
 const filtered=(q.data??[]).filter(vehicle=>{
  const price=Number(vehicle.askingPrice);
  return (!city||vehicle.city===city)&&(!currency||vehicle.currency===currency)&&(!minimum||price>=Number(minimum))&&(!maximum||price<=Number(maximum));
 });
 return <section className="shell py-10 sm:py-14" aria-labelledby="approved-listings">
  <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">إعلانات الأكاديمية</p><h2 id="approved-listings" className="mt-2 font-display text-2xl font-extrabold">سيارات للبيع</h2></div><Car className="text-flame-600" aria-hidden="true"/></div>
  {q.isLoading?<p className="mt-6 text-sm">جارٍ تحميل الإعلانات…</p>:q.isError?<p className="mt-6 text-sm text-steel-600">تعذر تحميل الإعلانات حالياً.</p>:!q.data?.length?<div className="mt-6 rounded-xl border border-ink-900/10 bg-white p-6 text-sm text-steel-600">لا توجد إعلانات منشورة حالياً.</div>:<>
   <div className="mt-6 grid gap-3 rounded-xl border border-steel-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
    <label className="text-xs font-semibold text-steel-600">المنطقة<select value={city} onChange={event=>setCity(event.target.value)} className={`${field} mt-1 rounded-lg`}><option value="">كل المناطق</option>{cities.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
    <label className="text-xs font-semibold text-steel-600">العملة<select value={currency} onChange={event=>setCurrency(event.target.value)} className={`${field} mt-1 rounded-lg`}><option value="">كل العملات</option>{currencies.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
    <label className="text-xs font-semibold text-steel-600">السعر من<input type="number" min="0" value={minimum} onChange={event=>setMinimum(event.target.value)} className={`${field} mt-1 rounded-lg`} placeholder="أقل سعر"/></label>
    <label className="text-xs font-semibold text-steel-600">السعر إلى<input type="number" min="0" value={maximum} onChange={event=>setMaximum(event.target.value)} className={`${field} mt-1 rounded-lg`} placeholder="أعلى سعر"/></label>
   </div>
   {filtered.length?<div className="mt-5 space-y-5">{filtered.map(vehicle=><article key={vehicle.id} className="grid overflow-hidden rounded-2xl border border-steel-200 bg-white shadow-sm transition-shadow hover:shadow-md lg:grid-cols-[minmax(260px,36%)_minmax(0,1fr)]">
    <div className="p-3 sm:p-4"><VehicleGallery vehicle={vehicle}/></div>
    <div className="flex min-w-0 flex-col p-4 sm:p-6">
     <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-steel-500">إعلان مركبة للبيع</p><h3 className="mt-1 font-display text-xl font-extrabold">{vehicle.make} {vehicle.model}</h3><p className="mt-1 text-sm text-steel-600">سنة الصنع {vehicle.year}</p></div><p className="text-xl font-extrabold text-red-700">{Number(vehicle.askingPrice).toLocaleString('ar')} {vehicle.currency}</p></div>
     {vehicle.isPriceNegotiable&&<span className="mt-2 w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">السعر قابل للتفاوض</span>}
     <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 border-b border-dashed border-steel-200 pb-5 text-sm text-steel-700">
      <span className="inline-flex items-center gap-2"><CalendarDays size={16} className="text-steel-500"/>{vehicle.year}</span>
      <span className="inline-flex items-center gap-2"><MapPin size={16} className="text-steel-500"/>{vehicle.city}</span>
      {vehicle.mileage!=null&&<span className="inline-flex items-center gap-2"><Gauge size={16} className="text-steel-500"/>{vehicle.mileage.toLocaleString('ar')} كم</span>}
      {vehicle.transmission&&<span className="inline-flex items-center gap-2"><Settings2 size={16} className="text-steel-500"/>{vehicle.transmission}</span>}
      {vehicle.fuelType&&<span className="inline-flex items-center gap-2"><Fuel size={16} className="text-steel-500"/>{vehicle.fuelType}</span>}
     </div>
     {vehicle.description&&<p className="mt-4 line-clamp-3 text-sm leading-7 text-steel-600">{vehicle.description}</p>}
     <div className="mt-auto"><Inquiry vehicle={vehicle}/></div>
    </div>
   </article>)}</div>:<p className="mt-5 rounded-xl border border-steel-200 bg-white p-5 text-sm text-steel-600">لا توجد مركبات تطابق خيارات التصفية.</p>}
  </>}
 </section>;
}
