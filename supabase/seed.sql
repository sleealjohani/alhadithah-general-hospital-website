insert into public.site_settings (key, value, is_public)
values
  (
    'identity',
    '{"hospital_name_ar":"مستشفى الحديثة العام","hospital_name_en":"Hadetha General Hospital","cluster_ar":"تجمع الجوف الصحي","cluster_en":"Al-Jouf Health Cluster"}',
    true
  ),
  (
    'public_contact',
    '{"showContact":false,"phone":null,"email":null,"mapUrl":null,"notice_ar":"تظهر بيانات التواصل بعد اعتمادها رسميًا من الإدارة.","notice_en":"Contact details appear after official admin approval."}',
    true
  )
on conflict (key) do update set value = excluded.value, is_public = excluded.is_public;

insert into public.services
  (slug, title_ar, title_en, description_ar, description_en, category_ar, category_en, icon, path, status, sort_order)
values
  ('emergency', 'الطوارئ', 'Emergency', 'استقبال الحالات الطارئة وفق مسارات فرز واضحة، مع عرض التعليمات الرسمية بعد اعتمادها.', 'Emergency intake through clear triage paths, with official instructions shown after approval.', 'خدمات عاجلة', 'Urgent Care', 'Siren', '/services#emergency', 'published', 10),
  ('outpatient', 'العيادات الخارجية', 'Outpatient Clinics', 'تعريف بالخدمات والعيادات المتاحة، مع ربطها لاحقًا بمنصات الحجز الرسمية.', 'Service and clinic information, ready to connect with official booking platforms.', 'رعاية مجدولة', 'Scheduled Care', 'CalendarCheck', '/services#outpatient', 'published', 20),
  ('laboratory', 'المختبر', 'Laboratory', 'معلومات عامة عن خدمات المختبر والتعليمات التي يمكن اعتمادها ونشرها من الإدارة.', 'General laboratory information and publishable instructions managed by admins.', 'خدمات تشخيصية', 'Diagnostic', 'FlaskConical', '/services#laboratory', 'published', 30),
  ('radiology', 'الأشعة', 'Radiology', 'عرض منظم لخدمات الأشعة والتعليمات العامة بدون نشر بيانات حساسة.', 'Structured radiology service information without exposing sensitive data.', 'خدمات تشخيصية', 'Diagnostic', 'ScanLine', '/services#radiology', 'published', 40),
  ('pharmacy', 'الصيدلية', 'Pharmacy', 'مساحة لنشر إرشادات الصيدلية المعتمدة وروابط الخدمات الرسمية عند توفرها.', 'A place for approved pharmacy instructions and official service links when available.', 'خدمات مساندة', 'Support', 'Pill', '/services#pharmacy', 'published', 50)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  description_ar = excluded.description_ar,
  description_en = excluded.description_en,
  category_ar = excluded.category_ar,
  category_en = excluded.category_en,
  icon = excluded.icon,
  path = excluded.path,
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.departments
  (slug, title_ar, title_en, description_ar, description_en, category_ar, category_en, icon, path, status, sort_order)
values
  ('medical', 'الأقسام الطبية', 'Medical Departments', 'تصنيف للأقسام الطبية ونطاق عمل كل قسم، مع ربط الخدمات والنماذج المرتبطة.', 'Medical department grouping with related services and forms.', 'طبي', 'Clinical', 'Stethoscope', '/departments#medical', 'published', 10),
  ('technical', 'الأقسام الفنية', 'Technical Departments', 'المختبر، الأشعة، التعقيم، والخدمات الفنية التي تدعم رحلة المستفيد.', 'Laboratory, radiology, sterilization, and other technical services.', 'فني', 'Technical', 'Microscope', '/departments#technical', 'published', 20),
  ('nursing', 'التمريض', 'Nursing', 'مساحة للتمريض تشمل الإعلانات الداخلية والأدلة والنماذج المعتمدة.', 'A nursing area for internal announcements, guides, and approved forms.', 'تمريض', 'Nursing', 'BadgePlus', '/nursing', 'published', 30),
  ('quality', 'الجودة وسلامة المرضى', 'Quality & Patient Safety', 'سياسات ومبادرات وروابط OVR و Good Catch ضمن إطار منظم.', 'Policies, initiatives, OVR, and Good Catch links in a structured area.', 'جودة', 'Quality', 'ShieldCheck', '/quality', 'published', 40)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  description_ar = excluded.description_ar,
  description_en = excluded.description_en,
  category_ar = excluded.category_ar,
  category_en = excluded.category_en,
  icon = excluded.icon,
  path = excluded.path,
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.knowledge_items
  (slug, title_ar, title_en, description_ar, description_en, category_ar, category_en, icon, status, sort_order)
values
  ('policies', 'السياسات والإجراءات', 'Policies & Procedures', 'مكتبة منظمة للسياسات والإجراءات، مع صلاحيات نشر وتحميل من لوحة التحكم.', 'A structured policy and procedure library with admin publishing controls.', 'سياسات', 'Policies', 'FileText', 'published', 10),
  ('guides', 'الأدلة الإرشادية', 'Guides', 'أدلة تشغيلية وتعريفية قابلة للتصنيف والبحث.', 'Operational and informational guides that can be categorized and searched.', 'أدلة', 'Guides', 'BookOpen', 'published', 20),
  ('circulars', 'التعاميم', 'Circulars', 'تعاميم داخلية تظهر للموظفين فقط عند تفعيل صلاحيات الوصول.', 'Internal circulars shown only to staff when access controls are enabled.', 'داخلي', 'Internal', 'Megaphone', 'published', 30)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  description_ar = excluded.description_ar,
  description_en = excluded.description_en,
  category_ar = excluded.category_ar,
  category_en = excluded.category_en,
  icon = excluded.icon,
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.important_links
  (slug, title_ar, title_en, description_ar, description_en, category_ar, category_en, icon, url, status, sort_order)
