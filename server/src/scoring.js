export function computeScore(answers) {
  return answers.reduce((total, answer) => total + (answer.is_correct ? 1 : 0), 0);
}
