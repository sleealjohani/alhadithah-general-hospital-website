#!/usr/bin/env python3
"""Builds the self-contained Arabic presentation deck.

Embeds the hospital logo and the real site captures as data URIs so the
published artifact needs no external assets (only Google Fonts, which the
Artifact CSP allows).

Usage: python3 scripts/build-deck.py
"""
import base64
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = pathlib.Path("/tmp/site-shots")
OUT = ROOT / "presentation" / "hadetha-portal-deck.html"


def data_uri(path: pathlib.Path) -> str:
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}[
        path.suffix.lstrip(".").lower()
    ]
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


IMG = {p.stem: data_uri(p) for p in sorted(SHOTS.glob("*.jpg"))}
LOGO = data_uri(ROOT / "public/assets/brand/hospital-logo-white.webp")
MARK = data_uri(ROOT / "public/assets/brand/brand-mark-white.webp")


def browser(src_key: str, url: str = "had-hos.vercel.app") -> str:
    """Desktop capture in a browser window frame."""
    return f"""<figure class="shot browser">
        <div class="chrome"><span class="dots"><i></i><i></i><i></i></span>
          <span class="url">{url}</span></div>
        <img src="{IMG[src_key]}" alt="" loading="lazy" />
      </figure>"""


def phone(src_key: str) -> str:
    """Mobile capture in a phone bezel."""
    return f"""<figure class="shot phone">
        <span class="notch" aria-hidden="true"></span>
        <img src="{IMG[src_key]}" alt="" loading="lazy" />
      </figure>"""


SLIDES = []

# ---- 1. Cover ------------------------------------------------------------
SLIDES.append(f"""<section class="slide cover" aria-label="الغلاف">
  <div class="cover-inner">
    <img class="cover-logo" src="{LOGO}" alt="مستشفى الحديثة العام" />
    <p class="eyebrow">تجمع الجوف الصحي</p>
    <h1>البوابة الرقمية<br /><span>لمستشفى الحديثة العام</span></h1>
    <p class="lede">واجهة رقمية واحدة تجمع الخدمات والمعلومات وحجز المواعيد،
      ويديرها فريق المستشفى بالكامل دون الحاجة إلى مبرمج.</p>
    <p class="cover-meta"><span class="mono">had-hos.vercel.app</span></p>
  </div>
  <img class="cover-mark" src="{MARK}" alt="" aria-hidden="true" />
</section>""")

# ---- 2. Why --------------------------------------------------------------
SLIDES.append(f"""<section class="slide split" aria-label="لماذا بوابة رقمية">
  <div class="col-text">
    <p class="eyebrow">لماذا بوابة رقمية؟</p>
    <h2>نقطة وصول واحدة للمراجع والموظف</h2>
    <ul class="points">
      <li><strong>مصدر رسمي واحد</strong><span>كل الخدمات والأدلة والأخبار في مكان واحد بدل تفرّقها.</span></li>
      <li><strong>خدمة ذاتية على مدار الساعة</strong><span>المراجع ينجز طلبه دون اتصال أو حضور مسبق.</span></li>
      <li><strong>تحديث فوري</strong><span>المحتوى يُدار من لوحة تحكم عربية دون تدخل تقني.</span></li>
      <li><strong>هوية موحّدة</strong><span>ألوان التجمع وشعار المستشفى في كل صفحة.</span></li>
    </ul>
  </div>
  <div class="col-shot">{browser("home-desktop", "had-hos.vercel.app")}</div>
</section>""")

# ---- 3. Responsive -------------------------------------------------------
SLIDES.append(f"""<section class="slide split" aria-label="تجربة على كل الأجهزة">
  <div class="col-text">
    <p class="eyebrow">التجربة</p>
    <h2>تجربة واحدة على الحاسب والجوال</h2>
    <p class="body">صُمّمت البوابة عربية أولًا مع دعم كامل للإنجليزية، وتتكيّف تلقائيًا
      مع مقاس الشاشة — فما يراه المراجع على جواله هو نفس المحتوى بترتيب يناسب يده.</p>
    <div class="chips">
      <span>عربي / English</span><span>تصميم متجاوب</span><span>الوضع الليلي</span><span>وصول ميسّر</span>
    </div>
  </div>
  <div class="col-shot pair">
    {browser("home-desktop")}
    {phone("home-mobile")}
  </div>
</section>""")

