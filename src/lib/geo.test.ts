import { describe, it, expect } from 'vitest';
import { haversineKm, bearing, estimateEtaMinutes, findCurrentStopOrder } from '@/lib/geo';

describe('haversineKm', () => {
  it('calculates distance between Dhaka and Chittagong as approximately 242 km', () => {
    const dhaka = { lat: 23.8103, lng: 90.4125 };
    const chittagong = { lat: 22.3569, lng: 91.7832 };
    const dist = haversineKm(dhaka, chittagong);
    expect(dist).toBeGreaterThan(200);
    expect(dist).toBeLessThan(230);
  });

  it('returns 0 for identical points', () => {
    const point = { lat: 23.8759, lng: 90.3195 };
    expect(haversineKm(point, point)).toBe(0);
  });
});

describe('bearing', () => {
  it('returns 0 for northward direction', () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 1, lng: 0 };
    const brng = bearing(a, b);
    expect(brng).toBe(0);
  });

  it('returns approximately 90 for eastward direction', () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 1 };
    const brng = bearing(a, b);
    expect(brng).toBeGreaterThan(85);
    expect(brng).toBeLessThan(95);
  });

  it('returns approximately 180 for southward direction', () => {
    const a = { lat: 1, lng: 0 };
    const b = { lat: 0, lng: 0 };
    const brng = bearing(a, b);
    expect(brng).toBeGreaterThan(175);
    expect(brng).toBeLessThan(185);
  });

  it('returns approximately 270 for westward direction', () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: -1 };
    const brng = bearing(a, b);
    expect(brng).toBeGreaterThan(265);
    expect(brng).toBeLessThan(275);
  });
});

describe('estimateEtaMinutes', () => {
  const stops = [
    { lat: 23.876, lng: 90.319, stop_order: 1, name: 'Stop A' },
    { lat: 23.880, lng: 90.325, stop_order: 2, name: 'Stop B' },
    { lat: 23.885, lng: 90.330, stop_order: 3, name: 'Stop C' },
  ];

  it('returns null when no upcoming stops exist', () => {
    const result = estimateEtaMinutes(
      { lat: 23.876, lng: 90.319 },
      30,
      stops,
      3,
    );
    expect(result).toBeNull();
  });

  it('returns null when stops array is empty', () => {
    const result = estimateEtaMinutes(
      { lat: 23.876, lng: 90.319 },
      30,
      [],
      0,
    );
    expect(result).toBeNull();
  });

  it('uses minimum speed of 10 km/h when bus speed is 0', () => {
    const result = estimateEtaMinutes(
      { lat: 23.876, lng: 90.319 },
      0,
      stops,
      1,
    );
    expect(result).not.toBeNull();
    expect(result!.etaMinutes).toBeGreaterThan(0);
  });

  it('calculates ETA for normal case', () => {
    const result = estimateEtaMinutes(
      { lat: 23.876, lng: 90.319 },
      30,
      stops,
      1,
    );
    expect(result).not.toBeNull();
    expect(result!.stopName).toBeDefined();
    expect(result!.etaMinutes).toBeGreaterThan(0);
    expect(result!.etaMinutes).toBeLessThanOrEqual(99);
  });

  it('caps ETA at 99 minutes', () => {
    const farStops = [
      { lat: 24.5, lng: 91.0, stop_order: 2, name: 'Far stop' },
    ];
    const result = estimateEtaMinutes(
      { lat: 23.876, lng: 90.319 },
      1,
      farStops,
      1,
    );
    expect(result).not.toBeNull();
    expect(result!.etaMinutes).toBeLessThanOrEqual(99);
  });
});

describe('findCurrentStopOrder', () => {
  it('returns 0 for empty stops', () => {
    expect(findCurrentStopOrder({ lat: 0, lng: 0 }, [])).toBe(0);
  });

  it('returns stop_order of closest stop', () => {
    const stops = [
      { lat: 23.876, lng: 90.319, stop_order: 1, name: 'A' },
      { lat: 23.890, lng: 90.340, stop_order: 2, name: 'B' },
    ];
    const result = findCurrentStopOrder({ lat: 23.877, lng: 90.320 }, stops);
    expect(result).toBe(1);
  });
});
