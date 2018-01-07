const configs = require('../app-configs');

// https://gist.github.com/christopher4lis/f9ccb589ee8ecf751481f05a8e59b1dc

/**
 * Rotates coordinate system for velocities
 *
 * Takes velocities and alters them as if the coordinate system they're on was rotated
 *
 * @param  Object | velocity | The velocity of an individual particle
 * @param  Float  | angle    | The angle of collision between two objects in radians
 * @return Object | The altered x and y velocities after the coordinate system has been rotated
 */

function rotate(velocity, angle) {
  const rotatedVelocities = {
    x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
    y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
  };

  return rotatedVelocities;
}

/**
* @param  Player
* @param  Player
* @returns Collision | { direction: Number, speed : Number }
*/

const resolveCollisionVelocity = (player1, player2) => {
  const xVelocityDiff = player1.velocity.x - player2.velocity.x;
  const yVelocityDiff = player1.velocity.y - player2.velocity.y;

  const xDist = player2.position.x - player1.position.x;
  const yDist = player2.position.y - player1.position.y;

  // Prevent accidental overlap of particles
  if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
    // Grab angle between the two colliding particles
    const angle = -Math.atan2(yDist, xDist);

    // Store mass in var for better readability in collision equation
    const m1 = player1.mass;
    const m2 = player2.mass;

    // Velocity before equation
    const u1 = rotate(player1.velocity, angle);
    const u2 = rotate(player2.velocity, angle);

    // Velocity after 1d collision equation
    const v1 = { x: u1.x * (m1 - m2) / (m1 + m2) + u2.x * 2 * m2 / (m1 + m2), y: u1.y };
    const v2 = { x: u2.x * (m1 - m2) / (m1 + m2) + u1.x * 2 * m2 / (m1 + m2), y: u2.y };

    // Final velocity after rotating axis back to original location
    const vFinal1 = rotate(v1, -angle);
    const vFinal2 = rotate(v2, -angle);

    // Swap particle velocities for realistic bounce effect
    player1.velocity.x = vFinal1.x;
    player1.velocity.y = vFinal1.y;

    player2.velocity.x = vFinal2.x;
    player2.velocity.y = vFinal2.y;
  }
};

// returns true of the 2 players has collided
const checkCollision = (p1, p2) => {
  const dx = p1.position.x - p2.position.x;
  const dy = p1.position.y - p2.position.y;

  // the players has collided
  if (Math.sqrt((dx * dx) + (dy * dy)) < 2 * configs.shared.playerRadius)
    return true;

  return false;
};

module.exports = {
  resolveCollisionVelocity,
  checkCollision
};