# ---- 4. Services ---------------------------------------------------------
SLIDES.append(f"""<section class="slide split" aria-label="الخدمات والمحتوى">
  <div class="col-text">
    <p class="eyebrow">المحتوى</p>
    <h2>خدمات وأقسام ومحتوى متجدّد</h2>
    <ul class="points compact">
      <li><strong>الخدمات والأقسام</strong><span>عرض منظّم لكل خدمة مع تفاصيلها وموقعها.</span></li>
      <li><strong>الأخبار والمبادرات</strong><span>نشر فوري لأنشطة المستشفى وحملاته.</span></li>
      <li><strong>مركز المعرفة</strong><span>أدلة وإرشادات صحية موثوقة للمراجعين.</span></li>
      <li><strong>الشؤون الأكاديمية والتدريب</strong><span>الدورات والتسجيل فيها وشهادات الحضور.</span></li>
    </ul>
  </div>
  <div class="col-shot pair">
    {browser("services-desktop", "had-hos.vercel.app/services")}
    {browser("training-desktop", "had-hos.vercel.app/training")}
  </div>
</section>""")

# ---- 5. Staff content ----------------------------------------------------
SLIDES.append(f"""<section class="slide split" aria-label="محتوى الكوادر">
  <div class="col-text">
    <p class="eyebrow">للكوادر</p>
    <h2>بوابة التمريض وتكريم المتميّزين</h2>
    <p class="body">قسم مخصّص لكادر التمريض: السياسات، خطط الإجازات، والملف المهني —
      إضافة إلى بطاقة «ممرض الشهر» التي تُدار من لوحة التحكم وتُحدَّث شهريًا.</p>
    <div class="chips">
      <span>دخول آمن بالرقم الوظيفي</span><span>سياسات التمريض</span><span>ممرض الشهر</span>
    </div>
  </div>
  <div class="col-shot pair">
    {browser("nursing-desktop", "had-hos.vercel.app/nursing")}
    {phone("nursing-mobile")}
  </div>
</section>""")

# ---- 6. Appointments: intro ---------------------------------------------
SLIDES.append(f"""<section class="slide split feature" aria-label="حجز المواعيد">
  <div class="col-text">
    <p class="eyebrow gold">الميزة الجديدة</p>
    <h2>حجز موعد في العيادات<br /><span class="gold">إلكترونيًا وبدون اتصال</span></h2>
    <p class="body">بطاقة مباشرة في الصفحة الرئيسية تنقل المراجع إلى صفحة الحجز.
      يختار العيادة والوقت المناسب ويرسل طلبه في أقل من دقيقة، في أي وقت وبدون
      انتظار على الهاتف.</p>
    <ul class="points compact">
      <li><strong>متاح ٢٤ ساعة</strong><span>الطلب يُرسل في أي وقت، ويراجعه قسم التسجيل في الدوام.</span></li>
      <li><strong>مواعيد حقيقية</strong><span>الأوقات المعروضة مبنية على جدول كل عيادة فعليًا.</span></li>
    </ul>
  </div>
  <div class="col-shot">{browser("home-appt-card")}</div>
</section>""")

# ---- 7. Appointments: steps ---------------------------------------------
SLIDES.append(f"""<section class="slide steps feature" aria-label="خطوات الحجز">
  <header class="steps-head">
    <p class="eyebrow gold">الميزة الجديدة · خطوات الحجز</p>
    <h2>ثلاث خطوات فقط لإتمام الطلب</h2>
  </header>
  <div class="steps-grid">
    <article><span class="step-no mono">١</span><h3>اختيار العيادة</h3>
      {browser("appt-clinics", "had-hos.vercel.app/appointments")}
      <p>ست عيادات وأكثر، تُضاف وتُعدّل من لوحة التحكم.</p></article>
    <article><span class="step-no mono">٢</span><h3>التاريخ والوقت</h3>
      {browser("appt-slots", "had-hos.vercel.app/appointments")}
      <p>أيام عمل العيادة فقط، والأوقات المكتملة تظهر غير متاحة.</p></article>
    <article><span class="step-no mono">٣</span><h3>بيانات المريض</h3>
      {browser("appt-form", "had-hos.vercel.app/appointments")}
      <p>الاسم والهوية والجوال وتاريخ الميلاد ميلادي أو هجري.</p></article>
  </div>
</section>""")

