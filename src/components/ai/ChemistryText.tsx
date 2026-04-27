import React from "react";

const chemicalFormulaPattern = "\\b(?:[A-Z][a-z]?\\d*|\\([A-Za-z0-9]+\\)\\d*){2,}(?:\\^[0-9]*[+-]|[+-])?\\b";

function renderFormula(formula: string) {
  const parts: React.ReactNode[] = [];
  let index = 0;

  while (index < formula.length) {
    const char = formula[index];

    if (/\d/.test(char)) {
      let digits = char;
      index += 1;

      while (index < formula.length && /\d/.test(formula[index])) {
        digits += formula[index];
        index += 1;
      }

      parts.push(<sub key={parts.length}>{digits}</sub>);
      continue;
    }

    if (char === "^") {
      let charge = "";
      index += 1;

      while (index < formula.length && /[0-9+-]/.test(formula[index])) {
        charge += formula[index];
        index += 1;
      }

      if (charge) {
        parts.push(<sup key={parts.length}>{charge}</sup>);
      }
      continue;
    }

    if ((char === "+" || char === "-") && index === formula.length - 1) {
      parts.push(<sup key={parts.length}>{char}</sup>);
      index += 1;
      continue;
    }

    parts.push(char);
    index += 1;
  }

  return <span className="whitespace-nowrap font-medium tabular-nums">{parts}</span>;
}

export default function ChemistryText({ children }: { children: React.ReactNode }) {
  if (Array.isArray(children)) {
    return <>{children.map((child, index) => <ChemistryText key={index}>{child}</ChemistryText>)}</>;
  }

  if (React.isValidElement(children)) {
    return <>{children}</>;
  }

  if (typeof children !== "string" && typeof children !== "number") {
    return <>{children}</>;
  }

  const text = String(children);
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  const chemicalFormulaRegex = new RegExp(chemicalFormulaPattern, "g");
  let match = chemicalFormulaRegex.exec(text);

  while (match) {
    const formula = match[0];
    const index = match.index;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    nodes.push(<React.Fragment key={`${formula}-${index}`}>{renderFormula(formula)}</React.Fragment>);
    lastIndex = index + formula.length;
    match = chemicalFormulaRegex.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <>{nodes.length > 0 ? nodes : text}</>;
}
