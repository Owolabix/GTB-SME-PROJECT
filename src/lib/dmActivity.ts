export type DmActivityRow = {
  id: string;
  status: string;
  error: string | null;
  created_at: string;
  recipientLabel: string;
  instagramUsername: string | null;
  messagePreview: string | null;
  canPickUp: boolean;
};
