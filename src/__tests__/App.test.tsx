import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import App from "../App";

// Mock Firebase services to avoid actual network/initialization errors in JSDOM
vi.mock("@/lib/firebase", () => ({
  default: {},
  app: {},
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn((authInstance, callback) => {
      // Mock immediately resolving with null user
      callback(null);
      return () => {};
    }),
  },
  db: {},
  storage: {},
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((authInstance, callback) => {
    callback(null);
    return () => {};
  }),
}));

describe("App Root", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });
});
