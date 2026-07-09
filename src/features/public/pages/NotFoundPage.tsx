import { Link } from "react-router-dom";
import { PublicLayout } from "../../../components/layout/PublicLayout";
import { PageHero } from "../../../components/ui/PageHero";
import { tx } from "../../../utils/i18n";

export function NotFoundContent() {
  return (
    <PageHero
      eyebrow={tx("404", "404")}
      title={tx("الصفحة غير موجودة", "Page Not Found")}
      description={tx("الرابط غير صحيح أو تم نقله.", "The link is invalid or has moved.")}
      actions={<Link className="btn btn-primary" to="/">العودة للرئيسية</Link>}
    />
  );
}

export function NotFoundPage() {
  return (
    <PublicLayout>
      <NotFoundContent />
    </PublicLayout>
  );
}
