import {
  SegmentFactory,
  PersonalSegmentFactory,
  StudentSegmentFactory,
  BusinessSegmentFactory
} from "./SegmentFactory.js";

export const SEGMENTS = [
  PersonalSegmentFactory,
  StudentSegmentFactory,
  BusinessSegmentFactory
];

export const DEFAULT_SEGMENT_ID = PersonalSegmentFactory.ID;

/** Registry of the available factories. */
export function getSegmentFactory(id) {
  return SEGMENTS.find((Factory) => Factory.ID === id);
}

/** Builds a factory instance, falling back to Personal for unknown ids. */
export function createSegment(id) {
  const Factory = getSegmentFactory(id) ?? getSegmentFactory(DEFAULT_SEGMENT_ID);
  return new Factory();
}
