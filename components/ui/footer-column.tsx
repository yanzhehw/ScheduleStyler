import {
  Facebook,
  Github,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const data = {
  facebookLink: 'https://facebook.com/schedulestyler',
  instaLink: 'https://instagram.com/schedulestyler',
  twitterLink: 'https://twitter.com/schedulestyler',
  githubLink: 'https://github.com/yanzhehw/ScheduleStyler',
  about: {
    team: '/meet-the-team',
    community: '/community',
    about: '/about',
  },
  help: {
    faqs: '/faqs',
    support: '/support',
    blog: '/blog',
  },
  contact: {
    email: 'notYetSetup@schedulestyler.com',
    phone: '+1 416-555-0123',
    address: 'Looking for cheap rental apartment in Toronto.',
  },
  company: {
    name: 'ScheduleStyler',
    description:
      'Your time is precious, and so is how you share it. We make it effortless to transform messy calendars into polished, professional visuals in seconds.',
    logo: '../../assets/FavIcon_WhiteLine.webp',
  },
};

const socialLinks = [
  { icon: Facebook, label: 'Facebook', href: data.facebookLink },
  { icon: Instagram, label: 'Instagram', href: data.instaLink },
  { icon: Twitter, label: 'Twitter', href: data.twitterLink },
  { icon: Github, label: 'GitHub', href: data.githubLink },
];

const aboutLinks = [
  { text: 'About', href: data.about.about },
  { text: 'Meet the Team', href: data.about.team },
  { text: 'Community', href: data.about.community },
];

const helpfulLinks = [
  { text: 'FAQs', href: data.help.faqs },
  { text: 'Support', href: data.help.support },
  { text: 'Blog', href: data.help.blog },
];

const contactInfo = [
  { icon: Mail, text: data.contact.email, breakAll: true },
  { icon: Phone, text: data.contact.phone },
  { icon: MapPin, text: data.contact.address, isAddress: true },
];

export default function Footer4Col() {
  return (
    <footer className="bg-secondary dark:bg-secondary/20 mt-16 w-full place-self-end rounded-t-xl">
      <div className="mx-auto max-w-screen-xl px-4 pt-16 pb-6 sm:px-6 lg:px-8 lg:pt-24">
        <div className="grid grid-cols-3 gap-4 lg:grid-cols-[3fr_1fr_1fr_1fr] lg:gap-8">
          <div className="col-span-3 lg:col-span-1 lg:mr-5">
            <div className="text-primary flex justify-center gap-2 sm:justify-start">
              <img
                src={data.company.logo || '/placeholder.svg'}
                alt="logo"
                className="h-8 w-8 "
              />
              <span className="text-xl sm:text-2xl font-semibold">
                {data.company.name}
              </span>
            </div>

            <p className="text-foreground/50 mt-6 max-w-md text-center text-sm leading-relaxed sm:max-w-xs sm:text-left sm:text-base">
              {data.company.description}
            </p>

            <ul className="mt-8 flex justify-center gap-6 sm:justify-start md:gap-8">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="text-primary hover:text-primary/80 transition"
                  >
                    <span className="sr-only">{label}</span>
                    <Icon className="size-6" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <p className="text-base sm:text-lg font-medium">About Us</p>
            <ul className="mt-8 space-y-4 text-xs sm:text-sm">
              {aboutLinks.map(({ text, href }) => (
                <li key={text}>
                  <a
                    className="text-secondary-foreground/70 transition"
                    href={href}
                  >
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <p className="text-base sm:text-lg font-medium">Helpful Links</p>
            <ul className="mt-8 space-y-4 text-xs sm:text-sm">
              {helpfulLinks.map(({ text, href}) => (
                <li key={text}>
                  <a
                    href={href}
                  >
                    <span className="text-secondary-foreground/70 transition">
                      {text}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <p className="text-base sm:text-lg font-medium">Contact Us</p>
            <ul className="mt-8 space-y-4 text-xs sm:text-sm">
              {contactInfo.map(({ icon: Icon, text, isAddress, breakAll }) => (
                <li key={text}>
                  <div
                    className="flex items-start justify-center gap-1.5 sm:justify-start"
                  >
                    <Icon className="text-primary size-5 shrink-0 shadow-sm" />
                    {isAddress ? (
                      <address className="text-secondary-foreground/70 -mt-0.5 flex-1 min-w-0 break-words not-italic">
                        {text}
                      </address>
                    ) : (
                      <span
                        className={`text-secondary-foreground/70 flex-1 min-w-0 break-words ${breakAll ? 'break-all' : ''}`}
                      >
                        {text}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-6">
          <div className="text-center sm:flex sm:justify-between sm:text-left">
            <p className="text-xs sm:text-sm">
              <span className="block sm:inline">All rights reserved.</span>
            </p>

            <p className="text-secondary-foreground/70 mt-4 text-xs sm:text-sm transition sm:order-first sm:mt-0">
              &copy; {new Date().getFullYear()} {data.company.name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
