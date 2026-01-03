import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Calendar } from "iconoir-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { 
  EchoIcon, 
  LinkedInIcon, 
  XIcon, 
  WhatsAppIcon, 
  TelegramIcon, 
  InstagramIcon, 
  FacebookIcon 
} from "@/components/SocialIcons";

const socialLinks = [
  { Icon: EchoIcon, label: "Echo", href: "https://echoai.so/e/dens" },
  { Icon: WhatsAppIcon, label: "WhatsApp", href: "https://api.whatsapp.com/send/?phone=447552800685&text&type=phone_number&app_absent=0" },
  { Icon: TelegramIcon, label: "Telegram", href: "https://t.me/densakoka" },
  { Icon: LinkedInIcon, label: "LinkedIn", href: "https://www.linkedin.com/in/denisakoka/" },
  { Icon: XIcon, label: "X", href: "https://x.com/densweb3" },
  { Icon: InstagramIcon, label: "Instagram", href: "https://www.instagram.com/densakoka/" },
  { Icon: FacebookIcon, label: "Facebook", href: "https://www.facebook.com/densgpt/" },
];

export const Contact = () => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save to database
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
        });

      if (error) throw error;

      // Send email notification (await so failures are visible)
      const { error: notifyError } = await supabase.functions.invoke(
        "send-contact-notification",
        {
          body: {
            name: formData.name.trim(),
            email: formData.email.trim(),
            message: formData.message.trim(),
          },
        }
      );

      if (notifyError) throw notifyError;

      toast.success(t.contact.toast.success, {
        description: t.contact.toast.successDesc,
      });
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(t.contact.toast.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-left md:text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              {t.contact.title}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl md:mx-auto">
              {t.contact.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-2xl font-bold mb-4">{t.contact.getInTouch}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {t.contact.description}
                </p>
              </div>

              <div className="space-y-4">
                <a
                  href="mailto:denis.akoka@gmail.com"
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-accent/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Mail className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-medium group-hover:text-accent transition-colors">
                      {t.contact.emailMe}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      denis.akoka@gmail.com
                    </div>
                  </div>
                </a>

                <a
                  href="https://calendly.com/densakoka/new-meeting"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-accent/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Calendar className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-medium group-hover:text-accent transition-colors">
                      {t.contact.bookCall}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t.contact.scheduleChat}
                    </div>
                  </div>
                </a>
              </div>

              <div>
                <h4 className="font-medium mb-4">{t.contact.findMeOn}</h4>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center hover:border-accent/50 hover:text-accent transition-all group"
                      aria-label={social.label}
                    >
                      <social.Icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  {t.contact.form.yourName}
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t.contact.form.namePlaceholder}
                  required
                  className="bg-card"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  {t.contact.form.emailAddress}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t.contact.form.emailPlaceholder}
                  required
                  className="bg-card"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  {t.contact.form.message}
                </label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t.contact.form.messagePlaceholder}
                  rows={5}
                  required
                  className="bg-card resize-none text-base"
                />
              </div>
              <Button type="submit" variant="secondary" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t.contact.form.sending : t.contact.form.send}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
