import type { StoreSettings } from '../components/StoreContext';
export type Settings = StoreSettings;
export type AdminProduct = { slug: string; name: string; category: string; description: string; price: number; packSize: string; form: string; stock: number | null; active: boolean; updatedAt: string };
export type Order = { paymentProvider?: 'paystack' | null; id: string; reference: string; details: { name: string; email: string; phone: string; address: string; city: string; province: string; postalCode: string; notes: string }; method: string; items: { slug: string; name: string; packSize: string; form: string; quantity: number; price: number; lineTotal: number }[]; subtotal: number; shipping: number; total: number; status: string; payment: string; notes: string; createdAt: string };
export type Enquiry = { id: string; reference: string; name: string; surname: string; email: string; phone: string; message: string; status: string; notes: string; createdAt: string; attachments: { id: string; name: string; size: number }[] };
export type Customer = { name: string; email: string; phone: string; orders: number; paid: number; enquiries: number; lastSeen: string };
export type Activity = { id: number; actor: string; action: string; target: string; createdAt: string };
export type Overview = { totalOrders: number; pendingOrders: number; paidRevenue: number; openEnquiries: number; lowStock: AdminProduct[]; recentOrders: Order[]; days: { date: string; orders: number }[] };
