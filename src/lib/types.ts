export type PropertyCategory = 'flat' | 'house' | 'land' | 'mess' | 'hotel';
export type PropertyPurpose = 'buy' | 'rent' | 'lease';
export type PropertyStatus = 'available' | 'under_offer' | 'sold' | 'rented';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type AreaUnit = 'sqft' | 'katha' | 'bigha' | 'decimal' | 'shotangso';
export type AccountType = 'personal' | 'business';
export type UserRole = 'personal' | 'business' | 'admin';
export type UpgradeStatus = 'none' | 'pending_approval' | 'approved' | 'rejected';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUnit: 'bdt_total' | 'bdt_per_month' | 'bdt_per_katha';
  priceNegotiable: boolean;
  purpose: PropertyPurpose;
  category: PropertyCategory;
  approval_status: ApprovalStatus;

  // Location
  division: string;
  district: string;
  area: string;
  address: string;
  landmark?: string;
  lat?: number;
  lng?: number;

  // Dimensions
  size: number;
  sizeUnit: AreaUnit;
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  floorNumber?: number;
  totalFloors?: number;
  facing?: string;
  furnishing?: 'unfurnished' | 'semi_furnished' | 'fully_furnished';

  // Bangladesh Specifics
  gasConnection?: 'titas' | 'lpg' | 'none';
  electricityType?: 'prepaid' | 'postpaid';
  wasaWater?: boolean;
  generatorBackup?: boolean;
  liftCount?: number;
  parkingSpaces?: number;
  securityGuard?: boolean;
  cctv?: boolean;
  isReady?: boolean;
  handoverYear?: number;

  // Media
  images: string[];
  featuredImage: string;
  isFeatured?: boolean;
  isVerified?: boolean;
  status: PropertyStatus;

  // Seller
  sellerId?: string;
  sellerName: string;
  sellerPhone: string;
  sellerWhatsapp?: string;
  sellerType: 'owner' | 'developer' | 'agent';
  sellerVerified?: boolean;

  // Meta
  views?: number;
  clicks?: number;
  reach?: number;
  activationFee?: number;
  activationStatus?: 'pending' | 'active' | 'expired';
  createdAt: string;
  updatedAt?: string;
}

export interface SearchFilters {
  category?: PropertyCategory;
  purpose?: PropertyPurpose;
  division?: string;
  district?: string;
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  minSize?: number;
  maxSize?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'nearest';
  keyword?: string;
  lat?: number;
  lng?: number;
  nearbyMode?: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  mobile: string;
  accountType?: AccountType;
  role: UserRole;
  avatarUrl?: string;
  isVerified?: boolean;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  upgradeStatus?: UpgradeStatus;
  nidNumber?: string;
  nidUrl?: string;
  photoUrl?: string;
  businessName?: string;
  organizationName?: string;
  organization_name?: string;
  savedProperties?: string[];
  createdAt: string;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  createdAt: string;
}

export interface ActivationFeeConfig {
  category: PropertyCategory;
  minFee: number;
  maxFee: number;
  description: string;
}

export const ACTIVATION_FEES: ActivationFeeConfig[] = [
  { category: 'flat', minFee: 1000, maxFee: 5000, description: 'Flats & Apartments' },
  { category: 'house', minFee: 1000, maxFee: 5000, description: 'Houses / Bari' },
  { category: 'land', minFee: 700, maxFee: 4500, description: 'Plots & Land (Jomi)' },
  { category: 'mess', minFee: 500, maxFee: 2000, description: 'Mess / Sublet / Room' },
  { category: 'hotel', minFee: 1000, maxFee: 5000, description: 'Hotels / Short-Term Rental' },
];

export interface PlatformSettings {
  siteName: string;
  supportPhone: string;
  supportEmail: string;
  officeAddress: string;
  requireListingApproval: boolean;
  requireNidForBusiness: boolean;
  maintenanceMode: boolean;
  userRegistrationEnabled: boolean;
  plotiAiEnabled: boolean;
  gpsSearchEnabled: boolean;
  whatsappButtonEnabled: boolean;
  noticeBannerEnabled: boolean;
  noticeBannerText: string;
  noticeBannerTextBn?: string;
  noticeBannerType: 'info' | 'warning' | 'success';
  aiName: string;
  aiModel: string;
  banglaSupport: boolean;
  feeSchedule: ActivationFeeConfig[];
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  siteName: 'Plotify Bangladesh',
  supportPhone: '+880 9612 000 888',
  supportEmail: 'support@plotify.store',
  officeAddress: 'Gulshan-2, Dhaka-1212, Bangladesh',
  requireListingApproval: true,
  requireNidForBusiness: true,
  maintenanceMode: false,
  userRegistrationEnabled: true,
  plotiAiEnabled: true,
  gpsSearchEnabled: true,
  whatsappButtonEnabled: true,
  noticeBannerEnabled: false,
  noticeBannerText: 'Welcome to Plotify - 100% verified real estate marketplace in Bangladesh.',
  noticeBannerTextBn: 'প্লটিফাইতে স্বাগতম - বাংলাদেশের সবচেয়ে বিশ্বস্ত রিয়েল এস্টেট মার্কেটপ্লেস।',
  noticeBannerType: 'info',
  aiName: 'Ploti AI',
  aiModel: 'gemini-2.5-flash',
  banglaSupport: true,
  feeSchedule: ACTIVATION_FEES,
};

export interface ChatHistoryMessage {
  id: string;
  userId?: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatSessionSummary {
  sessionId: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  updatedAt: string;
}


