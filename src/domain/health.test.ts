import { describe, expect, it } from "vitest";
import { serviceHealth } from "@/domain/health";

describe("service health", () => {
  it("identifies the service as a prototype that requires human review", () => {
    expect(serviceHealth()).toEqual({
      status: "ok",
      name: "SiteSense",
      prototype: true,
      humanReviewRequired: true,
    });
  });
});
