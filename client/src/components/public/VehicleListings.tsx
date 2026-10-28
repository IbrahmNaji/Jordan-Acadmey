import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Car, Send } from 'lucide-react';
import { fetchPublicVehicles, submitVehicleInquiry, type PublicVehicle } from '../../api/vehicles';

const field='w-full border border-ink-900/15 bg-white px-3 py-2 text-sm';
function Inquiry({ vehicle }: { vehicle: PublicVehicle }) {
 const [message,setMessage]=useState('');
 const mutation=useMutation({mutationFn:(input:{fullName:string;phone:string;email?:string;consent:true})=>submitVehicleInquiry(vehicle.id,input),onSuccess:()=>setMessage('وصل استفسارك إلى فريق بيع وشراء المركبات.')});
 function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const d=new FormData(e.currentTarget);mutation.mutate({fullName:String(d.get('name')),phone:String(d.get('phone')),email:String(d.get('email')||'')||undefined,consent:true});}
 return <form onSubmit={submit} className="mt-5 grid gap-2 border-t border-ink-900/10 pt-4">
  <label className="text-xs">الاسم<input name="name" required minLength={2} className={field}/></label>
  <label className="text-xs">رقم الهاتف<input name="phone" required minLength={6} className={field} dir="ltr"/></label>
  <label className="text-xs">البريد الإلكتروني (اختياري)<input name="email" type="email" className={field}/></label>
  <label className="flex items-start gap-2 text-xs leading-6"><input name="consent" type="checkbox" required className="mt-1"/>أوافق على استخدام بياناتي للتواصل بشأن هذا الاستفسار وفق سياسة الخصوصية.</label>
  {message&&<p role="status" className="text-xs text-green-700">{message}</p>}
  {mutation.isError&&<p role="alert" className="text-xs text-red-700">تعذر إرسال الاستفسار حالياً. حاول لاحقاً.</p>}
  <button disabled={mutation.isPending} className="btn-flame justify-center">أرسل استفساراً <Send size={14}/></button>
 </form>;
}
export default function PublicVehicles(){
 const q=useQuery({queryKey:['publicVehicles'],queryFn:fetchPublicVehicles});
 return <section className="shell py-14 sm:py-20" aria-labelledby="approved-listings">
  <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">إعلانات معتمدة</p><h2 id="approved-listings" className="mt-2 font-display text-2xl font-extrabold">المركبات المتاحة</h2></div><Car className="text-flame-600" aria-hidden="true"/></div>
  {q.isLoading?<p className="mt-6 text-sm">جارٍ تحميل الإعلانات…</p>:q.isError?<p className="mt-6 text-sm text-steel-600">تعذر تحميل الإعلانات حالياً.</p>:!q.data?.length?<div className="mt-6 border border-ink-900/10 bg-white p-6 text-sm text-steel-600">لا توجد إعلانات منشورة حالياً. لا تظهر هنا إلا الإعلانات التي راجعها الفريق واعتمدها.</div>:<div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{q.data.map((v:PublicVehicle)=><article key={v.id} className="border border-ink-900/10 bg-white p-5"><div><p className="font-display text-lg font-bold">{v.make} {v.model}</p><p className="text-xs text-steel-500">{v.year} · {v.city}</p></div>{v.mediaPaths[0]&&<img src={`/${v.mediaPaths[0].replace(/^\//,'')}`} alt={`${v.make} ${v.model} ${v.year}`} loading="lazy" className="mt-4 aspect-video w-full object-cover"/>}<p className="mt-4 text-xl font-bold">{Number(v.askingPrice).toLocaleString()} {v.currency}{v.isPriceNegotiable&&<small className="mr-2 text-xs font-normal text-steel-500">قابل للتفاوض</small>}</p>{v.description&&<p className="mt-2 line-clamp-3 text-sm leading-7 text-steel-600">{v.description}</p>}<Inquiry vehicle={v}/></article>)}</div>}
 </section>;
}
