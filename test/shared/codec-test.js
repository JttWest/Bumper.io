const expect = require('chai').expect;
const codec = require('../../shared/codec');

describe('Shared: Codec', () => {
  it('gameSnapshot encoding', () => {
    const testSnapshotData = {
      players: [
        {
          id: -3,
          name: 'Bot-3',
          position: {
            x: 372.10,
            y: 172.15
          },
          points: 1,
          isKilled: false,
          status: {
            unmaterialized: 0
          }
        }],
      field: {
        zones: [
          {
            coord: {
              x: 0,
              y: 0
            },
            status: 'TRANSITION'
          }]
      }
    };

    const expectedDecodedResult = {
      players: [
        {
          id: -3,
          // name: 'Bot-3',
          position: {
            x: 372.1000061035156,
            y: 172.14999389648438
          },
          points: 1,
          isKilled: false,
          status: {
            unmaterialized: false
          }
        }],
      field: {
        zones: [
          {
            status: 'TRANSITION'
          }]
      }
    };

    const encoded = codec.gameStateSnapshot.encode(testSnapshotData);
    const decoded = codec.gameStateSnapshot.decode(encoded);

    expect(decoded).to.deep.equal(expectedDecodedResult);
  });
});

