/**
 * Tipos para pedidos.
 */

import type { PaymentStatus, OrderStatus } from "@/lib/constants/orders";

export interface OrderItem {
  id: string;
  order_id: string;
  company_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  sku_snapshot: string | null;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
  inventory_source: string | null;
  external_reference_id: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  company_id: string;
  order_number: string;
  source_channel: string | null;
  source_platform: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  notes: string | null;
  payment_status: PaymentStatus | string;
  payment_method: string | null;
  payment_provider: string | null;
  payment_reference: string | null;
  payment_bank: string | null;
  payment_amount_received: number | null;
  payment_received_at: string | null;
  payment_verified_by: string | null;
  payment_verified_at: string | null;
  order_status: OrderStatus | string;
  rejection_reason: string | null;
  rejection_notes: string | null;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  items?: OrderItem[];
}
