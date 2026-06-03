export type AisleStore = {
  id: string;
  business_name: string;
  instagram_handle: string;
};

export type AisleProduct = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  available: boolean;
};

export type AisleCatalogueResponse = {
  store: AisleStore;
  products: AisleProduct[];
  total: number;
};

export type AisleCatalogueError = {
  error: string;
};
