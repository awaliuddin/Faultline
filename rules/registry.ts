import type { Rule, RuleFactory, Finding } from './base_rule.js';
import { createPiiRule } from './pii_rule.js';
import { createBiasRule } from './bias_rule.js';
import { createToxicityRule } from './toxicity_rule.js';

const builtInFactories: Record<string, RuleFactory> = {
  pii: createPiiRule,
  bias: createBiasRule,
  toxicity: createToxicityRule,
};

const customFactories: Record<string, RuleFactory> = {};

/**
 * Register a custom rule factory at runtime.
 */
export function registerRule(name: string, factory: RuleFactory): void {
  customFactories[name] = factory;
}

/**
 * Unregister a previously registered custom rule.
 * Returns true if the rule was found and removed.
 */
export function unregisterRule(name: string): boolean {
  if (name in customFactories) {
    delete customFactories[name];
    return true;
  }
  return false;
}

/**
 * Get a single rule instance by name.
 * Checks custom rules first, then built-ins.
 *
 * @throws Error if the rule is not registered.
 */
export function getRule(name: string): Rule {
  const factory = customFactories[name] ?? builtInFactories[name];
  if (!factory) {
    const available = listRules().join(', ');
    throw new Error(`Unknown rule "${name}". Available: ${available}`);
  }
  return factory();
}

/**
 * List all registered rule names (custom + built-in).
 */
export function listRules(): string[] {
  return [...new Set([...Object.keys(builtInFactories), ...Object.keys(customFactories)])];
}

/**
 * Get all rule instances (custom + built-in).
 */
export function getAllRules(): Rule[] {
  const names = listRules();
  return names.map((name) => getRule(name));
}

/**
 * Run all registered rules against content.
 * Returns aggregated findings sorted by offset.
 */
export function runAllRules(content: string): Finding[] {
  const rules = getAllRules();
  const findings: Finding[] = [];

  for (const rule of rules) {
    findings.push(...rule.check(content));
  }

  return findings.sort((a, b) => a.offset - b.offset);
}

/**
 * Run specific rules by name against content.
 *
 * @throws Error if any named rule is not registered.
 */
export function runRules(content: string, ruleNames: string[]): Finding[] {
  const findings: Finding[] = [];

  for (const name of ruleNames) {
    const rule = getRule(name);
    findings.push(...rule.check(content));
  }

  return findings.sort((a, b) => a.offset - b.offset);
}