# ---- 8. Appointments: reference + tracking ------------------------------
SLIDES.append(f"""<section class="slide split feature" aria-label="رقم الطلب والمتابعة">
  <div class="col-text">
    <p class="eyebrow gold">الميزة الجديدة · بعد الإرسال</p>
    <h2>رقم طلب فريد ومتابعة ذاتية</h2>
    <p class="body">بمجرد الإرسال يحصل المراجع على رقم طلب فريد ورسالة تأكيد،
      ويستطيع لاحقًا متابعة حالة طلبه بثلاث طرق.</p>
    <p class="ref-chip mono">HGH-260821-3947</p>
    <ul class="points compact">
      <li><strong>متابعة بثلاث طرق</strong><span>رقم الطلب أو رقم الهوية أو رقم الجوال.</span></li>
      <li><strong>تعديل أو إلغاء ذاتي</strong><span>دون الحاجة للاتصال بالمستشفى.</span></li>
      <li><strong>ملاحظات وتعليمات</strong><span>يكتبها قسم التسجيل وتظهر للمراجع مع موعده.</span></li>
    </ul>
  </div>
  <div class="col-shot pair">
    {browser("appt-success", "had-hos.vercel.app/appointments")}
    {browser("appt-track", "had-hos.vercel.app/appointments")}
  </div>
</section>""")

