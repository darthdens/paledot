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
  return (
    <section id="contact" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-left md:text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Let's Connect
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl md:mx-auto">
              Have a project in mind or just want to chat? I'd love to hear from you.
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="font-serif text-2xl font-bold mb-4 text-center">Get in Touch</h3>
              <p className="text-muted-foreground leading-relaxed mb-6 text-center">
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

            <div className="text-center">
              <h4 className="font-medium mb-4">Find me on</h4>
              <div className="flex flex-wrap justify-center gap-3">
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
        </div>
      </div>
    </section>
  );
};
