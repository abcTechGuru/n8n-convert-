export interface Lead {
    email: string;
    first_name?: string;
    last_name?: string;
    company?: string;
    headline?: string;
    website_url?: string;
    email_valid?: boolean;
    [key: string]: any;
  }
  