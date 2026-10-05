import { describe, expect, it } from "vitest";
import { calculateRiskScore, riskBandForScore } from "@/domain/risk";

describe("risk score", () => {
  it("multiplies application severity and likelihood weights", () => {
    expect(calculateRiskScore("low", "unlikely")).toBe(1);
    expect(calculateRiskScore("medium", "possible")).toBe(4);
    expect(calculateRiskScore("high", "possible")).toBe(6);
    expect(calculateRiskScore("high", "likely")).toBe(9);
    expect(calculateRiskScore("critical", "unlikely")).toBe(4);
    expect(calculateRiskScore("critical", "almost_certain")).toBe(16);
  });

  it("bands scores on the application matrix boundaries", () => {
    expect(riskBandForScore(1)).toBe("low");
    expect(riskBandForScore(3)).toBe("low");
    expect(riskBandForScore(4)).toBe("medium");
    expect(riskBandForScore(7)).toBe("medium");
    expect(riskBandForScore(8)).toBe("high");
    expect(riskBandForScore(11)).toBe("high");
    expect(riskBandForScore(12)).toBe("critical");
    expect(riskBandForScore(16)).toBe("critical");
  });

  it("rejects scores outside the matrix instead of clamping them", () => {
    expect(() => riskBandForScore(0)).toThrow(RangeError);
    expect(() => riskBandForScore(17)).toThrow(RangeError);
    expect(() => riskBandForScore(1.5)).toThrow(RangeError);
  });
});
