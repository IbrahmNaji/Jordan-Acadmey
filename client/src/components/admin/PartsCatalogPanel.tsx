import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, PackagePlus, Send, Trash2 } from 'lucide-react';
import { createSparePartListing, fetchSparePartListings, setSparePartListingStatus, type SparePartListingStatus } from '../../api/parts';
import { resolveMediaUrl, uploadImage } from '../../api/media';
import { getApiErrorMessage } from '../../lib/apiError';

const inputClass = 'w-full rounded-lg border border-steel-300 bg-white px-3 py-2 text-sm outline-none focus:border-flame-500 focus:ring-2 focus:ring-flame-100';
const statusLabel: Record<SparePartListingStatus, string> = { DRAFT: 'مسودة', PUBLISHED: 'منشورة', ARCHIVED: 'مخفية' };

export default function PartsCatalogPanel() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['parts-listings'], queryFn: fetchSparePartListings });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const create = useMutation({
    mutationFn: createSparePartListing,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['parts-listings'] });
      setFiles([]);
      setSuccess('نُشرت قطعة الغيار في صفحة قطع الغيار.');
      setError('');
    },
    onError: (err) => setError(getApiErrorMessage(err) || 'تعذر نشر قطعة الغيار.'),
  });
  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SparePartListingStatus }) => setSparePartListingStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parts-listings'] }),
    onError: (err) => setError(getApiErrorMessage(err) || 'تعذر تحديث حالة القطعة.'),
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    const form = event.currentTarget;
    const values = new FormData(form);
    if (!files.length) {
      setError('أضف صورة واحدة على الأقل قبل نشر القطعة.');
      return;
    }
    try {
      const mediaPaths = await Promise.all(files.map((file) => uploadImage(file, 'parts')));
      await create.mutateAsync({
        partName: String(values.get('partName') || '').trim(),
        partNumber: String(values.get('partNumber') || '').trim() || undefined,
        vehicleMake: String(values.get('vehicleMake') || '').trim() || undefined,
        vehicleModel: String(values.get('vehicleModel') || '').trim() || undefined,
        vehicleYear: values.get('vehicleYear') ? Number(values.get('vehicleYear')) : undefined,
        description: String(values.get('description') || '').trim() || undefined,
        price: values.get('price') ? Number(values.get('price')) : undefined,
        currency: String(values.get('currency') || 'SYP'),
        mediaPaths,
      });
      form.reset();
    } catch (err) {
      setError(err instanceof Error && ['اختر صورة بصيغة JPG أو PNG أو WebP.', 'حجم الصورة يجب ألا يتجاوز 5 ميغابايت.'].includes(err.message) ? err.message : getApiErrorMessage(err) || 'تعذر رفع الصور أو نشر القطعة.');
    }
  }

  return <div className="space-y-5">
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-steel-200">
      <div className="flex items-start gap-3"><span className="rounded-lg bg-flame-100 p-2.5 text-flame-700"><PackagePlus size={20}/></span><div><h2 className="font-bold">نشر قطعة غيار</h2><p className="mt-1 text-xs text-steel-500">أضف بيانات القطعة وصورها لعرضها في الموقع. السعر اختياري إذا لم يتحدد بعد.</p></div></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">اسم القطعة *<input name="partName" required minLength={2} maxLength={160} className={inputClass}/></label>
        <label className="text-sm">رقم القطعة<input name="partNumber" maxLength={100} className={inputClass}/></label>
        <label className="text-sm">الشركة المتوافقة<input name="vehicleMake" maxLength={80} className={inputClass}/></label>
        <label className="text-sm">طراز المركبة<input name="vehicleModel" maxLength={80} className={inputClass}/></label>
        <label className="text-sm">سنة المركبة<input name="vehicleYear" type="number" min="1950" max={new Date().getFullYear()+1} className={inputClass}/></label>
        <label className="text-sm">السعر (اختياري)<input name="price" type="number" min="0.01" step="0.01" className={inputClass}/></label>
        <label className="text-sm sm:col-span-2 lg:col-span-3">الوصف<textarea name="description" maxLength={2000} rows={2} className={inputClass}/></label>
      </div>
      <div className="space-y-3 rounded-lg border border-steel-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">صور القطعة *</h3><p className="mt-1 text-xs text-steel-500">JPG أو PNG أو WebP، حتى 12 صورة، 5 ميغابايت للصورة.</p></div><label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-ink-900 px-4 text-sm font-semibold text-white"><ImagePlus size={16}/> اختيار الصور<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event)=>{const picked=Array.from(event.target.files??[]);setFiles((current)=>[...current,...picked].slice(0,12));event.target.value='';}}/></label></div>
        {previews.length>0&&<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{previews.map((src,index)=><div key={src} className="relative"><img src={src} alt={`معاينة صورة القطعة ${index+1}`} className="aspect-video w-full rounded-lg object-cover"/><button type="button" aria-label="إزالة الصورة" onClick={()=>setFiles((current)=>current.filter((_,i)=>i!==index))} className="absolute left-2 top-2 rounded-full bg-white p-1.5 text-red-700 shadow"><Trash2 size={14}/></button></div>)}</div>}
      </div>
      {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{success&&<p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>}
      <button type="submit" disabled={create.isPending} className="btn-flame"><Send size={15}/>{create.isPending?'جارٍ النشر…':'نشر القطعة'}</button>
    </form>

    <section className="space-y-3">
      <div className="flex items-center justify-between"><h2 className="font-bold">القطع المنشورة والمخفية</h2><span className="text-xs text-steel-500">{query.data?.length??0} قطعة</span></div>
      {query.isLoading?<p className="rounded-xl bg-white p-5 text-sm">جارٍ تحميل القطع…</p>:query.isError?<p role="alert" className="rounded-xl bg-white p-5 text-sm text-red-700">تعذر تحميل القطع المنشورة.</p>:!query.data?.length?<p className="rounded-xl bg-white p-5 text-sm text-steel-500">لا توجد قطع منشورة حالياً.</p>:<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{query.data.map((item)=><article key={item.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-steel-200">{item.mediaPaths[0]&&<img src={resolveMediaUrl(item.mediaPaths[0])} alt={item.partName} className="aspect-video w-full object-cover"/>}<div className="space-y-2 p-4"><div className="flex items-start justify-between gap-2"><h3 className="font-bold">{item.partName}</h3><span className="rounded-full bg-steel-100 px-2 py-1 text-xs">{item.status==='PUBLISHED'?'منشورة':statusLabel[item.status]}</span></div>{(item.vehicleMake||item.vehicleModel)&&<p className="text-sm text-steel-600">مناسبة لـ {item.vehicleMake||''} {item.vehicleModel||''} {item.vehicleYear||''}</p>}{item.price&&<p className="font-semibold">{Number(item.price).toLocaleString('ar-SY')} {item.currency}</p>}<button type="button" disabled={changeStatus.isPending} onClick={()=>changeStatus.mutate({id:item.id,status:item.status==='PUBLISHED'?'ARCHIVED':'PUBLISHED'})} className="rounded-lg border px-3 py-1.5 text-xs font-semibold">{item.status==='PUBLISHED'?'إخفاء من الموقع':'نشر في الموقع'}</button></div></article>)}</div>}
    </section>
  </div>;
}
