import type { InventionSession } from "./types";

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export type InventionSessionStore = {
  createSession(title: string, description: string): InventionSession;
  getSession(id: string): InventionSession | undefined;
  appendAnswer(id: string, answer: string): InventionSession | null;
};

export function createMemoryInventionSessionStore(): InventionSessionStore {
  const sessions = new Map<string, InventionSession>();

  function purgeExpired() {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [id, session] of sessions) {
      if (session.createdAt < cutoff) sessions.delete(id);
    }
  }

  return {
    createSession(title: string, description: string): InventionSession {
      purgeExpired();
      const id = crypto.randomUUID();
      const session: InventionSession = {
        id,
        title,
        description,
        answers: [],
        createdAt: Date.now(),
      };
      sessions.set(id, session);
      return session;
    },
    getSession(id: string): InventionSession | undefined {
      const session = sessions.get(id);
      if (!session) return undefined;
      if (Date.now() - session.createdAt > SESSION_TTL_MS) {
        sessions.delete(id);
        return undefined;
      }
      return session;
    },
    appendAnswer(id: string, answer: string): InventionSession | null {
      const session = this.getSession(id);
      if (!session) return null;
      session.answers.push(answer);
      return session;
    },
  };
}

let singleton: InventionSessionStore | null = null;

export function getInventionSessionStore(): InventionSessionStore {
  if (!singleton) singleton = createMemoryInventionSessionStore();
  return singleton;
}
