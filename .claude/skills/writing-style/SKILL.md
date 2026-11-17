---
name: writing-style
description: Writing style for Findy's English documentation — a practical subset of ASD-STE100 Simplified Technical English. Use whenever you write or change English docs — specs, plans, tasks, docs/, README, CONTRIBUTING, skills, code-doc comments, commit bodies, PR and issue descriptions. Not for in-app UI copy (that follows /localization) and not for Ukrainian text.
---

# /writing-style — simple technical English

Findy is open source. Many contributors read English as a second language. So all English
documentation uses a subset of **ASD-STE100 Simplified Technical English (STE)**
([asd-ste100.org](https://asd-ste100.org/about_STE.html)).

## Scope

- **Applies to:** `specs/**`, `docs/**`, `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`,
  skills, doc comments, commit bodies, PR and issue descriptions.
- **Does not apply to:** UI strings (`/localization`), code identifiers, quoted text
  (error messages, user words), `README.uk.md` and other Ukrainian text.
- **Existing text:** apply the rules to the parts that you change. Do not rewrite a whole
  file only for style.

## Rules

### Words

1. Use simple, common words, and one word for one meaning. Write "use", not "utilize";
   "start", not "initiate"; "show", not "surface".
2. Use the project terms without change: *application*, *stage*, *note*, *board*,
   requirement ids (`FR-020`), code names in backticks.
3. Do not stack more than three nouns. Write "the order of cards in a stage", not
   "stage card order position".
4. No slang and no figures of speech.

### Sentences

5. Instructions: 20 words or fewer, one instruction per sentence.
6. Descriptions: 25 words or fewer per sentence, six sentences or fewer per paragraph.
7. Use the imperative for instructions: "Run the tests.", not "You should run the tests."
8. Put a condition before the instruction: "If CI fails, fix the test first."
9. Use the active voice in instructions.
10. Use simple tenses. Write "fails", not "is failing".
11. Keep the articles ("the", "a") and "that".
12. Use a list when you have more than two items or steps.

### Warnings

13. Start a warning with a clear command, then give the reason in one sentence:
    "Do not edit a released migration. Users already have databases with that schema."

## Check before you commit

- Count the words in the long sentences.
- Find "-ing" verbs, passive instructions and sentences with two instructions.

A style issue in review is 🟡, never a blocker, unless the text is so unclear that it can
cause a wrong action.
