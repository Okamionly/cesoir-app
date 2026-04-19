/**
 * Mock profile photo gradients.
 *
 * Used by PhotoGallery when real photos are not available. 3 sets of
 * 4 gradients each; profile id deterministically maps to one set.
 * Product-semantic (visual variety for mock data) — not UI tokens.
 */

const GRADIENT_SETS: string[][] = [
  [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  ],
  [
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  ],
  [
    "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
    "linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)",
    "linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)",
    "linear-gradient(135deg, #feada6 0%, #f5efef 100%)",
  ],
];

export function getMockGradients(profileId: string): string[] {
  const hash = profileId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADIENT_SETS[hash % GRADIENT_SETS.length];
}
