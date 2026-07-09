import { usePortal } from "../../providers/PortalProvider";
import { tx } from "../../utils/i18n";

export function AccessibilityPanel() {
  const { t, fontScale, setFontScale, reduceMotion, setReduceMotion } = usePortal();
  return (
    <aside className="accessibility-panel" aria-label={t(tx("خيارات الوصول", "Accessibility options"))}>
      <button onClick={() => setFontScale(fontScale + 0.04)}>{t(tx("تكبير", "A+"))}</button>
      <button onClick={() => setFontScale(fontScale - 0.04)}>{t(tx("تصغير", "A-"))}</button>
      <button onClick={() => setReduceMotion(!reduceMotion)}>
        {reduceMotion ? t(tx("الحركة موقفة", "Motion off")) : t(tx("إيقاف الحركة", "Reduce motion"))}
      </button>
    </aside>
  );
}
