// app/(marketing)/landing/_content/team.ts
// Fixed name order from docs/decisions.md (coin toss result). Real names are filled in by the
// team; until then the roles alone are honest and accurate.

export interface TeamCredit {
  name: string;
  role: string;
}

export const TEAM_CREDITS: TeamCredit[] = [
  { name: 'Member 1', role: 'Senior Lead & Platform Owner' },
  { name: 'Member 2', role: 'Co-Lead, Guest & Commerce' },
  { name: 'Member 3', role: 'Co-Lead, Operations & Control' },
];
