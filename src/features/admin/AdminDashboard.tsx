import { CheckCircle2 } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { Icon } from "../../components/ui/Icon";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { supabase } from "../../lib/supabase/client";
import { contentTables, importantLinks } from "../../data/content";
import { tx } from "../../utils/i18n";

export function AdminDashboard() {
  const { t } = usePortal();
  const metricCards = [
    { label: tx("جداول المحتوى", "Content tables"), value: contentTables.length, icon: "TableProperties" },
    { label: tx("نماذج عامة", "Public forms"), value: 4, icon: "Send" },
    { label: tx("روابط بدون اعتماد", "Pending official links"), value: importantLinks.length, icon: "ExternalLink" },
    { label: tx("مصدر البيانات", "Data source"), value: supabase ? "Supabase" : "Local", icon: "ShieldCheck" }
  ];

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("لوحة المؤشرات", "Dashboard")}
        description={tx(
          "نظرة تشغيلية على حالة البوابة والإعدادات الأساسية.",
          "An operational snapshot of portal status and core setup."
        )}
      />
      <div className="admin-metrics">
        {metricCards.map((metric) => (
          <article className="admin-metric" key={metric.label.en}>
            <Icon name={metric.icon} />
            <span>{t(metric.label)}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>
      <div className="admin-panel">
        <h2>{t(tx("قائمة قبول سريعة", "Quick Acceptance Checklist"))}</h2>
        <ul className="check-list">
          <li><CheckCircle2 /> {t(tx("عربي وإنجليزي مع RTL/LTR", "Arabic and English with RTL/LTR"))}</li>
          <li><CheckCircle2 /> {t(tx("وضع ليلي ونهاري وتباين أعلى", "Light, dark, and high contrast modes"))}</li>
          <li><CheckCircle2 /> {t(tx("Supabase Auth بدون كلمات مرور مدمجة", "Supabase Auth without embedded passwords"))}</li>
          <li><CheckCircle2 /> {t(tx("نماذج تحفظ في Supabase أو محليًا للمعاينة", "Forms save to Supabase or local preview"))}</li>
        </ul>
      </div>
    </div>
  );
}
