import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Calendar } from "iconoir-react";
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
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Contact from ${formData.name}`);
    const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`);
    window.location.href = `mailto:denis.akoka@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-left md:text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Let's Connect
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl md:mx-auto">
              Have a project in mind or just want to chat? I'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-2xl font-bold mb-4">Get in Touch</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  I'm currently available for freelance work and exciting collaborations. Whether you need a website, brand identity, or product strategy, let's talk about how I can help.
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
                      Email Me
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
                      Book a Call
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Schedule a 30-min chat
                    </div>
                  </div>
                </a>
              </div>

              <div>
                <h4 className="font-medium mb-4">Find me on</h4>
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
                  Your Name
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                  className="bg-card"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                  className="bg-card"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell me about your project..."
                  rows={5}
                  required
                  className="bg-card resize-none"
                />
              </div>
              <Button type="submit" variant="secondary" size="lg" className="w-full">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
