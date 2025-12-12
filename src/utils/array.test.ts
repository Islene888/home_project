import { describe, expect, it } from "vitest";

import { compactMap, singleOrNull } from "./array";

describe("array", () => {
  describe("singleOrNull", () => {
    it("returns null if array is empty", () => {
      expect(singleOrNull([])).toBeNull();
    });

    it("returns the only item if array has one item", () => {
      expect(singleOrNull([1])).toBe(1);
      expect(singleOrNull([0])).toBe(0);
      expect(singleOrNull([false])).toBe(false);
      expect(singleOrNull([null])).toBeNull();
    });

    it("returns null if array has more than one item", () => {
      expect(singleOrNull([1, 2])).toBeNull();
    });

    it("returns null if the only item is undefined", () => {
      expect(singleOrNull([undefined])).toBeNull();
    });
  });

  describe("compactMap", () => {
    it("filters out null and undefined values", () => {
      expect(compactMap([1], () => null)).toEqual([]);
      expect(compactMap([1], () => undefined)).toEqual([]);
    });

    it("keeps other falsy values", () => {
      expect(compactMap([1], () => false)).toEqual([false]);
      expect(compactMap([1], () => 0)).toEqual([0]);
      expect(compactMap([1], () => "")).toEqual([""]);
    });

    it("runs map callback for each item", () => {
      expect(compactMap([1, 2, 3], (i) => i * 2)).toEqual([2, 4, 6]);
    });
  });
});