# ---- 9. Impact / close ---------------------------------------------------
SLIDES.append(f"""<section class="slide closing" aria-label="الخلاصة">
  <div class="closing-inner">
    <p class="eyebrow gold">الخلاصة</p>
    <h2>من صفحة تعريفية إلى بوابة خدمات</h2>
    <div class="stats">
      <div><strong class="mono">٢٤/٧</strong><span>استقبال طلبات المواعيد</span></div>
      <div><strong class="mono">٣</strong><span>طرق لمتابعة الطلب</span></div>
      <div><strong class="mono">٦</strong><span>عيادات قابلة للتوسعة</span></div>
      <div><strong class="mono">١٠٠٪</strong><span>إدارة ذاتية من اللوحة</span></div>
    </div>
    <p class="closing-body">كل ما سبق يُدار من لوحة تحكم عربية: المحتوى والعيادات وأوقاتها،
      وطلبات المواعيد في قسم «التسجيل والمواعيد» مع إمكانية التصدير إلى Excel
      وتحديث الحالة وكتابة الملاحظات.</p>
    <img class="closing-logo" src="{LOGO}" alt="مستشفى الحديثة العام" />
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
  --ink-3: #123f5c;
  --sky: #2ea3e0;
  --sky-lit: #78c5ee;
  --sand: #c89a4c;
  --sand-lit: #eacb93;
  --paper: #eef3f8;
  --muted: #a8bccc;
  --line: rgba(120, 197, 238, .20);
  --bloom: 24px 8px 8px 8px;
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
  padding: clamp(28px, 4vw, 64px) clamp(28px, 5vw, 88px);
  opacity: 0;
  visibility: hidden;
  transform: translateY(18px);
  transition: opacity .5s ease, transform .5s cubic-bezier(.22, 1, .36, 1), visibility .5s;
  background:
    radial-gradient(90% 70% at 88% -10%, rgba(46, 163, 224, .16), transparent 60%),
    radial-gradient(70% 60% at 6% 100%, rgba(200, 154, 76, .10), transparent 62%),
    linear-gradient(180deg, var(--ink-2), var(--ink));
}}
.slide.is-active {{ opacity: 1; visibility: visible; transform: none; }}

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

h1 {{
  margin: 14px 0 0;
  font-size: clamp(2.1rem, 5.4vw, 4.1rem);
  font-weight: 700;
  line-height: 1.22;
  text-wrap: balance;
}}
h1 span {{ color: var(--sky-lit); }}
h2 {{
  margin: 12px 0 0;
  font-size: clamp(1.5rem, 3.1vw, 2.5rem);
  font-weight: 700;
  line-height: 1.3;
  text-wrap: balance;
}}
h2 .gold {{ color: var(--sand-lit); }}
h3 {{ margin: 0; font-size: clamp(1rem, 1.5vw, 1.2rem); font-weight: 600; }}
.lede {{
  margin: 18px 0 0;
  max-width: 46ch;
  color: var(--muted);
  font-size: clamp(.98rem, 1.5vw, 1.2rem);
  font-weight: 300;
  line-height: 1.85;
}}
.body {{
  margin: 16px 0 0;
  max-width: 44ch;
  color: var(--muted);
  font-size: clamp(.92rem, 1.25vw, 1.05rem);
  font-weight: 300;
  line-height: 1.9;
}}
.mono {{ font-family: var(--mono); font-variant-numeric: tabular-nums; }}

/* ---- Layouts ----------------------------------------------------------- */
.split {{
  grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr);
  align-items: center;
  gap: clamp(26px, 4vw, 62px);
}}
.col-text {{ min-width: 0; }}
.col-shot {{ min-width: 0; display: grid; gap: 18px; }}
.col-shot.pair {{ grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }}

.points {{
  list-style: none;
  margin: 22px 0 0;
  padding: 0;
  display: grid;
  gap: 15px;
}}
.points.compact {{ gap: 12px; }}
.points li {{
  display: grid;
  gap: 3px;
  padding-inline-start: 16px;
  border-inline-start: 2px solid var(--line);
}}
.points strong {{ font-size: clamp(.95rem, 1.3vw, 1.08rem); font-weight: 600; }}
.points span {{
  color: var(--muted);
  font-size: clamp(.84rem, 1.1vw, .96rem);
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
  font-size: clamp(1rem, 1.7vw, 1.35rem);
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
.browser img {{ display: block; width: 100%; height: auto; }}

.phone {{
  position: relative;
  justify-self: center;
  width: min(100%, 240px);
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
.phone img {{ display: block; width: 100%; height: auto; border-radius: 20px; }}

/* ---- Cover ------------------------------------------------------------- */
.cover {{ place-content: center; justify-items: start; }}
.cover-inner {{ max-width: 74ch; position: relative; z-index: 1; }}
.cover-logo {{ width: clamp(200px, 24vw, 310px); height: auto; margin-bottom: 30px; }}
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
}}

/* ---- Steps slide ------------------------------------------------------- */
.steps {{ align-content: center; gap: 22px; }}
.steps-head {{ text-align: center; }}
.steps-head .eyebrow::before {{ display: none; }}
.steps-head h2 {{ margin-top: 8px; }}
.steps-grid {{
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(16px, 2.2vw, 30px);
}}
.steps-grid article {{ display: grid; gap: 10px; align-content: start; }}
.step-no {{
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
.steps-grid .browser img {{ aspect-ratio: 16 / 9; object-fit: cover; object-position: top center; }}
/* Paired desktop captures: trim the page footer so the UI fills more of the frame. */
.col-shot.pair .browser img {{ aspect-ratio: 16 / 9; object-fit: cover; object-position: top center; }}
.steps-grid p {{
  margin: 0;
  color: var(--muted);
  font-size: clamp(.78rem, 1vw, .9rem);
  font-weight: 300;
  line-height: 1.7;
}}

/* ---- Closing ----------------------------------------------------------- */
.closing {{ place-content: center; justify-items: center; text-align: center; }}
.closing-inner {{ max-width: 74ch; display: grid; justify-items: center; }}
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
  font-size: clamp(.88rem, 1.2vw, 1.02rem);
  font-weight: 300;
  line-height: 1.9;
}}
.closing-logo {{ width: clamp(170px, 18vw, 240px); margin-top: 38px; opacity: .95; }}

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
  transition: width .45s cubic-bezier(.22, 1, .36, 1);
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
  transition: border-color .2s ease, background .2s ease;
}}
.nav button:hover {{ border-color: var(--sky); background: rgba(46, 163, 224, .18); }}
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
  transition: background .25s ease, width .25s ease;
}}
.dot.is-active {{ width: 24px; border-radius: 999px; background: var(--sand-lit); }}

:focus-visible {{ outline: 2px solid var(--sand-lit); outline-offset: 3px; }}

/* ---- Narrow screens: scrollable stack ---------------------------------- */
@media (max-width: 860px) {{
  body {{ overflow: auto; }}
  .deck {{ height: auto; }}
  .slide {{
    position: static;
    opacity: 1;
    visibility: visible;
    transform: none;
    min-height: 100dvh;
    border-bottom: 1px solid var(--line);
  }}
  .split, .col-shot.pair, .steps-grid, .stats {{ grid-template-columns: minmax(0, 1fr); }}
  .nav, .progress {{ display: none; }}
  .rail {{ position: static; }}
}}

@media (prefers-reduced-motion: reduce) {{
  .slide {{ transition: opacity .2s ease; transform: none; }}
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
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.dot'));
  var progress = document.getElementById('progress');
  var count = document.getElementById('count');
  var prev = document.getElementById('prev');
  var next = document.getElementById('next');
  var i = 0;
  var AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  var toAr = function (n) {{ return String(n).replace(/[0-9]/g, function (d) {{ return AR[+d]; }}); }};

  function show(n) {{
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach(function (s, k) {{ s.classList.toggle('is-active', k === i); }});
    dots.forEach(function (d, k) {{ d.classList.toggle('is-active', k === i); }});
    progress.style.width = ((i + 1) / slides.length * 100) + '%';
    count.textContent = toAr(i + 1) + ' / ' + toAr(slides.length);
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
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

  show(0);
}})();
</script>
"""

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(HTML, encoding="utf-8")
print("WROTE", OUT, f"{OUT.stat().st_size / 1024 / 1024:.2f} MB")
