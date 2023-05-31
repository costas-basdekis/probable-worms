import {Results} from "./Results";

describe("Results", () => {
  describe("serialise", () => {
    it("serialises empty results", () => {
      expect(new Results().serialise()).toEqual([]);
    });
    it("serialises results with 1 item", () => {
      expect(new Results([[1, 3]]).serialise()).toEqual([[1, 3]]);
    });
    it("serialises results with multiple items", () => {
      expect(new Results([[1, 3], [2, 5], [5, 4]]).serialise()).toEqual([[1, 3], [2, 5], [5, 4]]);
    });
    it("serialises results with multiple items in random order", () => {
      expect(new Results([[5, 4], [1, 3], [2, 5]]).serialise()).toEqual([[5, 4], [1, 3], [2, 5]]);
    });
  });
  describe("serialise + deserialise", () => {
    it("round-trips empty results", () => {
      expect(Results.deserialise(new Results().serialise())).toEqual(new Results());
    });
    it("round-trips results with 1 item", () => {
      expect(Results.deserialise(new Results([[1, 3]]).serialise())).toEqual(new Results([[1, 3]]));
    });
    it("round-trips results with multiple items", () => {
      expect(Results.deserialise(new Results([[1, 3], [2, 5], [5, 4]]).serialise())).toEqual(new Results([[1, 3], [2, 5], [5, 4]]));
    });
    it("round-trips results with multiple items in random order", () => {
      expect(Results.deserialise(new Results([[5, 4], [1, 3], [2, 5]]).serialise())).toEqual(new Results([[5, 4], [1, 3], [2, 5]]));
    });
  });
  describe("serialiseCompressed", () => {
    it("serialises empty results", () => {
      expect(new Results().serialiseCompressed()).toEqual([]);
    });
    it("serialises results with 1 item", () => {
      expect(new Results([[1, 3]]).serialiseCompressed()).toEqual([[1, 1, 3]]);
    });
    it("serialises results with multiple non-consecutive items", () => {
      expect(new Results([[1, 3], [3, 5], [5, 4]]).serialiseCompressed()).toEqual([[1, 1, 3], [3, 3, 5], [5, 5, 4]]);
    });
    it("serialises results with multiple non-consecutive items in random order", () => {
      expect(new Results([[5, 4], [1, 3], [3, 5]]).serialiseCompressed()).toEqual([[1, 1, 3], [3, 3, 5], [5, 5, 4]]);
    });
    it("serialises results with multiple consecutive non-grouped items", () => {
      expect(new Results([[1, 3], [2, 5], [3, 4]]).serialiseCompressed()).toEqual([[1, 1, 3], [2, 2, 5], [3, 3, 4]]);
    });
    it("serialises results with multiple consecutive grouped items", () => {
      expect(new Results([[1, 3], [2, 3], [3, 3], [4, 5], [5, 5]]).serialiseCompressed()).toEqual([[1, 3, 3], [4, 5, 5]]);
    });
    it("serialises results with multiple consecutive grouped items in random order", () => {
      expect(new Results([[1, 3], [5, 5], [2, 3], [4, 5], [3, 3]]).serialiseCompressed()).toEqual([[1, 3, 3], [4, 5, 5]]);
    });
  });
  describe("serialiseCompressed + deserialiseCompressed", () => {
    it("round-trips empty results", () => {
      expect(Results.deserialiseCompressed(new Results().serialiseCompressed())).toEqual(new Results());
    });
    it("round-trips results with 1 item", () => {
      expect(Results.deserialiseCompressed(new Results([[1, 3]]).serialiseCompressed())).toEqual(new Results([[1, 3]]));
    });
    it("round-trips results with multiple non-consecutive items", () => {
      expect(Results.deserialiseCompressed(new Results([[1, 3], [3, 5], [5, 4]]).serialiseCompressed())).toEqual(new Results([[1, 3], [3, 5], [5, 4]]));
    });
    it("round-trips results with multiple non-consecutive items in random order", () => {
      expect(Results.deserialiseCompressed(new Results([[5, 4], [1, 3], [3, 5]]).serialiseCompressed())).toEqual(new Results([[5, 4], [1, 3], [3, 5]]));
    });
    it("round-trips results with multiple consecutive non-grouped items", () => {
      expect(Results.deserialiseCompressed(new Results([[1, 3], [2, 5], [3, 4]]).serialiseCompressed())).toEqual(new Results([[1, 3], [2, 5], [3, 4]]));
    });
    it("round-trips results with multiple consecutive grouped items", () => {
      expect(Results.deserialiseCompressed(new Results([[1, 3], [2, 3], [3, 3], [4, 5], [5, 5]]).serialiseCompressed())).toEqual(new Results([[1, 3], [2, 3], [3, 3], [4, 5], [5, 5]]));
    });
    it("round-trips results with multiple consecutive grouped items in random order", () => {
      expect(Results.deserialiseCompressed(new Results([[1, 3], [5, 5], [2, 3], [4, 5], [3, 3]]).serialiseCompressed())).toEqual(new Results([[1, 3], [5, 5], [2, 3], [4, 5], [3, 3]]));
    });
  });
});
