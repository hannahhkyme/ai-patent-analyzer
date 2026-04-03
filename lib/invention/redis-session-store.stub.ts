import type { InventionSession } from "./types";
import type { InventionSessionStore } from "./session-store";

/**
 * Placeholder for multi-instance / serverless deployments.
 * Replace in-memory {@link getInventionSessionStore} with a Redis- or DB-backed implementation.
 */
export class RedisInventionSessionStoreStub implements InventionSessionStore {
  createSession(_title: string, _description: string): InventionSession {
    void _title;
    void _description;
    throw new Error("RedisInventionSessionStoreStub: use createMemoryInventionSessionStore or implement Redis.");
  }

  getSession(_id: string): InventionSession | undefined {
    void _id;
    return undefined;
  }

  appendAnswer(_id: string, _answer: string): InventionSession | null {
    void _id;
    void _answer;
    return null;
  }
}
