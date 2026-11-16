import type { Graphics } from 'pixi.js';

export type TownRole = 'education' | 'food' | 'trade' | 'industry';

const accent: Record<TownRole, number> = {
  education: 0x8acbd5,
  food: 0xb9cc79,
  trade: 0xf0bf78,
  industry: 0xe6a074,
};

const backing = 0x202d29;
const opening = 0x423b32;

const artwork: Record<TownRole, (g: Graphics) => void> = {
  education(g) {
    // A school with a blue pitched roof and a stepped entrance.
    g.poly([-8, 6, 5, 6, 9, 4, 9, 6, 5, 8, -8, 8]).fill(0xa88f69);
    g.rect(-7, -2, 12, 8).fill(0xe1cea0);
    g.poly([5, -2, 8, -4, 8, 4.5, 5, 6]).fill(0xb09673);
    g.poly([-8.5, -2, -1.5, -7, 6.5, -2, 4.5, -1, -7.5, -1]).fill(accent.education);
    g.poly([-1.5, -7, 2, -8.5, 9, -4.5, 6.5, -2]).fill(0x58939b);
    g.rect(-2.8, 2, 3.6, 4).fill(0x537173);
    g.rect(-6, 0.3, 1.8, 2.3).fill(0x537173);
    g.rect(2.1, 0.3, 1.8, 2.3).fill(0x537173);
  },
  food(g) {
    // Irrigated crop rows and a pair of leaves above the field.
    g.poly([-9, 3, 0, -0.5, 9, 2, 0, 7.5, -9, 4.5]).fill(0x52643b);
    g.poly([-9, 3, 0, -0.5, 9, 2, 0, 6, -9, 4]).fill(0x91a45e);
    g.poly([-7, 4.5, 2, 0.5, 4, 1, -4.7, 5.2]).fill(0xcabb79);
    g.poly([-3, 5.8, 6, 1.5, 8.1, 2, -0.5, 6.7]).fill(0x72a8aa);
    g.poly([-1.2, 2.5, -0.9, -4.4, 0.6, -4.3, 0.7, 1.7]).fill(0x98ae62);
    g.poly([-0.3, -2.7, -4.5, -3.2, -6.5, -7.2, -2.6, -6.4, 0, -4]).fill(accent.food);
    g.poly([0.1, -2.2, 0.4, -5.3, 5.8, -7.8, 4.8, -4.1]).fill(0xd6df99);
  },
  trade(g) {
    // A loaded lorry in profile. The canvas cover and cab have separate colors.
    g.poly([-9, 1.8, 9, 1.8, 8.6, 5.2, -9, 5.2]).fill(0xa96c42);
    g.roundRect(-9, -5.5, 11.4, 8.5, 1.5).fill(accent.trade);
    g.poly([-9, -4, 2.4, -4, 2.4, -2.6, -9, -2.6]).fill(0xffda95);
    g.rect(-6.5, -4, 1.1, 7).fill(0xc59356);
    g.rect(-1.7, -4, 1.1, 7).fill(0xc59356);
    g.poly([2.4, 3, 2.4, -4, 6.2, -4, 9, -0.3, 9, 3]).fill(0xd79a57);
    g.poly([4, -2.7, 5.6, -2.7, 7.2, -0.3, 4, -0.3]).fill(0x566961);
    g.circle(-5.4, 4.9, 2.4).fill(opening);
    g.circle(5.7, 4.9, 2.4).fill(opening);
    g.circle(-5.4, 4.9, .9).fill(0xe2ba81);
    g.circle(5.7, 4.9, .9).fill(0xe2ba81);
  },
  industry(g) {
    // A brick workshop with a sawtooth roof and a tall chimney.
    g.rect(4.5, -7.7, 3.2, 10.8).fill(0xb97557);
    g.rect(4, -8.3, 4.3, 1.6).fill(accent.industry);
    g.poly([-8.8, 6.7, -8.8, -3.4, -3.8, -.5, -3.8, -3.4, 1.2, -.5, 1.2, -3.4, 6.1, -.5, 6.1, 6.7]).fill(accent.industry);
    g.poly([6.1, -.5, 8.6, -1.8, 8.6, 5.2, 6.1, 6.7]).fill(0x9d5d4c);
    g.rect(-8.8, 5.4, 14.9, 1.3).fill(0xc78364);
    for (const x of [-6.9, -2.2, 2.5]) g.rect(x, 1.7, 2.8, 2.1).fill(opening);
  },
};

export function drawTownRole(graphics: Graphics, role: TownRole, size: number): void {
  const scale = size / 24;
  graphics.save().transform(scale, 0, 0, scale, 0, 0);
  graphics.roundRect(-12, -10, 24, 22, 4).fill({ color: 0x16221c, alpha: .52 });
  graphics.roundRect(-11.5, -11, 23, 21.8, 4).fill(backing)
    .stroke({ color: accent[role], width: .9 * scale, alpha: .88 });
  graphics.ellipse(0, 6.3, 9.8, 2.5).fill({ color: 0x101a17, alpha: .6 });
  artwork[role](graphics);
  graphics.restore();
}
