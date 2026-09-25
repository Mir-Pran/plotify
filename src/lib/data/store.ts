import { Property, User, ApprovalStatus, Inquiry, PlatformSettings, DEFAULT_PLATFORM_SETTINGS, ActivationFeeConfig, ACTIVATION_FEES, ChatHistoryMessage, ChatSessionSummary } from '../types';
import { MOCK_PROPERTIES } from './mock-properties';
import { createClient } from '../supabase/client';

import { DEFAULT_CREDENTIALS, verifyPassword } from '../auth-crypto';

const PROPERTIES_STORAGE_KEY = 'plotify_properties_db';
const USERS_STORAGE_KEY = 'plotify_users_db';
const INQUIRIES_STORAGE_KEY = 'plotify_inquiries_db';
const SAVED_STORAGE_KEY = 'plotify_saved_properties_db';
const AI_LOGS_STORAGE_KEY = 'plotify_ai_logs_db';
const SETTINGS_STORAGE_KEY = 'plotify_platform_settings_db';
const CREDENTIALS_STORAGE_KEY = 'plotify_credentials_db';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin-01',
    email: 'support@plotify.store',
    fullName: 'Plotify Super Admin',
    mobile: '01700000000',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00Z',
    isVerified: true,
  },
  {
    id: 'user-business-01',
    email: 'business@plotify.com.bd',
    fullName: 'Elite Living Developers',
    mobile: '01711000001',
    role: 'business',
    businessName: 'Elite Living Ltd.',
    createdAt: '2026-02-01T00:00:00Z',
    isVerified: true,
  },
  {
    id: 'user-personal-01',
    email: 'tahmina@example.com',
    fullName: 'Tahmina Akter',
    mobile: '01552000005',
    role: 'personal',
    upgradeStatus: 'none',
    createdAt: '2026-03-01T00:00:00Z',
    isVerified: true,
  },
  {
    id: 'user-personal-02',
    email: 'tanvir.hossain@gmail.com',
    fullName: 'Tanvir Hossain',
    mobile: '01812345678',
    role: 'personal',
    upgradeStatus: 'pending_approval',
    businessName: 'Hossain Real Estate Consultants',
    nidUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-03-15T00:00:00Z',
    isVerified: false,
  },
];

export const INITIAL_INQUIRIES: Inquiry[] = [
  {
    id: 'inq-001',
    propertyId: 'prop-001',
    buyerName: 'Engr. Kamal Hossain',
    buyerPhone: '01712000000',
    buyerEmail: 'kamal@example.com',
    message: 'Interested in scheduling a site visit this Saturday afternoon.',
    status: 'new',
    createdAt: '2026-04-12T10:00:00Z',
  },
  {
    id: 'inq-002',
    propertyId: 'prop-002',
    buyerName: 'Nasir Uddin',
    buyerPhone: '01819000099',
    buyerEmail: 'nasir@gmail.com',
    message: 'Please send mutation and c/s r/s khatian papers via WhatsApp.',
    status: 'contacted',
    createdAt: '2026-04-11T14:30:00Z',
  },
];

export interface AiLogItem {
  id: string;
  user: string;
  query: string;
  response?: string;
  time: string;
  status: string;
  latency: string;
  provider?: string;
  timestamp?: string;
}

// Start with empty logs; only real user interactions are captured
export const INITIAL_AI_LOGS: AiLogItem[] = [];


export class DataStore {
  // Properties
  static getProperties(): Property[] {
    if (typeof window === 'undefined') return MOCK_PROPERTIES;
    try {
      const stored = localStorage.getItem(PROPERTIES_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(MOCK_PROPERTIES));
      return MOCK_PROPERTIES;
    } catch {
      return MOCK_PROPERTIES;
    }
  }

  static getApprovedProperties(): Property[] {
    return this.getProperties().filter(p => p.approval_status === 'approved');
  }

  static getPropertyById(id: string): Property | undefined {
    return this.getProperties().find(p => p.id === id);
  }

