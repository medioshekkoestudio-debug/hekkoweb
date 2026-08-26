// ============================================================================
// Tipos TypeScript derivados del esquema de Supabase.
// Mantener en sincronía con supabase/migrations/0001_hekko_init.sql
// ============================================================================

export type UserRole = 'admin' | 'strategist';
export type OrderStatus = 'sin_estratega' | 'con_estratega' | 'entregada';
export type StageStatus = 'pending' | 'in_progress' | 'done';
export type ServiceType = 'diseno_grafico' | 'marketing' | 'desarrollo_web';

/** Etiquetas de los servicios de Hekko, para mostrar en la interfaz. */
export const SERVICE_LABELS: Record<ServiceType, string> = {
  diseno_grafico: 'Diseño gráfico',
  marketing: 'Marketing',
  desarrollo_web: 'Desarrollo web',
};

export const SERVICE_TYPES = Object.keys(SERVICE_LABELS) as ServiceType[];

/** Marca de Hekko: fila única (id = 1) de company_settings. */
export interface CompanySettings {
  id: number;
  name: string;
  logo_url: string | null;
  whatsapp: string | null;
  updated_at: string;
}

export type CompanyUpdate = Partial<Pick<CompanySettings, 'name' | 'whatsapp'>>;

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

// Perfil de estratega enriquecido con el correo de auth (el email vive en
// auth.users, no en la tabla profiles).
export interface Strategist extends Profile {
  email: string | null;
}

/** Alta de un estratega desde el panel del admin. */
export interface CreateStrategistPayload {
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
}

/** Edición de un estratega. Todos los campos son opcionales. */
export interface UpdateStrategistPayload {
  full_name?: string;
  phone?: string | null;
  active?: boolean;
  email?: string;
  password?: string;
}

export interface Order {
  id: string;
  public_token: string;
  client_first_name: string;
  client_last_name: string;
  client_whatsapp: string;
  service_type: ServiceType;
  project_name: string;
  assigned_strategist_id: string | null;
  status: OrderStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  assigned_strategist?: Profile | null;
  stages?: OrderStage[];
}

export type OrderInsert = Omit<
  Order,
  'id' | 'public_token' | 'created_at' | 'updated_at' | 'assigned_strategist' | 'stages'
>;
export type OrderUpdate = Partial<OrderInsert>;

/** Cuerpo que manda el formulario de creación de orden. */
export interface CreateOrderPayload {
  client_first_name: string;
  client_last_name: string;
  client_whatsapp: string;
  service_type: ServiceType;
  project_name: string;
  assigned_strategist_id?: string | null;
  notes?: string | null;
}

/** Edición de una orden desde el panel. */
export interface UpdateOrderPayload {
  client_first_name?: string;
  client_last_name?: string;
  client_whatsapp?: string;
  service_type?: ServiceType;
  project_name?: string;
  assigned_strategist_id?: string | null;
  status?: OrderStatus;
  notes?: string | null;
}

/** Alta de una etapa de seguimiento. */
export interface CreateStagePayload {
  name: string;
  position?: number;
}

/** Edición de una etapa de seguimiento. */
export interface UpdateStagePayload {
  status?: StageStatus;
  name?: string;
  description?: string | null;
}

export interface StageAttachment {
  id: string;
  stage_id: string;
  order_id: string;
  path: string;
  url: string;
  name: string | null;
  mime: string | null;
  created_by: string | null;
  created_at: string;
}

export interface OrderStage {
  id: string;
  order_id: string;
  name: string;
  description: string | null;
  position: number;
  status: StageStatus;
  completed_at: string | null;
  created_at: string;
  // joined
  attachments?: StageAttachment[];
}

export type OrderStageInsert = Omit<OrderStage, 'id' | 'created_at'>;
export type OrderStageUpdate = Partial<Omit<OrderStage, 'id' | 'order_id' | 'created_at'>>;

// ============================================================================
// Tipo Database (lo usan createClient / createServerClient)
// ============================================================================
export type Database = {
  public: {
    Tables: {
      company_settings: {
        Row: CompanySettings;
        Insert: Partial<CompanySettings>;
        Update: Partial<CompanySettings>;
      };
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      order_stages: {
        Row: OrderStage;
        Insert: OrderStageInsert;
        Update: OrderStageUpdate;
      };
      stage_attachments: {
        Row: StageAttachment;
        Insert: Omit<StageAttachment, 'id' | 'created_at'>;
        Update: Partial<Omit<StageAttachment, 'id' | 'created_at'>>;
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      stage_status: StageStatus;
      service_type: ServiceType;
    };
  };
};
