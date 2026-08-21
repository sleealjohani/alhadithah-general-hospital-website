#!/usr/bin/env python3
"""Builds the self-contained Arabic presentation deck.

Embeds the hospital logo, live screen-recording clips (MP4), and still captures
as data URIs so the published artifact needs no external assets (only Google
Fonts, which the Artifact CSP allows).

Inputs:  /tmp/site-shots/*.jpg   (stills)
         /tmp/deck-clips/*.mp4   (screen recordings)
Usage:   python3 scripts/build-deck.py
"""
import base64
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = pathlib.Path("/tmp/site-shots")
CLIPS = pathlib.Path("/tmp/deck-clips")
OUT = ROOT / "presentation" / "hadetha-portal-deck.html"

MIME = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
        "webp": "image/webp", "mp4": "video/mp4", "webm": "video/webm"}


def data_uri(path: pathlib.Path) -> str:
    mime = MIME[path.suffix.lstrip(".").lower()]
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


IMG = {p.stem: data_uri(p) for p in sorted(SHOTS.glob("*.jpg"))}
# Two encodings per clip: VP9/WebM for Chrome, Firefox and Edge; H.264/MP4 for
# Safari and any build without open-codec support.
VID = {p.stem: data_uri(p) for p in sorted(CLIPS.glob("*.mp4"))}
VID_WEBM = {p.stem: data_uri(p) for p in sorted(CLIPS.glob("*.webm"))}
LOGO = data_uri(ROOT / "public/assets/brand/hospital-logo-white.webp")
MARK = data_uri(ROOT / "public/assets/brand/brand-mark-white.webp")


def chrome_bar(url: str) -> str:
    return (f'<div class="chrome"><span class="dots"><i></i><i></i><i></i></span>'
            f'<span class="url">{url}</span></div>')


def browser_video(key: str, url: str = "had-hos.vercel.app", live: bool = True) -> str:
    """Desktop screen recording in a browser window frame."""
    badge = '<span class="live"><i></i>تسجيل مباشر</span>' if live else ""
    return f"""<figure class="shot browser">
        {chrome_bar(url)}
        <div class="screen">
          <video muted loop playsinline preload="none"
                 data-webm="{VID_WEBM[key]}" data-mp4="{VID[key]}"></video>
          {badge}
        </div>
      </figure>"""


def browser_img(key: str, url: str = "had-hos.vercel.app", crop: bool = True) -> str:
    cls = "shot browser" + ("" if crop else " nocrop")
    return f"""<figure class="{cls}">
        {chrome_bar(url)}
        <div class="screen"><img src="{IMG[key]}" alt="" loading="lazy" /></div>
      </figure>"""


def phone_video(key: str) -> str:
    """Mobile screen recording in a phone bezel."""
    return f"""<figure class="shot phone">
        <span class="notch" aria-hidden="true"></span>
        <video muted loop playsinline preload="none"
               data-webm="{VID_WEBM[key]}" data-mp4="{VID[key]}"></video>
      </figure>"""


SLIDES = []

# ---- 1. Cover ------------------------------------------------------------
SLIDES.append(f"""<section class="slide cover" aria-label="الغلاف">
  <span class="aura" aria-hidden="true"></span>
  <div class="cover-inner">
    <img class="cover-logo r" src="{LOGO}" alt="مستشفى الحديثة العام" />
    <p class="eyebrow r">تجمع الجوف الصحي</p>
    <h1 class="r">البوابة الرقمية<br /><span>لمستشفى الحديثة العام</span></h1>
    <p class="lede r">واجهة رقمية واحدة تجمع الخدمات والمعلومات وحجز المواعيد،
      ويديرها فريق المستشفى بالكامل دون الحاجة إلى مبرمج.</p>
    <p class="cover-meta r"><span class="mono">had-hos.vercel.app</span></p>
  </div>
  <img class="cover-mark" src="{MARK}" alt="" aria-hidden="true" />
</section>""")