values
  ('sehhaty', 'صحتي', 'Sehhaty', 'يضاف الرابط الرسمي من لوحة التحكم بعد اعتماده.', 'The official link is added from the admin panel after approval.', 'خدمات وطنية', 'National Services', 'ExternalLink', null, 'published', 10),
  ('seha', 'منصة صحة', 'Seha Platform', 'مساحة جاهزة للرابط المعتمد ولا تعرض رابطًا افتراضيًا.', 'A prepared slot for the approved link; no default public URL is shown.', 'خدمات وطنية', 'National Services', 'ExternalLink', null, 'published', 20),
  ('forms', 'النماذج الإدارية', 'Administrative Forms', 'نماذج قابلة للرفع والتصنيف والبحث من لوحة التحكم.', 'Forms can be uploaded, categorized, and searched from the admin panel.', 'نماذج', 'Forms', 'ClipboardList', null, 'published', 30)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  description_ar = excluded.description_ar,
  description_en = excluded.description_en,
  category_ar = excluded.category_ar,
  category_en = excluded.category_en,
  icon = excluded.icon,
  url = excluded.url,
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.news_posts
  (slug, title_ar, title_en, description_ar, description_en, category_ar, category_en, icon, status, sort_order)
values
  ('portal-ready', 'مساحة أخبار قابلة للإدارة', 'Manageable News Area', 'تظهر الأخبار الرسمية هنا بعد نشرها من لوحة التحكم. هذا المحتوى مبدئي وآمن للمعاينة.', 'Official news appears here after publishing from the admin panel. This is safe preview content.', 'إعلان', 'Announcement', 'Newspaper', 'published', 10)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  description_ar = excluded.description_ar,
  description_en = excluded.description_en,
  category_ar = excluded.category_ar,
  category_en = excluded.category_en,
  icon = excluded.icon,
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.faqs
  (slug, title_ar, title_en, description_ar, description_en, category_ar, category_en, icon, status, sort_order)
values
  ('faq-contact', 'لماذا لا تظهر أرقام التواصل؟', 'Why are contact numbers not shown?', 'لن يتم عرض أي رقم أو بريد حتى يتم إدخاله واعتماده من إعدادات لوحة التحكم.', 'No phone or email is shown until it is entered and approved in admin settings.', 'التواصل', 'Contact', 'CircleHelp', 'published', 10),
  ('faq-admin', 'كيف يتم إنشاء أول مدير؟', 'How is the first admin created?', 'يتم إنشاء المستخدم من Supabase Auth ثم تعيين role = super_admin في جدول profiles حسب دليل الإعداد.', 'Create the user in Supabase Auth, then set role = super_admin in profiles as documented.', 'الإدارة', 'Admin', 'CircleHelp', 'published', 20)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  description_ar = excluded.description_ar,
  description_en = excluded.description_en,
  category_ar = excluded.category_ar,
  category_en = excluded.category_en,
  icon = excluded.icon,
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.navigation_items
  (label_ar, label_en, path, icon, location, sort_order)
values
  ('الرئيسية', 'Home', '/', 'Home', 'header', 10),
  ('عن المستشفى', 'About', '/about', 'FileText', 'header', 20),
  ('الخدمات', 'Services', '/services', 'HeartPulse', 'header', 30),
  ('الأقسام', 'Departments', '/departments', 'Building2', 'header', 40),
  ('مركز المعرفة', 'Knowledge', '/knowledge', 'Library', 'header', 50),
  ('النماذج والروابط', 'Forms & Links', '/links', 'ClipboardList', 'header', 60),
  ('الأخبار', 'News', '/news', 'Newspaper', 'header', 70),
  ('تواصل معنا', 'Contact', '/contact', 'Send', 'header', 80);

insert into public.quick_links
  (title_ar, title_en, description_ar, description_en, icon, path, audience, sort_order)
values
  ('مسار المستفيد', 'Beneficiary Path', 'الوصول السريع للخدمات الصحية، التعليمات، الروابط المهمة، ونموذج الملاحظات.', 'Quick access to health services, instructions, important links, and feedback.', 'HeartPulse', '/services', 'public', 10),
  ('بوابة الموظفين', 'Employee Portal', 'منطقة منظمة للسياسات والنماذج والتعاميم وروابط الجودة وسلامة المرضى.', 'A structured area for policies, forms, circulars, and quality links.', 'BriefcaseBusiness', '/employees', 'employee', 20),
  ('مركز المعرفة', 'Knowledge Center', 'ملفات وسياسات وأدلة وإجراءات قابلة للإدارة من لوحة التحكم.', 'Files, policies, guides, and procedures managed from the admin panel.', 'Library', '/knowledge', 'all', 30),
  ('لوحة التحكم', 'Admin Console', 'إدارة المحتوى والرسائل والصلاحيات عبر تسجيل دخول Supabase.', 'Manage content, messages, and roles through Supabase authentication.', 'ShieldCheck', '/admin', 'admin', 40);

insert into public.homepage_sections (section_key, is_active, sort_order)
values
  ('hero', true, 10),
  ('quick_access', true, 20),
  ('institution', true, 30),
  ('strategy', true, 40),
  ('interactive_path', true, 50),
  ('digital_services', true, 60),
  ('journey', true, 70),
  ('knowledge_and_news', true, 80)
on conflict (section_key) do nothing;
