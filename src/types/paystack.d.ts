// Type definitions for Paystack Inline SDK v1
// Documentation: https://paystack.com/docs/payments/accept-payments/#popup
// Note: v1 (js.paystack.co/v1/inline.js) uses `callback` and `onClose`.
// Do NOT use `onSuccess` / `onCancel` — they are ignored by the v1 SDK.

interface PaystackPopupOptions {
  key: string;
  email?: string;
  amount?: number;
  ref?: string;
  access_code?: string; // For resuming a server-initialized transaction
  metadata?: Record<string, unknown>;
  currency?: string;
  channels?: string[];
  callback_url?: string;
  /** Called when payment is completed successfully. */
  callback?: (transaction: PaystackTransaction) => void;
  /** Called when the user closes the payment iframe without completing. */
  onClose?: () => void;
}

interface PaystackTransaction {
  message: string;
  reference: string;
  status: string;
  trans: string;
  transaction: string;
  trxref: string;
}

interface PaystackPopupHandler {
  openIframe: () => void;
}

interface PaystackPop {
  setup: (options: PaystackPopupOptions) => PaystackPopupHandler;
  resumeTransaction: (accessCode: string) => void;
}

interface Window {
  PaystackPop: PaystackPop;
}
