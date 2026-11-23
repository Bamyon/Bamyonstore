export interface Stamp { seconds: number; nanoseconds?: number }

export interface Product {
  id: string; name: string; price: number; was?: number; img?: string; desc?: string; unit?: string; section?: string;
  qty?: number; lowAt?: number; sold?: number; rating?: number; reviewsN?: number;
  stock?: boolean; active?: boolean; featured?: boolean; status?: string; partner?: string; partnerName?: string; createdAt?: Stamp;
}
export interface Section { id: string; name: string; sub?: string; order?: number; active?: boolean }
export interface Post { id: string; title: string; body?: string; html?: string; cover?: string; published?: boolean; at?: Stamp }
export interface Profile {
  id: string; name?: string; phone?: string; role: string; ruthId?: string; photo?: string; disabled?: boolean;
  perms?: Record<string, boolean>; ref?: string; createdAt?: Stamp;
}
export interface OrderItem { id: string; name: string; price: number; qty: number }
export interface Order {
  id: string; code?: string; uid?: string | null; items: OrderItem[]; total: number; fee?: number; discount?: number; zone?: string;
  contact?: { name: string; phone: string; addr: string; email?: string; geo?: number[] | null };
  method?: string; status: string; pay?: string; paidByUid?: string; riderId?: string; refunded?: boolean; createdAt?: Stamp; updatedAt?: Stamp;
}