  static saveProperties(props: Property[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(props));
      window.dispatchEvent(new Event('plotify_properties_updated'));
    } catch (e) {
      console.error('Failed to save properties', e);
    }
  }

  static async addProperty(prop: Omit<Property, 'id' | 'createdAt' | 'approval_status'> & Partial<Property>): Promise<Property> {
    const settings = this.getSettings();
    const initialStatus: ApprovalStatus = settings.requireListingApproval ? 'pending' : 'approved';
    const feeSchedule = this.getFeeSchedule();
    const feeCfg = feeSchedule.find(s => s.category === prop.category);
    const calculatedFee = prop.activationFee || (feeCfg ? feeCfg.minFee : 1000);

    const newProp: Property = {
      ...prop,
      id: prop.id || `prop-${Date.now()}`,
      approval_status: prop.approval_status || initialStatus,
      activationFee: calculatedFee,
      createdAt: new Date().toISOString(),
      views: 0,
      images: prop.images || (prop.featuredImage ? [prop.featuredImage] : []),
      featuredImage: prop.featuredImage || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80',
      status: 'available',
    } as Property;

    // Save to local store
    const list = this.getProperties();
    list.unshift(newProp);
    this.saveProperties(list);

    // Try saving to Supabase if available
    try {
      const supabase = createClient();
      await supabase.from('properties').insert([{
        id: newProp.id,
        user_id: newProp.sellerId,
        title: newProp.title,
        description: newProp.description,
        price: newProp.price,
        purpose: newProp.purpose,
        property_type: newProp.category === 'flat' ? 'apartment' : newProp.category === 'land' ? 'plot' : 'apartment',
        approval_status: 'pending',
        division: newProp.division,
        district: newProp.district,
        area: newProp.area,
        address: newProp.address,
        size: newProp.size,
        size_unit: newProp.sizeUnit,
        seller_name: newProp.sellerName,
        seller_phone: newProp.sellerPhone,
        featured_image: newProp.featuredImage,
        images: newProp.images,
      }]);
    } catch {
      // Supabase table may not exist or network unavailable
    }

    return newProp;
  }

  static updatePropertyApproval(id: string, status: ApprovalStatus): boolean {
    const list = this.getProperties();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return false;

    list[idx] = { ...list[idx], approval_status: status };
    this.saveProperties(list);

    // Sync to Supabase in background
    try {
      const supabase = createClient();
      supabase.from('properties').update({ approval_status: status }).eq('id', id).then();
    } catch { }

    return true;
  }

  static updatePropertyStatus(id: string, status: ApprovalStatus): boolean {
    return this.updatePropertyApproval(id, status);
  }

  static updateProperty(id: string, updates: Partial<Property>): boolean {
    const list = this.getProperties();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return false;

    list[idx] = { ...list[idx], ...updates };
    this.saveProperties(list);

    try {
      const supabase = createClient();
      supabase.from('properties').update({
        title: updates.title,
        price: updates.price,
        approval_status: updates.approval_status,
        area: updates.area,
        district: updates.district,
        description: updates.description,
      }).eq('id', id).then();
    } catch { }

    return true;
  }

  static deleteProperty(id: string): boolean {
    const list = this.getProperties().filter(p => p.id !== id);
    this.saveProperties(list);
    try {
      const supabase = createClient();
      supabase.from('properties').delete().eq('id', id).then();
    } catch { }
    return true;
  }

  static incrementPropertyViews(id: string): { views: number; clicks: number; reach: number } | null {
    const list = this.getProperties();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const prop = list[idx];
    const newViews = (prop.views || 0) + 1;
    const clicks = prop.clicks || 0;
    const reach = Math.round(newViews * 1.8 + clicks * 3);

    list[idx] = {
      ...prop,
      views: newViews,
      clicks,
      reach,
    };
    this.saveProperties(list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('plotify_property_analytics_updated', { detail: { id, views: newViews, clicks, reach } }));
    }

    try {
      const supabase = createClient();
      supabase.from('properties').update({ views: newViews, clicks, reach }).eq('id', id).then();
    } catch { }

    return { views: newViews, clicks, reach };
  }

  static incrementPropertyClicks(id: string): { views: number; clicks: number; reach: number } | null {
    const list = this.getProperties();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const prop = list[idx];
    const views = prop.views || 0;
    const newClicks = (prop.clicks || 0) + 1;
    const reach = Math.round(views * 1.8 + newClicks * 3);

    list[idx] = {
      ...prop,
      views,
      clicks: newClicks,
      reach,
    };
    this.saveProperties(list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('plotify_property_analytics_updated', { detail: { id, views, clicks: newClicks, reach } }));
    }

    try {
      const supabase = createClient();
      supabase.from('properties').update({ views, clicks: newClicks, reach }).eq('id', id).then();
    } catch { }

    return { views, clicks: newClicks, reach };
  }

  // Users
  static getUsers(): User[] {
    if (typeof window === 'undefined') return INITIAL_USERS;
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  }

  static saveUsers(users: User[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      window.dispatchEvent(new Event('plotify_users_updated'));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  }

  static getUserById(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  static getUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  // Credentials Management for Strict Authentication
  static getCredentials(): Record<string, string> {
    if (typeof window === 'undefined') return DEFAULT_CREDENTIALS;
    try {
      const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_CREDENTIALS, ...JSON.parse(stored) };
      }
      localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(DEFAULT_CREDENTIALS));
      return DEFAULT_CREDENTIALS;
    } catch {
      return DEFAULT_CREDENTIALS;
    }
  }

  static saveCredential(email: string, passwordHash: string) {
    if (typeof window === 'undefined') return;
    try {
      const creds = this.getCredentials();
      creds[email.toLowerCase().trim()] = passwordHash;
      localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(creds));
    } catch (e) {
      console.error('Failed to save credential', e);
    }
  }

  static async verifyCredential(email: string, password: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    // Strict Admin Credentials
    if (normalizedEmail === 'support@plotify.store') {
      const creds = this.getCredentials();
      const storedHash = creds[normalizedEmail];
      if (storedHash) {
        return await verifyPassword(password, storedHash);
      }
      return password === 'Plotify@Support';
    }
    const creds = this.getCredentials();
    const storedHash = creds[normalizedEmail];
    if (!storedHash) return false;
    return await verifyPassword(password, storedHash);
  }

  static upsertUser(user: User): User {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    this.saveUsers(users);
    return user;
  }

  static updateUser(id: string, updates: Partial<User>): boolean {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return false;

    users[idx] = { ...users[idx], ...updates };
    this.saveUsers(users);

    // Sync to Supabase
    try {
      const supabase = createClient();
      supabase.from('profiles').update({
        full_name: updates.fullName,
        role: updates.role,
        business_name: updates.businessName,
        phone: updates.mobile,
      }).eq('id', id).then();
    } catch { }

    return true;
  }

  static deleteUser(id: string): boolean {
    const target = this.getUserById(id);
    if (target?.email === 'support@plotify.store') {
      return false; // Protect root super admin
    }
    const users = this.getUsers().filter(u => u.id !== id);
    this.saveUsers(users);

    try {
      const supabase = createClient();
      supabase.from('profiles').delete().eq('id', id).then();
    } catch { }

    return true;
  }

  static approveUserBusinessUpgrade(userId: string): boolean {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return false;

    users[idx] = {
      ...users[idx],
      role: 'business',
      upgradeStatus: 'approved',
      verificationStatus: 'verified',
      isVerified: true,
    };
    this.saveUsers(users);

    // Sync to Supabase
    try {
      const supabase = createClient();
      supabase.from('profiles').update({
        role: 'business',
        upgrade_status: 'approved',
        is_verified: true,
        verification_status: 'verified',
      }).eq('id', userId).then();
    } catch { }

    return true;
  }

  static rejectUserBusinessUpgrade(userId: string): boolean {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return false;

    users[idx] = {
      ...users[idx],
      upgradeStatus: 'rejected',
      verificationStatus: 'rejected',
      isVerified: false,
    };
    this.saveUsers(users);

    // Sync to Supabase
    try {
      const supabase = createClient();
      supabase.from('profiles').update({
        upgrade_status: 'rejected',
        verification_status: 'rejected',
        is_verified: false,
      }).eq('id', userId).then();
    } catch { }

    return true;
  }

  // Inquiries
  static getInquiries(): Inquiry[] {
    if (typeof window === 'undefined') return INITIAL_INQUIRIES;
    try {
      const stored = localStorage.getItem(INQUIRIES_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(INITIAL_INQUIRIES));
      return INITIAL_INQUIRIES;
    } catch {
      return INITIAL_INQUIRIES;
    }
  }

  static addInquiry(inquiry: Omit<Inquiry, 'id' | 'createdAt'>): Inquiry {
    const newInq: Inquiry = {
      ...inquiry,
      id: `inq-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const list = this.getInquiries();
    list.unshift(newInq);
    if (typeof window !== 'undefined') {
      localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('plotify_inquiries_updated'));
    }

    // Sync to Supabase
    try {
      const supabase = createClient();
      supabase.from('property_inquiries').insert([{
        id: newInq.id,
        property_id: newInq.propertyId,
        buyer_name: newInq.buyerName,
        buyer_phone: newInq.buyerPhone,
        buyer_email: newInq.buyerEmail,
        message: newInq.message,
        status: newInq.status,
      }]).then();
    } catch {}

    return newInq;
  }

  // Saved Properties (Favorites)
  static getSavedPropertyIds(userId: string): string[] {
    if (typeof window === 'undefined' || !userId) return [];
    try {
      const stored = localStorage.getItem(`${SAVED_STORAGE_KEY}_${userId}`);
      if (stored) return JSON.parse(stored);
      return [];
    } catch {
      return [];
    }
  }

  static isPropertySaved(userId: string, propertyId: string): boolean {
    if (!userId || !propertyId) return false;
    return this.getSavedPropertyIds(userId).includes(propertyId);
  }

  static async syncSavedPropertiesFromSupabase(userId: string): Promise<string[]> {
    if (!userId) return [];
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('saved_properties')
        .select('property_id')
        .eq('user_id', userId);

      if (data && !error) {
        const ids = data.map((d: any) => d.property_id).filter(Boolean);
        if (typeof window !== 'undefined') {
          const current = this.getSavedPropertyIds(userId);
          const merged = Array.from(new Set([...current, ...ids]));
          localStorage.setItem(`${SAVED_STORAGE_KEY}_${userId}`, JSON.stringify(merged));
          window.dispatchEvent(new Event('plotify_saved_updated'));
          return merged;
        }
        return ids;
      }
    } catch (err) {
      console.warn('[DataStore] syncSavedProperties note:', err);
    }
    return this.getSavedPropertyIds(userId);
  }

  static async toggleSaveProperty(userId: string, propertyId: string): Promise<boolean> {
    if (!userId || !propertyId) return false;
    const current = this.getSavedPropertyIds(userId);
    const isSaved = current.includes(propertyId);
    let updated: string[];
    if (isSaved) {
      updated = current.filter(id => id !== propertyId);
    } else {
      updated = [...current, propertyId];
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${SAVED_STORAGE_KEY}_${userId}`, JSON.stringify(updated));
      window.dispatchEvent(new Event('plotify_saved_updated'));
    }

    // Direct Supabase mutation
    try {
      const supabase = createClient();
      if (!isSaved) {
        await supabase
          .from('saved_properties')
          .upsert([{ user_id: userId, property_id: propertyId }]);
      } else {
        await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', userId)
          .eq('property_id', propertyId);
      }
    } catch (dbErr) {
      console.warn('[DataStore] saved_properties mutation note:', dbErr);
    }

    return !isSaved;
  }

  // Ploti AI Logs Deduplication & Management
  static deduplicateLogs(logs: AiLogItem[]): AiLogItem[] {
    if (!Array.isArray(logs)) return [];
    const result: AiLogItem[] = [];
    const seenIds = new Set<string>();

    for (const item of logs) {
      if (!item || !item.query) continue;
      if (item.id && seenIds.has(item.id)) continue;

      // Check if duplicate exists by matching user, query, and close timestamps (within 25 seconds)
      const existingMatch = result.find(existing => {
        if (
          existing.query?.trim().toLowerCase() === item.query?.trim().toLowerCase() &&
          existing.user?.trim().toLowerCase() === item.user?.trim().toLowerCase()
        ) {
          if (existing.timestamp && item.timestamp) {
            const t1 = new Date(existing.timestamp).getTime();
            const t2 = new Date(item.timestamp).getTime();
            if (!isNaN(t1) && !isNaN(t2) && Math.abs(t1 - t2) < 25000) {
              return true;
            }
          }
          if (existing.time && item.time) {
            const [h1, m1] = existing.time.split(':');
            const [h2, m2] = item.time.split(':');
            if (h1 === h2 && m1 === m2) {
              return true;
            }
          }
        }
        return false;
      });

      if (!existingMatch) {
        if (item.id) seenIds.add(item.id);
        result.push(item);
      } else {
        // Merge richer details into existing entry if missing
        if (!existingMatch.response && item.response) {
          existingMatch.response = item.response;
        }
        if (item.provider && (!existingMatch.provider || existingMatch.provider === 'gemini-2.0-flash')) {
          existingMatch.provider = item.provider;
        }
      }
    }

    return result;
  }

  static getAiLogs(): AiLogItem[] {
    if (typeof window === 'undefined') return INITIAL_AI_LOGS;
    try {
      const stored = localStorage.getItem(AI_LOGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return this.deduplicateLogs(parsed);
        }
      }
      localStorage.setItem(AI_LOGS_STORAGE_KEY, JSON.stringify(INITIAL_AI_LOGS));
      return INITIAL_AI_LOGS;
    } catch {
      return INITIAL_AI_LOGS;
    }
  }

  static saveServerAiLog(serverLog: AiLogItem): AiLogItem {
    if (!serverLog || !serverLog.query) return serverLog;
    const current = this.getAiLogs();

    // Check if duplicate or existing entry exists
    const existingIndex = current.findIndex(l =>
      l.id === serverLog.id ||
      (
        l.query?.trim().toLowerCase() === serverLog.query?.trim().toLowerCase() &&
        l.user?.trim().toLowerCase() === (serverLog.user || 'Guest User').trim().toLowerCase() &&
        Math.abs(new Date(serverLog.timestamp || 0).getTime() - new Date(l.timestamp || 0).getTime()) < 25000
      )
    );

    if (existingIndex !== -1) {
      current[existingIndex] = { ...current[existingIndex], ...serverLog };
    } else {
      current.unshift(serverLog);
    }

    const deduped = this.deduplicateLogs(current).slice(0, 100);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AI_LOGS_STORAGE_KEY, JSON.stringify(deduped));
      window.dispatchEvent(new Event('plotify_ai_logs_updated'));
    }
    return serverLog;
  }

  static recordAiLog(user: string, query: string, latencyMs?: number, response?: string, provider?: string): AiLogItem {
    const logs = this.getAiLogs();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const latencyFormatted = latencyMs !== undefined 
      ? `${(latencyMs / 1000).toFixed(2)}s` 
      : '1.10s';

    // Deduplication check: if a matching log for this user & query exists within the last 25 seconds, update it
    const existingMatch = logs.find(l =>
      l.query?.trim().toLowerCase() === query.trim().toLowerCase() &&
      l.user?.trim().toLowerCase() === (user || 'Guest User').trim().toLowerCase() &&
      Math.abs(now.getTime() - new Date(l.timestamp || 0).getTime()) < 25000
    );

    if (existingMatch) {
      if (response && !existingMatch.response) existingMatch.response = response;
      if (provider) existingMatch.provider = provider;
      if (latencyFormatted) existingMatch.latency = latencyFormatted;
      if (typeof window !== 'undefined') {
        const deduped = this.deduplicateLogs(logs).slice(0, 100);
        localStorage.setItem(AI_LOGS_STORAGE_KEY, JSON.stringify(deduped));
        window.dispatchEvent(new Event('plotify_ai_logs_updated'));
      }
      return existingMatch;
    }

    const newLog: AiLogItem = {
      id: String(Date.now()),
      user: user || 'Guest User',
      query,
      response: response || undefined,
      time: timeStr,
      status: 'success',
      latency: latencyFormatted,
      provider: provider || 'Google Gemini',
      timestamp: now.toISOString(),
    };
    logs.unshift(newLog);
    const deduped = this.deduplicateLogs(logs).slice(0, 100);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AI_LOGS_STORAGE_KEY, JSON.stringify(deduped));
      window.dispatchEvent(new Event('plotify_ai_logs_updated'));
    }
    return newLog;
  }

  static async syncAiLogsFromServer(): Promise<AiLogItem[]> {
    if (typeof window === 'undefined') return this.getAiLogs();
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs) && data.logs.length > 0) {
          const current = this.getAiLogs();
          // Merge and strictly deduplicate both server and local logs
          const merged = this.deduplicateLogs([...data.logs, ...current]).slice(0, 100);
          localStorage.setItem(AI_LOGS_STORAGE_KEY, JSON.stringify(merged));
          window.dispatchEvent(new Event('plotify_ai_logs_updated'));
          return merged;
        } else if (Array.isArray(data.logs) && data.logs.length === 0) {
          // Server explicitly has 0 logs (e.g. after deletion)
          localStorage.setItem(AI_LOGS_STORAGE_KEY, JSON.stringify([]));
          localStorage.setItem('plotify_ai_logs_v1', JSON.stringify([]));
          window.dispatchEvent(new Event('plotify_ai_logs_updated'));
          return [];
        }
      }
    } catch (e) {
      console.warn('Failed to sync AI logs from server', e);
    }
    return this.getAiLogs();
  }

  static async clearAiLogs(): Promise<boolean> {
    // 1. Clear local browser storage
    if (typeof window !== 'undefined') {
      localStorage.setItem(AI_LOGS_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem('plotify_ai_logs_v1', JSON.stringify([]));
      window.dispatchEvent(new Event('plotify_ai_logs_updated'));
    }

    // 2. Direct Supabase delete query
    try {
      const supabase = createClient();
      await supabase.from('ai_logs').delete().neq('id', '0');
      await supabase.from('ai_chat_history').delete().neq('id', '0');
    } catch (dbErr) {
      console.warn('[DataStore.clearAiLogs] Supabase direct delete note:', dbErr);
    }

    // 3. Server API delete
    try {
      await fetch('/api/chat', { method: 'DELETE' });
    } catch (apiErr) {
      console.warn('[DataStore.clearAiLogs] Server delete note:', apiErr);
    }

    return true;
  }

  // Platform Settings & T-O-Z Controls
  static getSettings(): PlatformSettings {
    if (typeof window === 'undefined') return DEFAULT_PLATFORM_SETTINGS;
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PLATFORM_SETTINGS, ...parsed };
      }
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_PLATFORM_SETTINGS));
      return DEFAULT_PLATFORM_SETTINGS;
    } catch {
      return DEFAULT_PLATFORM_SETTINGS;
    }
  }

  static saveSettings(settings: PlatformSettings): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      window.dispatchEvent(new Event('plotify_settings_updated'));
      window.dispatchEvent(new Event('plotify_fees_updated'));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  static async syncSettingsFromSupabase(): Promise<PlatformSettings> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      if (data && !error) {
        const merged: PlatformSettings = {
          ...this.getSettings(),
          supportPhone: data.support_phone || data.phone || this.getSettings().supportPhone,
          supportEmail: data.support_email || data.email || this.getSettings().supportEmail,
          officeAddress: data.office_address || data.address || this.getSettings().officeAddress,
          siteName: data.site_name || this.getSettings().siteName,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
          window.dispatchEvent(new Event('plotify_settings_updated'));
        }
        return merged;
      }
    } catch (err) {
      console.warn('[DataStore] site_settings sync note:', err);
    }
    return this.getSettings();
  }

  static async saveSettingsToSupabase(settings: PlatformSettings): Promise<boolean> {
    this.saveSettings(settings);
    try {
      const supabase = createClient();
      await supabase.from('site_settings').upsert({
        id: 'global',
        site_name: settings.siteName,
        support_phone: settings.supportPhone,
        support_email: settings.supportEmail,
        office_address: settings.officeAddress,
        maintenance_mode: settings.maintenanceMode,
        updated_at: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      console.warn('[DataStore] site_settings upsert note:', err);
      return false;
    }
  }

  static updateSettings(partial: Partial<PlatformSettings>): PlatformSettings {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    this.saveSettings(updated);
    return updated;
  }

  static getFeeSchedule(): ActivationFeeConfig[] {
    const settings = this.getSettings();
    return settings.feeSchedule && settings.feeSchedule.length > 0 ? settings.feeSchedule : ACTIVATION_FEES;
  }

  static updateFeeSchedule(schedule: ActivationFeeConfig[]): void {
    this.updateSettings({ feeSchedule: schedule });
  }

  // Admin Real Stats (Strictly Live Database & LocalStore Data)
  static getAdminStats() {
    const users = this.getUsers();
    const properties = this.getProperties();
    const schedule = this.getFeeSchedule();
    const pendingListings = properties.filter(p => p.approval_status === 'pending');
    const pendingUsers = users.filter(u => u.upgradeStatus === 'pending_approval');
    const approvedListings = properties.filter(p => p.approval_status === 'approved');
    const rejectedListings = properties.filter(p => p.approval_status === 'rejected');

    // Calculate real revenue from approved/active listings according to their actual category fee
    const totalRevenueBDT = approvedListings.reduce((acc, p) => {
      if (typeof p.activationFee === 'number' && p.activationFee > 0) return acc + p.activationFee;
      const feeCfg = schedule.find(s => s.category === p.category);
      return acc + (feeCfg ? feeCfg.minFee : 1000);
    }, 0);

    return {
      totalUsers: users.length,
      pendingApprovals: pendingListings.length + pendingUsers.length,
      pendingListingsCount: pendingListings.length,
      pendingUsersCount: pendingUsers.length,
      totalListings: properties.length,
      approvedListingsCount: approvedListings.length,
      rejectedListingsCount: rejectedListings.length,
      totalRevenue: totalRevenueBDT,
    };
  }

  // ==========================================
  // Ploti AI Chat History & Sessions
  // ==========================================
  static async getChatSessions(userId: string): Promise<ChatSessionSummary[]> {
    if (!userId || userId === 'guest') return [];
    try {
      const res = await fetch(`/api/chat/history?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.sessions || [];
    } catch (err) {
      console.warn('[DataStore] getChatSessions error:', err);
      return [];
    }
  }

  static async getSessionMessages(userId: string, sessionId: string): Promise<ChatHistoryMessage[]> {
    if (!userId || !sessionId || userId === 'guest') return [];
    try {
      const res = await fetch(
        `/api/chat/history?userId=${encodeURIComponent(userId)}&sessionId=${encodeURIComponent(sessionId)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.messages || [];
    } catch (err) {
      console.warn('[DataStore] getSessionMessages error:', err);
      return [];
    }
  }

  static async deleteChatSession(userId: string, sessionId: string): Promise<boolean> {
    if (!userId || !sessionId || userId === 'guest') return false;
    try {
      const res = await fetch(
        `/api/chat/history?userId=${encodeURIComponent(userId)}&sessionId=${encodeURIComponent(sessionId)}`,
        { method: 'DELETE' }
      );
      return res.ok;
    } catch (err) {
      console.warn('[DataStore] deleteChatSession error:', err);
      return false;
    }
  }

  static async clearAllChatHistory(userId: string): Promise<boolean> {
    if (!userId || userId === 'guest') return false;
    try {
      const res = await fetch(
        `/api/chat/history?userId=${encodeURIComponent(userId)}&clearAll=true`,
        { method: 'DELETE' }
      );
      return res.ok;
    } catch (err) {
      console.warn('[DataStore] clearAllChatHistory error:', err);
      return false;
    }
  }
}


