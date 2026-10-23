import React from "react";
import { Plug, Copy, CheckCircle2, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import CrmRoute from "@/components/crm/CrmRoute";
import PageHeader from "@/components/crm/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIntegrations } from "@/hooks/useIntegrations";

const Row = ({ on, title, children, vars, url }) => (
  <Card>
    <CardContent className="p-4 space-y-2">
      <div className="flex items-center gap-2">
        {on ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <CircleDashed className="h-5 w-5 text-gray-400" />}
        <p className="font-medium">{title}</p>
        <span className={`text-xs rounded-full px-2 py-0.5 ${on ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{on ? "On" : "Off"}</span>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">{children}</div>
      {vars && <p className="text-xs text-gray-500">Server variables: <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded">{vars}</code></p>}
      {url && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Webhook URL:</span>
          <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded break-all">{url}</code>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("Copied"))}><Copy className="h-3 w-3" /></Button>
        </div>
      )}
    </CardContent>
  </Card>
);

// Read-only status page. Keys are set in the server's .env file (never in the browser), then `pm2 restart crm-backend`.
const Integrations = () => {
  const i = useIntegrations();
  return (
    <CrmRoute>
      <div className="p-4 md:p-6 space-y-4">
        <PageHeader icon={Plug} title="Integrations" subtitle="What's connected. Keys live in the server's .env file - add them there and restart the backend." />
        <Row on={i.email?.configured} title="Send email from the CRM" vars="EMAIL, EMAIL_PASSWORD (Gmail app password) · optional SMTP_HOST, SMTP_PORT">
          <p>Sends from {i.email?.from || "your mailbox"}, with open and click tracking. Replies go to the sender's own email. Used by Contact, sequences, proposal links, invoices and portal invites.</p>
        </Row>
        <Row on={i.whatsapp?.configured && i.whatsapp?.webhookReady} title="WhatsApp Business API (Meta Cloud API)" vars="WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET" url={i.whatsapp?.webhookUrl}>
          <p>Send messages from the CRM and receive replies on the lead. In Meta's WhatsApp settings, paste the webhook URL, use WHATSAPP_VERIFY_TOKEN as the verify token, and subscribe to "messages".</p>
          <p className="text-xs">Free-text messages only work within 24 hours of the customer's last message; outside that, Meta requires an approved template (set it on an auto WhatsApp sequence step).</p>
        </Row>
        <Row on={i.meta?.configured} title="Facebook / Instagram lead ads + Instagram DMs" vars="META_APP_SECRET, META_VERIFY_TOKEN, META_PAGE_ACCESS_TOKEN · optional LEAD_DEFAULT_OWNER, LEAD_NOTIFY_EMAILS" url={i.meta?.webhookUrl}>
          <p>In your Meta app, add the webhook URL for the Page ("leadgen" field) and for Instagram ("messages" field). Each lead-ad submission and each new DM becomes a lead.</p>
        </Row>
        <Row on={i.razorpay?.configured && i.razorpay?.webhookReady} title="Razorpay payment links" vars="RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET" url={i.razorpay?.webhookUrl}>
          <p>Adds a "Pay online" link to invoices. In Razorpay → Webhooks, paste the URL, set the secret and tick "payment_link.paid". Payments then mark invoices paid automatically.</p>
        </Row>
        <Row on={i.automation?.invoiceReminders} title="Automatic invoice reminders" vars="INVOICE_REMINDERS_ENABLED=true · optional BILLING_HOUR (default 10)">
          <p>Emails clients 3 days before the due date, on the due date, and 7 / 14 / 30 days overdue.</p>
        </Row>
        <Row on={i.automation?.sequences} title="Sequence runner" vars="optional SEQUENCES_DISABLED=true, SEQUENCE_SEND_HOURS (default 9-19)">
          <p>Checks every 5 minutes; automatic sends only go out in business hours ({i.automation?.sequenceSendHours || "9-19"}).</p>
        </Row>
        <Row on={i.automation?.retainerBilling} title="Monthly retainer invoices" vars="optional RETAINER_BILLING_DISABLED=true · INVOICE_PREFIX, COMPANY_GSTIN, COMPANY_BANK_NAME, COMPANY_BANK_ACCOUNT, COMPANY_BANK_IFSC, COMPANY_UPI_ID">
          <p>On each retainer's billing day a draft invoice is created (or sent, if "auto-send" is ticked on the retainer). Contracts auto-renew or end on their end date.</p>
        </Row>
        <p className="text-xs text-gray-500">Public links use {i.appUrl || "CRM_APP_URL"} (CRM_APP_URL) and tracking uses {i.publicApiUrl || "CRM_API_PUBLIC_URL"}.</p>
      </div>
    </CrmRoute>
  );
};

export default Integrations;
