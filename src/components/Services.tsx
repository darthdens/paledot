import { DesignPencil, Code, ColorPicker, Megaphone, ViewGrid, Brain } from "iconoir-react";
import { useLanguage } from "@/i18n/LanguageContext";

export const Services = () => {
  const { t } = useLanguage();

  const services = [
    {
      Icon: DesignPencil,
      title: t.services.items.appDesign.title,
      description: t.services.items.appDesign.description,
    },
    {
      Icon: Code,
      title: t.services.items.appDev.title,
      description: t.services.items.appDev.description,
    },
    {
      Icon: ColorPicker,
      title: t.services.items.branding.title,
      description: t.services.items.branding.description,
    },
    {
      Icon: Megaphone,
      title: t.services.items.marketing.title,
      description: t.services.items.marketing.description,
    },
    {
      Icon: ViewGrid,
      title: t.services.items.product.title,
      description: t.services.items.product.description,
    },
    {
      Icon: Brain,
      title: t.services.items.ai.title,
      description: t.services.items.ai.description,
    },
  ];

  return (
    <section id="services" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-left md:text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            {t.services.title}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl md:mx-auto">
            {t.services.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="p-8 rounded-2xl bg-card/70 backdrop-blur-md border border-border relative z-10"
            >
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-muted">
                  <service.Icon className="w-6 h-6 text-muted-foreground" strokeWidth={2} />
                </div>
              </div>
              <h3 className="font-serif text-xl font-bold mb-3">
                {service.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
