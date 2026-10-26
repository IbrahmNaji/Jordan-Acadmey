const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'تحقق من صحة البيانات المُدخلة.',
  INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  USER_INACTIVE: 'هذا الحساب غير مُفعّل.',
  REFRESH_REVOKED: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.',
  LEAD_ALREADY_ENROLLED: 'هذا العميل مسجّل مسبقاً في دورة.',
  LEAD_NOT_FOUND: 'العميل المحتمل غير موجود.',
  ENROLLMENT_NOT_FOUND: 'التسجيل غير موجود.',
  ENROLLMENT_CANCELLED: 'لا يمكن إضافة دفعة إلى تسجيل ملغى.',
  PAYMENT_EXCEEDS_REMAINING: 'المبلغ أكبر من المتبقي على الطالب.',
  FEE_BELOW_PAID: 'الرسوم الجديدة أقل من المبلغ المدفوع مسبقاً.',
  INVALID_DATE_RANGE: 'تاريخ البداية يجب أن يسبق تاريخ النهاية.',
  DUPLICATE_LEAD: 'يوجد عميل محتمل مطابق مسجّل خلال آخر 24 ساعة.',
  UNIQUE_CONSTRAINT: 'هذه القيمة مستخدمة مسبقاً.',
  FORBIDDEN: 'لا تملك صلاحية تنفيذ هذا الإجراء.',
  TOO_MANY_ATTEMPTS: 'محاولات كثيرة. يرجى المحاولة بعد بضع دقائق.',
  RATE_LIMITED: 'عدد الطلبات كبير. يرجى المحاولة بعد قليل.',
  INVALID_DATE: 'صيغة التاريخ غير صحيحة.',
  INVALID_SOURCE: 'مصدر التسويق المحدد غير موجود.',
  INVALID_ASSIGNEE: 'الموظف المحدد غير موجود أو غير مُفعّل.',
  INVALID_CURRENT_PASSWORD: 'كلمة المرور الحالية غير صحيحة.',
  PASSWORD_UNCHANGED: 'كلمة المرور الجديدة مطابقة للحالية.',
  CANNOT_DEACTIVATE_SELF: 'لا يمكنك تعطيل حسابك الخاص.',
  CANNOT_CHANGE_OWN_ROLE: 'لا يمكنك تغيير دور حسابك بنفسك.',
  LAST_ADMIN_PROTECTED: 'يجب الإبقاء على مدير نظام نشط واحد على الأقل.',
  INVALID_REFERENCE: 'أحد الحقول المرجعية غير صالح.',
  USER_NOT_FOUND: 'حساب المستخدم غير موجود.',
  INVALID_JSON: 'تعذّر قراءة البيانات المرسلة.',
  INTERNAL_ERROR: 'حدث خطأ غير متوقع. حاول مرة أخرى.',
};

export function getApiErrorMessage(error: unknown): string | null {
  if (!error) return null;
  const err = error as {
    response?: { data?: { error?: string; message?: string } };
  };
  const code = err.response?.data?.error;
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (code === 'VALIDATION_ERROR') return ERROR_MESSAGES.VALIDATION_ERROR;
  return (
    err.response?.data?.message ??
    (error instanceof Error ? error.message : null) ??
    'تعذّر إتمام العملية.'
  );
}
