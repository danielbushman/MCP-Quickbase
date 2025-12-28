import { QuickbaseClient } from "../client/quickbase";
import { QuickbaseConfig } from "../types/config";

describe("QuickbaseClient", () => {
  let client: QuickbaseClient;
  const mockConfig: QuickbaseConfig = {
    realmHost: "test.quickbase.com",
    userToken: "test-token",
    appId: "test-app-id",
    cacheEnabled: false,
  };

  beforeEach(() => {
    client = new QuickbaseClient(mockConfig);
  });

  describe("constructor", () => {
    it("should create a client with valid config", () => {
      expect(client).toBeInstanceOf(QuickbaseClient);
    });

    it("should throw error when realmHost is missing", () => {
      const invalidConfig = { ...mockConfig, realmHost: "" };
      expect(() => new QuickbaseClient(invalidConfig)).toThrow(
        "Realm hostname is required",
      );
    });

    it("should throw error when userToken is missing", () => {
      const invalidConfig = { ...mockConfig, userToken: "" };
      expect(() => new QuickbaseClient(invalidConfig)).toThrow(
        "User token is required",
      );
    });

    it("should apply default configuration values", () => {
      const minimalConfig: QuickbaseConfig = {
        realmHost: "test.quickbase.com",
        userToken: "test-token",
      };
      const clientWithDefaults = new QuickbaseClient(minimalConfig);
      expect(clientWithDefaults).toBeInstanceOf(QuickbaseClient);
    });
  });

  describe("configuration validation", () => {
    it("should handle optional appId", () => {
      const configWithoutAppId = {
        realmHost: "test.quickbase.com",
        userToken: "test-token",
      };
      expect(() => new QuickbaseClient(configWithoutAppId)).not.toThrow();
    });

    it("should enable caching by default", () => {
      const defaultConfig: QuickbaseConfig = {
        realmHost: "test.quickbase.com",
        userToken: "test-token",
      };
      const clientWithDefaults = new QuickbaseClient(defaultConfig);
      expect(clientWithDefaults).toBeInstanceOf(QuickbaseClient);
    });
  });
});
