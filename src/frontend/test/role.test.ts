import { describe, it, expect } from "vitest";
import { getRole } from "../src/lib/role";

describe("getRole", () => {
  it("returns host when ?role=host is present", () => {
    expect(getRole("?role=host")).toBe("host");
  });

  it("defaults to viewer when the param is absent", () => {
    expect(getRole("")).toBe("viewer");
  });

  it("defaults to viewer for any other role value", () => {
    expect(getRole("?role=admin")).toBe("viewer");
  });
});
