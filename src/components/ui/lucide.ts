/**
 * Centralised lucide-react icon barrel.
 *
 * All NEW components should import icons from here rather than re-writing
 * inline `<svg>` blocks. The 283 existing inline SVGs are intentionally NOT
 * migrated in this pass — infrastructure first, codemod later.
 *
 * Why a dedicated barrel?
 * - Single audit surface for "which glyphs do we actually ship".
 * - Easy swap if we ever replace lucide-react with another lib.
 * - Tree-shakeable re-exports (lucide-react is ESM-first).
 *
 * NOTE: This file is named `lucide.ts` (not `icons.ts`) to avoid a
 * case-insensitive filesystem collision with the legacy `Icons.tsx`
 * export barrel that still powers the bulk of the app.
 *
 * Brand-specific glyphs (the ☾ moon logo, mode illustrations) stay in
 * `src/components/icons/` and must not be added here.
 */

export {
  // Navigation / structural
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  X,
  Menu,
  MoreHorizontal,
  MoreVertical,

  // Core product surfaces
  Heart,
  Star,
  MapPin,
  Calendar,
  Clock,
  Users,
  User,
  UserPlus,
  MessageCircle,
  Send,
  Bell,
  Search,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,

  // Actions / feedback
  Check,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Edit3,
  Camera,
  Image as ImageIcon,
  Mic,
  MicOff,
  Play,
  Pause,

  // Status / meta
  Info,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Flag,
  Zap,

  // Social / share
  Link as LinkIcon,
  Copy,

  // Money
  CreditCard,
  Wallet,
  Gift,

  // Location / discovery
  Globe,
  Compass,
  Navigation,
  Route,
  Home,

  // Documents / reports
  FileText,
  MessageSquare,

  // Transfer
  Upload,
  Download,

  // Connectivity
  WifiOff,

  // Misc product
  RotateCcw,
  Flame,
  Filter,
  LogOut,

  // Events / nightlife
  Music,
  Ticket,
  PartyPopper,
} from "lucide-react";

export type { LucideIcon } from "lucide-react";