# ---- 2. Why (live homepage) ---------------------------------------------
SLIDES.append(f"""<section class="slide split" aria-label="لماذا بوابة رقمية">
  <div class="col-text">
    <p class="eyebrow r">لماذا بوابة رقمية؟</p>
    <h2 class="r">نقطة وصول واحدة للمراجع والموظف</h2>
    <ul class="points r">
      <li><strong>مصدر رسمي واحد</strong><span>كل الخدمات والأدلة والأخبار في مكان واحد بدل تفرّقها.</span></li>
      <li><strong>خدمة ذاتية على مدار الساعة</strong><span>المراجع ينجز طلبه دون اتصال أو حضور مسبق.</span></li>
      <li><strong>تحديث فوري</strong><span>المحتوى يُدار من لوحة تحكم عربية دون تدخل تقني.</span></li>
      <li><strong>هوية موحّدة</strong><span>ألوان التجمع وشعار المستشفى في كل صفحة.</span></li>
    </ul>
  </div>
  <div class="col-shot r">{browser_video("home")}</div>
</section>""")

# ---- 3. Responsive (live mobile + desktop still) ------------------------
SLIDES.append(f"""<section class="slide split" aria-label="تجربة على كل الأجهزة">
  <div class="col-text">
    <p class="eyebrow r">التجربة</p>
    <h2 class="r">تجربة واحدة على الحاسب والجوال</h2>
    <p class="body r">صُمّمت البوابة عربية أولًا مع دعم كامل للإنجليزية، وتتكيّف تلقائيًا
      مع مقاس الشاشة — فما يراه المراجع على جواله هو نفس المحتوى بترتيب يناسب يده.</p>
    <div class="chips r">
      <span>عربي / English</span><span>تصميم متجاوب</span><span>الوضع الليلي</span><span>وصول ميسّر</span>
    </div>
  </div>
  <div class="col-shot pair r">
    {browser_img("home-desktop")}
    {phone_video("mobile")}
  </div>
</section>""")

# ---- 4. Content + staff (live nursing flip) -----------------------------
SLIDES.append(f"""<section class="slide split" aria-label="المحتوى والكوادر">
  <div class="col-text">
    <p class="eyebrow r">المحتوى</p>
    <h2 class="r">خدمات وتدريب ومحتوى للكوادر</h2>
    <ul class="points compact r">
      <li><strong>الخدمات والأقسام</strong><span>عرض منظّم لكل خدمة مع تفاصيلها وموقعها.</span></li>
      <li><strong>الشؤون الأكاديمية والتدريب</strong><span>الدورات والتسجيل فيها وشهادات الحضور.</span></li>
      <li><strong>بوابة التمريض</strong><span>السياسات وخطط الإجازات والملف المهني.</span></li>
      <li><strong>تكريم المتميّزين</strong><span>بطاقة «ممرض الشهر» تُدار وتُحدَّث شهريًا.</span></li>
    </ul>
  </div>
  <div class="col-shot pair r">
    {browser_video("nursing", "had-hos.vercel.app/nursing")}
    {browser_img("training-desktop", "had-hos.vercel.app/training")}
  </div>
</section>""")

# ---- 5. Appointments: intro ---------------------------------------------
SLIDES.append(f"""<section class="slide split feature" aria-label="حجز المواعيد">
  <div class="col-text">
    <p class="eyebrow gold r">الميزة الجديدة</p>
    <h2 class="r">حجز موعد في العيادات<br /><span class="gold">إلكترونيًا وبدون اتصال</span></h2>
    <p class="body r">بطاقة مباشرة في الصفحة الرئيسية تنقل المراجع إلى صفحة الحجز.
      يختار العيادة والوقت المناسب ويرسل طلبه في أقل من دقيقة، في أي وقت وبدون
      انتظار على الهاتف.</p>
    <ul class="points compact r">
      <li><strong>متاح ٢٤ ساعة</strong><span>الطلب يُرسل في أي وقت، ويراجعه قسم التسجيل في الدوام.</span></li>
      <li><strong>مواعيد حقيقية</strong><span>الأوقات المعروضة مبنية على جدول كل عيادة فعليًا.</span></li>
    </ul>
  </div>
  <div class="col-shot r">{browser_img("home-appt-card")}</div>
</section>""")

