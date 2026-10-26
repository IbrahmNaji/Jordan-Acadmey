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
