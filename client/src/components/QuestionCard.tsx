import type { Choice } from '../api/types';

interface QuestionCardProps {
  prompt: string;
  choices: Choice[];
  selectedChoiceId: number | null;
  onSelect: (choiceId: number) => void;
  disabled?: boolean;
}

export function QuestionCard({ prompt, choices, selectedChoiceId, onSelect, disabled }: QuestionCardProps) {
  return (
    <fieldset className="question-card" disabled={disabled}>
      <legend>{prompt}</legend>
      <div className="choice-list">
        {choices.map((choice) => (
          <label key={choice.id} className="choice">
            <input
              type="radio"
              name="choice"
              checked={selectedChoiceId === choice.id}
              onChange={() => onSelect(choice.id)}
            />
            {choice.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
