declare module 'nodemailer' {
  export interface SendMailOptions {
    from?: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }

  export interface Transporter {
    sendMail: (mail: SendMailOptions) => Promise<unknown>;
  }

  export interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user?: string;
      pass?: string;
    };
  }

  export function createTransport(options: TransportOptions): Transporter;

  const nodemailer: {
    createTransport: typeof createTransport;
  };

  export default nodemailer;
}
