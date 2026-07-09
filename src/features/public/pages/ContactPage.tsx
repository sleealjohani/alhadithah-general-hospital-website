import { PageHero } from "../../../components/ui/PageHero";
import { PublicForm } from "../components/PublicForm";
import { tx } from "../../../utils/i18n";

export function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow={tx("تواصل معنا", "Contact Us")}
        title={tx("نموذج تواصل بدون بيانات عامة مزيفة", "Contact Form Without Fake Public Data")}
        description={tx(
          "يستقبل النموذج الرسائل العامة. معلومات الهاتف والبريد لا تظهر حتى تعتمد من الإعدادات.",
          "The form accepts general messages. Phone and email details stay hidden until approved in settings."
        )}
      />
      <section className="section">
        <div className="container split-layout">
          <article className="rich-panel">
            <h2>بيانات التواصل الرسمية</h2>
            <p>
              لم يتم إدخال بيانات تواصل معتمدة بعد. عند توفرها، يستطيع المسؤول إضافتها من
              إعدادات الموقع وتفعيل عرضها للعامة.
            </p>
          </article>
          <PublicForm kind="contact" title={tx("إرسال رسالة", "Send a Message")} />
        </div>
      </section>
    </>
  );
}
