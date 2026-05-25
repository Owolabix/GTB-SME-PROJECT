export type DmActivityRow = {
  id: string;
  status: string;
  error: string | null;
  created_at: string;
  recipientLabel: string;
  messagePreview: string | null;
  canPickUp: boolean;
};
