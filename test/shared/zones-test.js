const expect = require('chai').expect;
const Field = require('../../shared/models/field');

describe('Shared: Field model', () => {
  it('Zones has correct init data', () => {
    const testZones = new Field(2, 3, 100, 200);

    const expectedZonesData = [
      { coord: { x: 0, y: 0 }, status: -1 }, { coord: { x: 100, y: 0 }, status: -1 },
      { coord: { x: 0, y: 200 }, status: -1 }, { coord: { x: 100, y: 200 }, status: -1 },
      { coord: { x: 0, y: 400 }, status: -1 }, { coord: { x: 100, y: 400 }, status: -1 }
    ];

    expect(testZones.zones).to.deep.equal(expectedZonesData);
  });
});
