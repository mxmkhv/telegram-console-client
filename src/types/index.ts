export type LogLevel = "quiet" | "info" | "verbose";
export type SessionMode = "persistent" | "ephemeral";
export type AuthMethod = "qr" | "phone";

export interface AppConfig {
  apiId: number;
  apiHash: string;
  sessionPersistence: SessionMode;
  logLevel: LogLevel;
  authMethod: AuthMethod;
}