# ---- 6. Appointments: booking in motion ---------------------------------
SLIDES.append(f"""<section class="slide split feature wide-shot" aria-label="خطوات الحجز">
  <div class="col-text">
    <p class="eyebrow gold r">الميزة الجديدة · خطوات الحجز</p>
    <h2 class="r">ثلاث خطوات فقط</h2>
    <ol class="steps-list r">
      <li><span class="mono">١</span><div><strong>اختيار العيادة</strong><span>ست عيادات وأكثر، تُضاف وتُعدّل من لوحة التحكم.</span></div></li>
      <li><span class="mono">٢</span><div><strong>التاريخ والوقت</strong><span>أيام عمل العيادة فقط، والأوقات المكتملة تظهر غير متاحة.</span></div></li>
      <li><span class="mono">٣</span><div><strong>بيانات المريض</strong><span>الاسم والهوية والجوال وتاريخ الميلاد ميلادي أو هجري.</span></div></li>
    </ol>
  </div>
  <div class="col-shot r">{browser_video("booking", "had-hos.vercel.app/appointments")}</div>
</section>""")

# ---- 7. Appointments: reference + tracking (two clips) ------------------
SLIDES.append(f"""<section class="slide split feature wide-shot" aria-label="رقم الطلب والمتابعة">
  <div class="col-text">
    <p class="eyebrow gold r">الميزة الجديدة · بعد الإرسال</p>
    <h2 class="r">رقم طلب فريد ومتابعة ذاتية</h2>
    <p class="body r">بمجرد الإرسال يحصل المراجع على رقم طلب فريد ورسالة تأكيد،
      ويستطيع لاحقًا متابعة حالة طلبه بثلاث طرق.</p>
    <p class="ref-chip mono r">HGH-260821-3947</p>
    <ul class="points compact r">
      <li><strong>متابعة بثلاث طرق</strong><span>رقم الطلب أو رقم الهوية أو رقم الجوال.</span></li>
      <li><strong>تعديل أو إلغاء ذاتي</strong><span>دون الحاجة للاتصال بالمستشفى.</span></li>
      <li><strong>ملاحظات وتعليمات</strong><span>يكتبها قسم التسجيل وتظهر للمراجع مع موعده.</span></li>
    </ul>
  </div>
  <div class="col-shot pair r">
    {browser_video("submit", "had-hos.vercel.app/appointments")}
    {browser_video("track", "had-hos.vercel.app/appointments")}
  </div>
</section>""")

# ---- 8. Future idea: choose the care provider ---------------------------
SLIDES.append(f"""<section class="slide split future" aria-label="فكرة مستقبلية">
  <div class="col-text">
    <p class="eyebrow future-tag r">فكرة مستقبلية</p>
    <h2 class="r">اختيار مقدم الرعاية<br /><span class="sky">عند حجز الموعد</span></h2>
    <p class="body r">إذا كان لكل عيادة أطباء ثابتون، تُضاف خطوة يختار فيها المراجع
      الطبيب المعالج — فيرى اسمه وتخصصه وأقرب موعد متاح لديه، أو يترك الخيار
      «أي طبيب متاح» ليُخصَّص له أقرب موعد شاغر.</p>
    <ul class="points compact r">
      <li><strong>استمرارية الرعاية</strong><span>يتابع المراجع مع الطبيب نفسه في كل زيارة.</span></li>
      <li><strong>توزيع أدق للمواعيد</strong><span>جدول كل طبيب مستقل بدل جدول واحد للعيادة.</span></li>
      <li><strong>شفافية للمراجع</strong><span>يعرف مسبقًا من سيقابله ومتى.</span></li>
    </ul>
  </div>
  <div class="col-shot r">{browser_img("future-doctor", "had-hos.vercel.app/appointments", crop=False)}</div>
</section>""")

# ---- 9. Impact / close ---------------------------------------------------
SLIDES.append(f"""<section class="slide closing" aria-label="الخلاصة">
  <span class="aura" aria-hidden="true"></span>
  <div class="closing-inner">
    <p class="eyebrow gold r">الخلاصة</p>
    <h2 class="r">من صفحة تعريفية إلى بوابة خدمات</h2>
    <div class="stats r">
      <div><strong class="mono">٢٤/٧</strong><span>استقبال طلبات المواعيد</span></div>
      <div><strong class="mono">٣</strong><span>طرق لمتابعة الطلب</span></div>
      <div><strong class="mono">٦</strong><span>عيادات قابلة للتوسعة</span></div>
      <div><strong class="mono">١٠٠٪</strong><span>إدارة ذاتية من اللوحة</span></div>
    </div>
    <p class="closing-body r">كل ما سبق يُدار من لوحة تحكم عربية: المحتوى والعيادات وأوقاتها،
      وطلبات المواعيد في قسم «التسجيل والمواعيد» مع إمكانية التصدير إلى Excel
      وتحديث الحالة وكتابة الملاحظات.</p>
    <img class="closing-logo r" src="{LOGO}" alt="مستشفى الحديثة العام" />
  </div>
</section>""")

