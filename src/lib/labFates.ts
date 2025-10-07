export interface LabFate {
  text: string;
  category: "positive" | "neutral" | "negative" | "rare";
  icon: string;
}

export const labFates: LabFate[] = [
  // Positive Outcomes
  {
    text: "Unexpected success! Publish immediately!",
    category: "positive",
    icon: "🎯"
  },
  {
    text: "Perfect PCR bands on the first try.",
    category: "positive",
    icon: "✨"
  },
  {
    text: "All reagents magically fresh.",
    category: "positive",
    icon: "⚗️"
  },
  {
    text: "Equipment aligned, samples cooperative.",
    category: "positive",
    icon: "🔬"
  },
  {
    text: "Graduate student morale: surprisingly high.",
    category: "positive",
    icon: "😊"
  },
  {
    text: "Lab spirits smiling upon you today.",
    category: "positive",
    icon: "✅"
  },
  {
    text: "Crystal-clear Western blot incoming.",
    category: "positive",
    icon: "💎"
  },
  {
    text: "Cell cultures thriving beautifully.",
    category: "positive",
    icon: "🧬"
  },
  {
    text: "Data analysis reveals significance.",
    category: "positive",
    icon: "📊"
  },
  {
    text: "Hypothesis confirmed—celebrate!",
    category: "positive",
    icon: "🎉"
  },
  {
    text: "Zero contamination detected.",
    category: "positive",
    icon: "🛡️"
  },
  {
    text: "Equipment maintenance not needed.",
    category: "positive",
    icon: "🔧"
  },
  {
    text: "All samples accounted for.",
    category: "positive",
    icon: "📝"
  },
  {
    text: "Supervisor impressed by progress.",
    category: "positive",
    icon: "👍"
  },
  {
    text: "Protocol worked exactly as written.",
    category: "positive",
    icon: "📖"
  },

  // Neutral or Ambiguous Outcomes
  {
    text: "Results… inconclusive. Again.",
    category: "neutral",
    icon: "🤔"
  },
  {
    text: "Coffee consumption required for progress.",
    category: "neutral",
    icon: "☕"
  },
  {
    text: "One pipette tip box left—make it count.",
    category: "neutral",
    icon: "⚠️"
  },
  {
    text: "Ambiguous gel patterns emerging.",
    category: "neutral",
    icon: "🌫️"
  },
  {
    text: "Recalibrating expectations.",
    category: "neutral",
    icon: "🔄"
  },
  {
    text: "Sample recovery: statistically acceptable.",
    category: "neutral",
    icon: "📈"
  },
  {
    text: "Proceed with cautious optimism.",
    category: "neutral",
    icon: "🚶"
  },
  {
    text: "Standard deviation: surprisingly standard.",
    category: "neutral",
    icon: "📐"
  },
  {
    text: "The p-value is... interesting.",
    category: "neutral",
    icon: "🎲"
  },
  {
    text: "Troubleshooting protocol initiated.",
    category: "neutral",
    icon: "🔍"
  },
  {
    text: "Another day in the lab awaits.",
    category: "neutral",
    icon: "📅"
  },
  {
    text: "Results require further investigation.",
    category: "neutral",
    icon: "🔬"
  },

  // Chaotic or Negative Outcomes
  {
    text: "Technical failure: repeat entire experiment.",
    category: "negative",
    icon: "❌"
  },
  {
    text: "Broken centrifuge lid detected.",
    category: "negative",
    icon: "💥"
  },
  {
    text: "Power outage during incubation.",
    category: "negative",
    icon: "⚡"
  },
  {
    text: "Contamination strikes again.",
    category: "negative",
    icon: "🦠"
  },
  {
    text: "Forgot to label tubes—good luck.",
    category: "negative",
    icon: "🏷️"
  },
  {
    text: "Reagents expired last month.",
    category: "negative",
    icon: "🗓️"
  },
  {
    text: "Pipette mysteriously missing.",
    category: "negative",
    icon: "🔎"
  },
  {
    text: "Lab ghost interfered with results.",
    category: "negative",
    icon: "👻"
  },
  {
    text: "Freezer alarm going off at 3 AM.",
    category: "negative",
    icon: "🚨"
  },
  {
    text: "Sample tube cracked in storage.",
    category: "negative",
    icon: "💔"
  },
  {
    text: "Protocol missing critical step.",
    category: "negative",
    icon: "🚫"
  },
  {
    text: "Autoclave cycle: incomplete.",
    category: "negative",
    icon: "🌡️"
  },
  {
    text: "Grant deadline moved up unexpectedly.",
    category: "negative",
    icon: "⏰"
  },
  {
    text: "Negative controls showing signal.",
    category: "negative",
    icon: "🔴"
  },
  {
    text: "Lab meeting in 5 minutes, unprepared.",
    category: "negative",
    icon: "😰"
  },

  // Rare Easter Eggs (1% chance each)
  {
    text: "You have achieved Nobel Prize-worthy results!",
    category: "rare",
    icon: "🏆"
  },
  {
    text: "Lab unicorn sighting confirmed—impossible results!",
    category: "rare",
    icon: "🦄"
  },
  {
    text: "Time-travel paradox detected in your data.",
    category: "rare",
    icon: "⏳"
  }
];

const spinIcons = ["⚗️", "🧪", "🔥", "💥", "💧", "✨"];

export function getRandomLabFate(): LabFate {
  const random = Math.random();
  
  // 3% chance for rare outcomes (1% each)
  if (random < 0.03) {
    const rareOutcomes = labFates.filter(f => f.category === "rare");
    return rareOutcomes[Math.floor(Math.random() * rareOutcomes.length)];
  }
  
  // Regular outcomes: weighted distribution
  const regularOutcomes = labFates.filter(f => f.category !== "rare");
  return regularOutcomes[Math.floor(Math.random() * regularOutcomes.length)];
}

export function getRandomSpinIcon(): string {
  return spinIcons[Math.floor(Math.random() * spinIcons.length)];
}
