import { DiceRollResult, RulesetType } from '../types';

export function rollDice(
  formula: string,
  ruleset: RulesetType = 'dnd5e',
  target?: number,
  elevationDiff: number = 0 // positive = attacker is higher
): DiceRollResult {
  const clean = formula.trim().toLowerCase();
  
  // Match standard XdY (+/- Z)
  const match = clean.match(/^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?$/);
  
  if (!match) {
    // Fallback if user just entered a number like "15" for GURPS test
    if (ruleset === 'gurps' && !isNaN(Number(clean))) {
      return rollGurpsCheck(Number(clean), elevationDiff);
    }
    // Default 1d20
    return rollDice('1d20', ruleset, target, elevationDiff);
  }

  const numDice = parseInt(match[1], 10);
  const diceSides = parseInt(match[2], 10);
  const sign = match[3];
  const modValue = match[4] ? parseInt(match[4], 10) : 0;
  
  // Apply elevation modifier if any
  let finalMod = sign === '-' ? -modValue : modValue;
  if (elevationDiff > 0) {
    // High ground advantage
    if (ruleset === 'gurps') finalMod += 1; // +1 to attack in GURPS
    else if (ruleset === 'dnd5e') finalMod += 2; // +2 bonus for high ground
  } else if (elevationDiff < 0) {
    // Low ground disadvantage
    if (ruleset === 'gurps') finalMod -= 1;
    else if (ruleset === 'dnd5e') finalMod -= 2;
  }

  const rolls: number[] = [];
  let sum = 0;
  for (let i = 0; i < numDice; i++) {
    const r = Math.floor(Math.random() * diceSides) + 1;
    rolls.push(r);
    sum += r;
  }

  const total = sum + finalMod;
  let isCritSuccess = false;
  let isCritFailure = false;
  let breakdown = `[${rolls.join(', ')}]`;

  if (finalMod !== 0) {
    breakdown += ` ${finalMod >= 0 ? '+' : '-'} ${Math.abs(finalMod)}`;
    if (elevationDiff !== 0) {
      breakdown += ` (${elevationDiff > 0 ? 'Vantagem Altura +' : 'Desvantagem Altura '}${elevationDiff > 0 ? (ruleset === 'gurps' ? 1 : 2) : (ruleset === 'gurps' ? -1 : -2)})`;
    }
  }

  // D&D 5e d20 mechanics
  if (ruleset === 'dnd5e' && numDice === 1 && diceSides === 20) {
    const natural = rolls[0];
    if (natural === 20) isCritSuccess = true;
    if (natural === 1) isCritFailure = true;
  }

  // GURPS 3d6 mechanics
  if (ruleset === 'gurps' && numDice === 3 && diceSides === 6) {
    if (target !== undefined) {
      const margin = target - total;
      if (sum === 3 || sum === 4 || (sum === 5 && target >= 15) || (sum === 6 && target >= 16) || margin >= 10) {
        isCritSuccess = true;
      } else if (sum === 18 || (sum === 17 && target <= 15) || margin <= -10) {
        isCritFailure = true;
      }
      return {
        formula,
        rolls,
        modifier: finalMod,
        total,
        target,
        margin,
        isCritSuccess,
        isCritFailure,
        breakdown,
      };
    }
  }

  return {
    formula,
    rolls,
    modifier: finalMod,
    total,
    target,
    margin: target !== undefined ? (ruleset === 'gurps' ? target - total : total - target) : undefined,
    isCritSuccess,
    isCritFailure,
    breakdown,
  };
}

export function rollGurpsCheck(skillLevel: number, elevationDiff: number = 0): DiceRollResult {
  const target = skillLevel + (elevationDiff > 0 ? 1 : elevationDiff < 0 ? -1 : 0);
  const rolls: number[] = [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
  const sum = rolls[0] + rolls[1] + rolls[2];
  const margin = target - sum;
  
  let isCritSuccess = false;
  let isCritFailure = false;

  if (sum === 3 || sum === 4 || (sum === 5 && target >= 15) || (sum === 6 && target >= 16) || margin >= 10) {
    isCritSuccess = true;
  } else if (sum === 18 || (sum === 17 && target <= 15) || margin <= -10) {
    isCritFailure = true;
  }

  return {
    formula: `3d6 <= ${target}`,
    rolls,
    modifier: 0,
    total: sum,
    target,
    margin,
    isCritSuccess,
    isCritFailure,
    breakdown: `[${rolls.join(', ')}] = ${sum} (Alvo: ${target}${elevationDiff !== 0 ? ` incl. Altura` : ''}, Margem: ${margin >= 0 ? '+' : ''}${margin})`,
  };
}
