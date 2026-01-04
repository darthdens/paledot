import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/i18n/LanguageContext";
import { useEffect } from "react";

const Privacy = () => {
  const { language, t } = useLanguage();

  useEffect(() => {
    document.title = language === "fr" ? "Politique de Confidentialité | Dens" : "Privacy Policy | Dens";
  }, [language]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24 pb-16">
        <article className="container mx-auto px-6 max-w-4xl">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t.privacy.title}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t.privacy.effectiveDate}: 01/01/2025
          </p>

          <div className="prose prose-lg max-w-none text-muted-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground [&_a]:text-foreground [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-70 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:list-outside [&_ol]:list-outside [&_li]:list-item [&_li]:marker:text-muted-foreground [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:pl-6 [&_ol]:pl-6 [&_p]:mb-5">
            <p>{t.privacy.intro}</p>

            <h2>1. {t.privacy.sections.infoCollect.title}</h2>
            <p>{t.privacy.sections.infoCollect.intro}</p>
            <ul>
              <li><strong>{t.privacy.sections.infoCollect.personal.title}:</strong> {t.privacy.sections.infoCollect.personal.content}</li>
              <li><strong>{t.privacy.sections.infoCollect.technical.title}:</strong> {t.privacy.sections.infoCollect.technical.content}</li>
              <li><strong>{t.privacy.sections.infoCollect.communication.title}:</strong> {t.privacy.sections.infoCollect.communication.content}</li>
            </ul>

            <h2>2. {t.privacy.sections.howUse.title}</h2>
            <p>{t.privacy.sections.howUse.intro}</p>
            <ul>
              <li>{t.privacy.sections.howUse.items.respond}</li>
              <li>{t.privacy.sections.howUse.items.improve}</li>
              <li>{t.privacy.sections.howUse.items.communicate}</li>
            </ul>

            <h2>3. {t.privacy.sections.cookies.title}</h2>
            <p>{t.privacy.sections.cookies.content}</p>
            <p>{t.privacy.sections.cookies.optOut}</p>

            <h2>4. {t.privacy.sections.sharing.title}</h2>
            <p>{t.privacy.sections.sharing.content}</p>

            <h2>5. {t.privacy.sections.security.title}</h2>
            <p>{t.privacy.sections.security.content}</p>

            <h2>6. {t.privacy.sections.gdpr.title}</h2>
            <p>{t.privacy.sections.gdpr.intro}</p>
            <ul>
              <li><strong>{t.privacy.sections.gdpr.rights.access.title}:</strong> {t.privacy.sections.gdpr.rights.access.content}</li>
              <li><strong>{t.privacy.sections.gdpr.rights.rectification.title}:</strong> {t.privacy.sections.gdpr.rights.rectification.content}</li>
              <li><strong>{t.privacy.sections.gdpr.rights.erasure.title}:</strong> {t.privacy.sections.gdpr.rights.erasure.content}</li>
              <li><strong>{t.privacy.sections.gdpr.rights.restrict.title}:</strong> {t.privacy.sections.gdpr.rights.restrict.content}</li>
              <li><strong>{t.privacy.sections.gdpr.rights.portability.title}:</strong> {t.privacy.sections.gdpr.rights.portability.content}</li>
              <li><strong>{t.privacy.sections.gdpr.rights.object.title}:</strong> {t.privacy.sections.gdpr.rights.object.content}</li>
              <li><strong>{t.privacy.sections.gdpr.rights.withdraw.title}:</strong> {t.privacy.sections.gdpr.rights.withdraw.content}</li>
            </ul>
            <p>{t.privacy.sections.gdpr.contact}</p>

            <h2>7. {t.privacy.sections.retention.title}</h2>
            <p>{t.privacy.sections.retention.content}</p>

            <h2>8. {t.privacy.sections.international.title}</h2>
            <p>{t.privacy.sections.international.content}</p>

            <h2>9. {t.privacy.sections.thirdParty.title}</h2>
            <p>{t.privacy.sections.thirdParty.content}</p>

            <h2>10. {t.privacy.sections.children.title}</h2>
            <p>{t.privacy.sections.children.content}</p>

            <h2>11. {t.privacy.sections.changes.title}</h2>
            <p>{t.privacy.sections.changes.content}</p>

            <h2>12. {t.privacy.sections.contactInfo.title}</h2>
            <p>{t.privacy.sections.contactInfo.intro}</p>
            <p>
              <strong>Dens Akoka</strong><br />
              Email: <a href="mailto:dens.akoka@icloud.com">dens.akoka@icloud.com</a><br />
              {t.privacy.sections.contactInfo.address}: Dundee, Scotland, United Kingdom
            </p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;