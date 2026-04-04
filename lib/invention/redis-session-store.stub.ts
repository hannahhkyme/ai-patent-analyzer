import type { InventionSession } from "./types";
import type { InventionSessionStore } from "./session-store";

/**
 * Placeholder for multi-instance / serverless deployments.
 * Replace in-memory {@link getInventionSessionStore} with a Redis- or DB-backed implementation.
 */
export class RedisInventionSessionStoreStub implements InventionSessionStore {
  async createSession(_title: string, _description: string): Promise<InventionSession> {
    void _title;
    void _description;
    throw new Error("RedisInventionSessionStoreStub: use createMemoryInventionSessionStore or implement Redis.");
  }

  async getSession(_id: string): Promise<InventionSession | undefined> {
    void _id;
    return undefined;
  }

  async appendAnswer(_id: string, _answer: string): Promise<InventionSession | null> {
    void _id;
    void _answer;
    return null;
  }
}
