import { examples } from "./examples";

const seed = Math.random().toString(36).slice(2, 10);
const language = "portuguese";
// Turn examples into forbidden text
const examples_text = examples.map(pair => pair[0] + "/" + pair[1]).join(" ");
// Categories for the model to choose from each time
const categories = ["nature", "food", "clothing", "activities", "places", "animals", "furniture", "transportation", "weather", "everyday objects"];
export const length = 150;
export const prompt = `
Rules:
- RETURN EXACTLY ONE JSON object which is a list of pairs like: '[["word1","word2"],["word3","word4"],["word5","word6"]]'. No new lines. NOTHING more nothing less.
- Make the list ${length} pairs long.
- All values MUST be single lowercase words.
- The pairs must be parallel-domain analogy, having the same "role" (like both are fruits, both are places for relaxation, etc.).
- No verbs or adjectives, only nouns.
- Words should be commonly known, natural for everyday people.
- Avoid overly obvious pairs but stay familiar.
- Do NOT repeat any of the forbidden, but good, examples: ${examples_text}.
- Randomly pick a category from this list each time: ${categories.join(", ")} and generate words from that category.
- Make it different every time.
- Seed: ${seed}
- Respond in ${language}.
`;

