import { Globe, ColorPicker, Megaphone, ViewGrid, Group, Brain } from "iconoir-react";

const services = [
  {
    Icon: Globe,
    title: "Website Design & Development",
    description: "Beautiful, responsive websites built with modern technologies. From landing pages to complex web applications.",
  },
  {
    Icon: ColorPicker,
    title: "Graphic & Brand Design",
    description: "Complete brand identities including logos, color palettes, typography, and brand guidelines.",
  },
  {
    Icon: Megaphone,
    title: "Social Media & Marketing",
    description: "Strategic content creation, community management, and marketing campaigns that drive engagement.",
  },
  {
    Icon: ViewGrid,
    title: "Product Management",
    description: "End-to-end product strategy, roadmap planning, and execution for digital products.",
  },
  {
    Icon: Group,
    title: "Account Management",
    description: "Client relationship management, project coordination, and stakeholder communication.",
  },
  {
    Icon: Brain,
    title: "AI Assistant Implementation",
    description: "Custom AI solutions including chatbots, digital twins, and automation tools for your business.",
  },
];

export const Services = () => {
  return (
    <section id="services" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-left md:text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            What I Do
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl md:mx-auto">
            I'm available for freelance remote work in UK, EU, and US timezones.
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
