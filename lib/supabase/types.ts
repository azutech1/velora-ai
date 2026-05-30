export type DatabaseUser = {
  id?: string;
  wallet_address: string;
  chain_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type DatabaseActivity = {
  id?: string;
  wallet_address: string;
  action_type: string;
  title: string;
  description: string;
  feature: string;
  token?: string | null;
  amount?: string | null;
  network?: string | null;
  status: string;
  tx_hash?: string | null;
  metadata?: Record<string, string | number | boolean | null> | null;
  created_at?: string;
};

export type DatabaseReward = {
  id?: string;
  wallet_address: string;
  reward_type: string;
  amount: string;
  token: string;
  status: string;
  metadata?: Record<string, string | number | boolean | null> | null;
  created_at?: string;
};

export type DatabaseFaucetClaim = {
  id?: string;
  wallet_address: string;
  token: string;
  amount: string;
  tx_hash?: string | null;
  status: string;
  created_at?: string;
};

export type DatabaseTransaction = {
  id?: string;
  wallet_address: string;
  tx_hash: string;
  chain_id: number;
  feature: string;
  token?: string | null;
  amount?: string | null;
  status: "pending" | "success" | "failed";
  explorer_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DatabaseAgentPayment = {
  id?: string;
  wallet_address: string;
  payment_id: string;
  agent_name: string;
  service_name: string;
  recipient_name?: string | null;
  payment_type: string;
  amount: string;
  token: string;
  destination: string;
  network: string;
  rail: string;
  status: string;
  execution_mode: string;
  resource_url?: string | null;
  description?: string | null;
  schedule_date?: string | null;
  approval_time?: string | null;
  rejection_time?: string | null;
  rejection_reason?: string | null;
  execution_started_at?: string | null;
  completed_at?: string | null;
  failed_at?: string | null;
  failure_reason?: string | null;
  tx_hash?: string | null;
  transfer_id?: string | null;
  retry_count: number;
  logs?: unknown[] | null;
  created_at?: string;
  updated_at?: string;
};