DOTS = "".join(
    f'<button class="dot" data-go="{i}" aria-label="الشريحة {i + 1}"></button>' for i in range(len(SLIDES))
)

HTML = f"""<title>بوابة الحديثة الرقمية</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" />
<style>
:root {{
  /* Cluster palette, taken from the site's own token system. */
  --ink: #0a1a2b;
  --ink-2: #0e2841;
  --sky: #2ea3e0;
  --sky-lit: #78c5ee;
  --sand: #c89a4c;
  --sand-lit: #eacb93;
  --paper: #eef3f8;
  --muted: #a8bccc;
  --line: rgba(120, 197, 238, .20);
  --bloom: 24px 8px 8px 8px;
  --ease: cubic-bezier(.22, 1, .36, 1);
  --ar: "IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, monospace;
  color-scheme: dark;
}}

* {{ box-sizing: border-box; }}
html, body {{ height: 100%; }}
body {{
  margin: 0;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--ar);
  direction: rtl;
  overflow: hidden;
}}

/* ---- Deck shell -------------------------------------------------------- */
.deck {{ position: relative; height: 100dvh; width: 100%; overflow: hidden; }}

.slide {{
  position: absolute;
  inset: 0;
  display: grid;
  align-content: center;
  gap: 28px;
  padding: clamp(26px, 3.6vw, 60px) clamp(28px, 5vw, 88px);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: scale(.985);
  transition: opacity .55s ease, transform .7s var(--ease), visibility .55s;
  background:
    radial-gradient(90% 70% at 88% -10%, rgba(46, 163, 224, .16), transparent 60%),
    radial-gradient(70% 60% at 6% 100%, rgba(200, 154, 76, .10), transparent 62%),
    linear-gradient(180deg, var(--ink-2), var(--ink));
}}
.slide.is-active {{ opacity: 1; visibility: visible; pointer-events: auto; transform: none; }}
/* Slides already seen sit slightly further back as they leave. */
.slide.is-past {{ transform: scale(.97); }}

/* Ambient drift behind cover + closing. */
.aura {{
  position: absolute;
  inset: -25%;
  background:
    radial-gradient(38% 38% at 30% 40%, rgba(46, 163, 224, .22), transparent 70%),
    radial-gradient(32% 32% at 72% 62%, rgba(200, 154, 76, .16), transparent 70%);
  filter: blur(10px);
  animation: drift 22s ease-in-out infinite alternate;
  pointer-events: none;
}}
@keyframes drift {{
  from {{ transform: translate3d(-2%, -1%, 0) scale(1); }}
  to   {{ transform: translate3d(3%, 2%, 0) scale(1.08); }}
}}

/* ---- Staggered reveal on the active slide ------------------------------ */
.r {{ opacity: 0; transform: translateY(16px); }}
.slide.is-active .r {{ animation: rise .72s var(--ease) both; }}
.slide.is-active .r:nth-child(1) {{ animation-delay: .10s; }}
.slide.is-active .r:nth-child(2) {{ animation-delay: .18s; }}
.slide.is-active .r:nth-child(3) {{ animation-delay: .26s; }}
.slide.is-active .r:nth-child(4) {{ animation-delay: .34s; }}
.slide.is-active .r:nth-child(5) {{ animation-delay: .42s; }}
.slide.is-active .col-shot.r {{ animation-delay: .28s; animation-duration: .85s; }}
@keyframes rise {{ to {{ opacity: 1; transform: none; }} }}

/* Points animate in one after another. */
.slide.is-active .points li,
.slide.is-active .steps-list li,
.slide.is-active .chips span,
.slide.is-active .stats div {{ animation: rise .6s var(--ease) both; }}
.points li, .steps-list li, .chips span, .stats div {{ opacity: 0; }}
.slide.is-active .points li:nth-child(1),
.slide.is-active .steps-list li:nth-child(1),
.slide.is-active .chips span:nth-child(1),
.slide.is-active .stats div:nth-child(1) {{ animation-delay: .40s; }}
.slide.is-active .points li:nth-child(2),
.slide.is-active .steps-list li:nth-child(2),
.slide.is-active .chips span:nth-child(2),
.slide.is-active .stats div:nth-child(2) {{ animation-delay: .50s; }}
.slide.is-active .points li:nth-child(3),
.slide.is-active .steps-list li:nth-child(3),
.slide.is-active .chips span:nth-child(3),
.slide.is-active .stats div:nth-child(3) {{ animation-delay: .60s; }}
.slide.is-active .points li:nth-child(4),
.slide.is-active .chips span:nth-child(4),
.slide.is-active .stats div:nth-child(4) {{ animation-delay: .70s; }}

/* ---- Type -------------------------------------------------------------- */
.eyebrow {{
  margin: 0;
  color: var(--sky-lit);
  font-size: clamp(.78rem, 1.1vw, .95rem);
  font-weight: 600;
  letter-spacing: .14em;
}}
.eyebrow.gold {{ color: var(--sand-lit); }}
.eyebrow::before {{
  content: "";
  display: inline-block;
  width: 34px;
  height: 2px;
  margin-inline-end: 12px;
  vertical-align: middle;
  background: currentColor;
  opacity: .7;
}}
.future-tag {{ color: var(--sand-lit); }}
.future-tag::after {{
  content: "تصوّر مقترح";
  margin-inline-start: 12px;
  padding: 3px 11px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  font-size: .72rem;
  letter-spacing: 0;
}}

h1 {{
  margin: 14px 0 0;
  font-size: clamp(2rem, 5vw, 3.9rem);
  font-weight: 700;
  line-height: 1.22;
  text-wrap: balance;
}}
h1 span {{ color: var(--sky-lit); }}
h2 {{
  margin: 12px 0 0;
  font-size: clamp(1.45rem, 3vw, 2.4rem);
  font-weight: 700;
  line-height: 1.3;
  text-wrap: balance;
}}
h2 .gold {{ color: var(--sand-lit); }}
h2 .sky {{ color: var(--sky-lit); }}
.lede {{
  margin: 18px 0 0;
  max-width: 46ch;
  color: var(--muted);
  font-size: clamp(.96rem, 1.4vw, 1.16rem);
  font-weight: 300;
  line-height: 1.85;
}}
.body {{
  margin: 16px 0 0;
  max-width: 44ch;
  color: var(--muted);
  font-size: clamp(.9rem, 1.2vw, 1.02rem);
  font-weight: 300;
  line-height: 1.9;
}}
.mono {{ font-family: var(--mono); font-variant-numeric: tabular-nums; }}

/* ---- Layouts ----------------------------------------------------------- */
.split {{
  grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr);
  align-items: center;
  gap: clamp(26px, 4vw, 60px);
}}
.split.wide-shot {{ grid-template-columns: minmax(0, .74fr) minmax(0, 1.26fr); }}
.col-text {{ min-width: 0; }}
.col-shot {{ min-width: 0; display: grid; gap: 16px; }}
.col-shot.pair {{ grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: center; }}

.points {{
  list-style: none;
  margin: 22px 0 0;
  padding: 0;
  display: grid;
  gap: 14px;
}}
.points.compact {{ gap: 11px; }}
.points li {{
  display: grid;
  gap: 3px;
  padding-inline-start: 16px;
  border-inline-start: 2px solid var(--line);
}}
.points strong {{ font-size: clamp(.93rem, 1.25vw, 1.05rem); font-weight: 600; }}
.points span {{
  color: var(--muted);
  font-size: clamp(.82rem, 1.05vw, .94rem);
  font-weight: 300;
  line-height: 1.7;
}}

.steps-list {{ list-style: none; margin: 24px 0 0; padding: 0; display: grid; gap: 16px; }}
.steps-list li {{ display: grid; grid-template-columns: auto 1fr; gap: 14px; align-items: start; }}
.steps-list li > span {{
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--sand-lit), var(--sand));
  color: #16223a;
  font-size: 1rem;
  font-weight: 600;
}}
.steps-list strong {{ display: block; font-size: clamp(.95rem, 1.3vw, 1.08rem); font-weight: 600; }}
.steps-list div span {{
  color: var(--muted);
  font-size: clamp(.82rem, 1.05vw, .94rem);
  font-weight: 300;
  line-height: 1.7;
}}

.chips {{ display: flex; flex-wrap: wrap; gap: 9px; margin-top: 22px; }}
.chips span {{
  padding: 7px 15px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--sky-lit);
  font-size: clamp(.76rem, 1vw, .88rem);
  font-weight: 500;
}}

.ref-chip {{
  display: inline-block;
  margin: 20px 0 0;
  padding: 12px 22px;
  border: 1px dashed var(--sand);
  border-radius: 10px;
  background: rgba(200, 154, 76, .10);
  color: var(--sand-lit);
  font-size: clamp(1rem, 1.6vw, 1.3rem);
  font-weight: 600;
  letter-spacing: .05em;
}}

/* ---- Device frames ----------------------------------------------------- */
.shot {{ margin: 0; min-width: 0; }}
.browser {{
  border-radius: var(--bloom);
  overflow: hidden;
  background: #0d1826;
  border: 1px solid var(--line);
  box-shadow: 0 26px 60px rgba(0, 0, 0, .5);
}}
.chrome {{
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: linear-gradient(180deg, #16283c, #10202f);
  border-bottom: 1px solid rgba(255, 255, 255, .06);
}}
.dots {{ display: flex; gap: 5px; flex: 0 0 auto; }}
.dots i {{ width: 8px; height: 8px; border-radius: 50%; background: #3a4d63; }}
.dots i:first-child {{ background: #e06c62; }}
.dots i:nth-child(2) {{ background: #d8a44a; }}
.dots i:nth-child(3) {{ background: #55a463; }}
.url {{
  flex: 1;
  padding: 3px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .06);
  color: var(--muted);
  font-family: var(--mono);
  font-size: .68rem;
  direction: ltr;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}}
.screen {{ position: relative; line-height: 0; }}
.browser :is(img, video) {{
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  object-position: top center;
}}
.browser.nocrop :is(img, video) {{ aspect-ratio: auto; object-fit: contain; }}

/* "live recording" badge on video frames */
.live {{
  position: absolute;
  top: 10px;
  inset-inline-start: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(10, 26, 43, .78);
  border: 1px solid var(--line);
  color: var(--paper);
  font-size: .68rem;
  font-weight: 600;
  line-height: 1;
  backdrop-filter: blur(4px);
}}
.live i {{
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ff5f57;
  animation: blip 1.6s ease-in-out infinite;
}}
@keyframes blip {{ 0%, 100% {{ opacity: 1; }} 50% {{ opacity: .25; }} }}

.phone {{
  position: relative;
  justify-self: center;
  width: min(100%, 232px);
  padding: 11px;
  border-radius: 30px;
  background: linear-gradient(160deg, #1b3048, #0c1725);
  border: 1px solid var(--line);
  box-shadow: 0 26px 60px rgba(0, 0, 0, .5);
}}
.phone .notch {{
  position: absolute;
  top: 17px;
  left: 50%;
  transform: translateX(-50%);
  width: 62px;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .18);
  z-index: 2;
}}
.phone video {{ display: block; width: 100%; height: auto; border-radius: 20px; }}

/* ---- Cover ------------------------------------------------------------- */
.cover {{ place-content: center; justify-items: start; }}
.cover-inner {{ max-width: 74ch; position: relative; z-index: 1; }}
.cover-logo {{ width: clamp(190px, 22vw, 300px); height: auto; margin-bottom: 28px; }}
.cover-meta {{ margin: 30px 0 0; }}
.cover-meta .mono {{
  padding: 8px 16px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--sky-lit);
  font-size: .82rem;
  direction: ltr;
  display: inline-block;
}}
.cover-mark {{
  position: absolute;
  inset-inline-start: -6%;
  bottom: -18%;
  width: min(56vh, 520px);
  opacity: .07;
  pointer-events: none;
  animation: sway 26s ease-in-out infinite alternate;
}}
@keyframes sway {{
  from {{ transform: rotate(-3deg) scale(1); }}
  to   {{ transform: rotate(3deg) scale(1.05); }}
}}

/* ---- Closing ----------------------------------------------------------- */
.closing {{ place-content: center; justify-items: center; text-align: center; }}
.closing-inner {{ max-width: 74ch; display: grid; justify-items: center; position: relative; z-index: 1; }}
.closing .eyebrow::before {{ display: none; }}
.stats {{
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 26px);
  margin: 34px 0 0;
  width: 100%;
}}
.stats div {{
  display: grid;
  gap: 6px;
  padding: 20px 14px;
  border: 1px solid var(--line);
  border-radius: var(--bloom);
  background: rgba(46, 163, 224, .06);
}}
.stats strong {{
  color: var(--sand-lit);
  font-size: clamp(1.4rem, 3vw, 2.2rem);
  font-weight: 600;
  unicode-bidi: isolate;
}}
.stats span {{ color: var(--muted); font-size: clamp(.75rem, 1vw, .88rem); font-weight: 300; }}
.closing-body {{
  margin: 30px 0 0;
  max-width: 62ch;
  color: var(--muted);
  font-size: clamp(.86rem, 1.15vw, 1rem);
  font-weight: 300;
  line-height: 1.9;
}}
.closing-logo {{ width: clamp(160px, 17vw, 230px); margin-top: 34px; opacity: .95; }}

/* ---- Chrome: rail, nav, progress --------------------------------------- */
.rail {{
  position: fixed;
  top: 0;
  inset-inline: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px clamp(20px, 4vw, 44px);
  pointer-events: none;
  z-index: 20;
}}
.rail img {{ height: clamp(26px, 3vw, 34px); width: auto; opacity: .92; }}
.rail .count {{ color: var(--muted); font-family: var(--mono); font-size: .8rem; letter-spacing: .06em; }}

.progress {{
  position: fixed;
  top: 0;
  inset-inline-start: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--sand), var(--sky));
  width: 0;
  transition: width .55s var(--ease);
  z-index: 30;
}}

.nav {{
  position: fixed;
  bottom: 20px;
  inset-inline: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  z-index: 20;
}}
.nav button {{
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: rgba(10, 26, 43, .75);
  color: var(--paper);
  font-size: 1.05rem;
  cursor: pointer;
  transition: border-color .2s ease, background .2s ease, transform .2s var(--ease);
}}
.nav button:hover:not(:disabled) {{ border-color: var(--sky); background: rgba(46, 163, 224, .18); transform: scale(1.08); }}
.nav button:disabled {{ opacity: .3; cursor: default; }}
.dotbar {{ display: flex; gap: 7px; }}
.dot {{
  width: 8px;
  height: 8px;
  padding: 0;
  border-radius: 50%;
  border: 0;
  background: rgba(168, 188, 204, .35);
  cursor: pointer;
  transition: background .3s ease, width .35s var(--ease);
}}
.dot.is-active {{ width: 26px; border-radius: 999px; background: var(--sand-lit); }}

:focus-visible {{ outline: 2px solid var(--sand-lit); outline-offset: 3px; }}

/* ---- Narrow screens: scrollable stack ---------------------------------- */
@media (max-width: 860px) {{
  body {{ overflow: auto; }}
  .deck {{ height: auto; }}
  .slide {{
    position: static;
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: none;
    min-height: 100dvh;
    border-bottom: 1px solid var(--line);
  }}
  .r, .points li, .steps-list li, .chips span, .stats div {{ opacity: 1; transform: none; animation: none !important; }}
  .split, .split.wide-shot, .col-shot.pair, .stats {{ grid-template-columns: minmax(0, 1fr); }}
  .nav, .progress {{ display: none; }}
  .rail {{ position: static; }}
}}

@media (prefers-reduced-motion: reduce) {{
  .slide {{ transition: opacity .25s ease; transform: none !important; }}
  .aura, .cover-mark, .live i {{ animation: none !important; }}
  .r, .points li, .steps-list li, .chips span, .stats div {{
    opacity: 1;
    transform: none;
    animation: none !important;
  }}
  .progress {{ transition: none; }}
}}
</style>

<div class="progress" id="progress"></div>
<header class="rail">
  <img src="{MARK}" alt="" />
  <span class="count mono" id="count">١ / {len(SLIDES)}</span>
</header>

<main class="deck" id="deck">
{"".join(SLIDES)}
</main>

<nav class="nav" aria-label="التنقل بين الشرائح">
  <button id="prev" aria-label="الشريحة السابقة">›</button>
  <span class="dotbar" id="dotbar">{DOTS}</span>
  <button id="next" aria-label="الشريحة التالية">‹</button>
</nav>

<script>
(function () {{
  var slides = [].slice.call(document.querySelectorAll('.slide'));
  var dots = [].slice.call(document.querySelectorAll('.dot'));
  var progress = document.getElementById('progress');
  var count = document.getElementById('count');
  var prev = document.getElementById('prev');
  var next = document.getElementById('next');
  var i = 0;
  var AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  var toAr = function (n) {{ return String(n).replace(/[0-9]/g, function (d) {{ return AR[+d]; }}); }};
  var narrow = window.matchMedia('(max-width: 860px)');

  /* Pick the encoding this browser can decode, and only attach it when the
     clip is actually needed so the deck opens fast. */
  var probe = document.createElement('video');
  var preferWebm = !!probe.canPlayType('video/webm; codecs="vp9"');
  function attach(v) {{
    if (v.src) {{ return; }}
    v.src = preferWebm ? v.dataset.webm : v.dataset.mp4;
    v.addEventListener('error', function () {{
      var alt = preferWebm ? v.dataset.mp4 : v.dataset.webm;
      if (v.src !== alt) {{ v.src = alt; v.play().catch(function () {{}}); }}
    }}, {{ once: true }});
  }}

  /* Videos are embedded but only loaded/played on the slide in view, so the
     deck opens fast and idle slides cost nothing. */
  function playFor(slide) {{
    slides.forEach(function (s) {{
      s.querySelectorAll('video').forEach(function (v) {{
        if (s === slide) {{
          attach(v);
          var p = v.play();
          if (p && p.catch) {{ p.catch(function () {{}}); }}
        }} else if (!v.paused) {{
          v.pause();
        }}
      }});
    }});
  }}

  function show(n) {{
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach(function (s, k) {{
      s.classList.toggle('is-active', k === i);
      s.classList.toggle('is-past', k < i);
    }});
    dots.forEach(function (d, k) {{ d.classList.toggle('is-active', k === i); }});
    progress.style.width = ((i + 1) / slides.length * 100) + '%';
    count.textContent = toAr(i + 1) + ' / ' + toAr(slides.length);
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
    playFor(slides[i]);
  }}

  next.addEventListener('click', function () {{ show(i + 1); }});
  prev.addEventListener('click', function () {{ show(i - 1); }});
  dots.forEach(function (d) {{
    d.addEventListener('click', function () {{ show(+d.dataset.go); }});
  }});

  document.addEventListener('keydown', function (e) {{
    /* RTL deck: ArrowLeft advances, ArrowRight goes back. */
    if (e.key === 'ArrowLeft' || e.key === 'PageDown' || e.key === ' ') {{ e.preventDefault(); show(i + 1); }}
    else if (e.key === 'ArrowRight' || e.key === 'PageUp') {{ e.preventDefault(); show(i - 1); }}
    else if (e.key === 'Home') {{ show(0); }}
    else if (e.key === 'End') {{ show(slides.length - 1); }}
  }});

  if (narrow.matches) {{
    /* Stacked view: load every clip and play whichever is on screen. */
    var io = new IntersectionObserver(function (entries) {{
      entries.forEach(function (en) {{
        var v = en.target;
        if (en.isIntersecting) {{
          attach(v);
          var p = v.play(); if (p && p.catch) {{ p.catch(function () {{}}); }}
        }} else {{ v.pause(); }}
      }});
    }}, {{ threshold: .35 }});
    document.querySelectorAll('video').forEach(function (v) {{ io.observe(v); }});
    slides.forEach(function (s) {{ s.classList.add('is-active'); }});
  }} else {{
    show(0);
  }}
}})();
</script>
"""

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(HTML, encoding="utf-8")
print("WROTE", OUT, f"{OUT.stat().st_size / 1024 / 1024:.2f} MB")
