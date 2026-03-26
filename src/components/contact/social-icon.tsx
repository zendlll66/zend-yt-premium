import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  Mail,
  Phone,
  MessageCircle,
  Send,
  ShoppingBag,
  ShoppingCart,
  Link,
  Music,
  Hash,
  PhoneCall,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  line: MessageCircle,
  youtube: Youtube,
  tiktok: Music,
  twitter: Twitter,
  discord: Hash,
  telegram: Send,
  whatsapp: PhoneCall,
  website: Globe,
  email: Mail,
  phone: Phone,
  shopee: ShoppingBag,
  lazada: ShoppingCart,
  other: Link,
};

export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const Icon = iconMap[platform] ?? Link;
  return <Icon className={className} />;
}
