import { useState } from "react";
import { QrCode } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { createQrDataUrl } from "../../lib/exports";
import { tx } from "../../utils/i18n";

export function AdminTools() {
  const { t, notify } = usePortal();
  const [value, setValue] = useState("");
  const [qr, setQr] = useState("");

  const generate = async () => {
    if (!value.trim()) return;
    setQr(await createQrDataUrl(value.trim()));
    notify(t(tx("تم توليد QR.", "QR generated.")), "success");
  };

  return (
    <div className="admin-page">
      <SectionHeading
        title={tx("QR والتصدير", "QR & Export")}
        description={tx(
          "أدوات مساعدة لإعداد الروابط والتقارير الخفيفة من المتصفح.",
          "Helper tools for links and lightweight browser-side reports."
        )}
      />
      <div className="admin-panel tools-grid">
        <div>
          <h2>{t(tx("توليد QR", "Generate QR"))}</h2>
          <label>
            {t(tx("الرابط أو النص", "URL or text"))}
            <input value={value} onChange={(event) => setValue(event.target.value)} />
          </label>
          <button className="btn btn-primary" onClick={generate}>
            <QrCode size={18} />
            {t(tx("توليد", "Generate"))}
          </button>
        </div>
        <div className="qr-preview">
          {qr ? <img src={qr} alt={t(tx("رمز QR", "QR code"))} /> : <QrCode size={96} />}
        </div>
      </div>
    </div>
  );
}
