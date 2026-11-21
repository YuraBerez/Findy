---
name: findy
description: Track the user's job search in Findy, a desktop kanban board of job applications, through its MCP tools. Use when the user talks about job applications, vacancies they applied to, interviews, test tasks, offers or rejections, asks how their job search is going, or wants to prepare for an interview, and the Findy tools (list_applications, add_application…) are available or Findy is mentioned.
---

# Findy: the user's job search board

Findy keeps every job application of the user on a board. Each application is a card in a
column (stage). You work with the board through the Findy MCP tools. The data stays on
the user's computer; you see it only when you call a tool.

## When the tools are not there

If the Findy tools are not in your tool list, or a tool answers that "AI assistant access"
is turned off, do not guess and do not invent applications. Tell the user:

1. Open Findy, then **⋯ → Settings… → AI assistant**, and turn on access. In Findy 0.5
   and older the item is **⋯ → AI assistant access (MCP)…**.
2. If the assistant is not connected yet, copy the configuration from the same page
   into the assistant (Claude Desktop: `claude_desktop_config.json`; Claude Code: the
   `claude mcp add findy …` command), then restart the assistant.

Then stop and wait for the user.

## Stages

| id | Name | Meaning |
|----|------|---------|
| `applied` | Applied | The user sent the application |
| `hr_interview` | HR interview | A call or meeting with a recruiter |
| `test_task` | Test task | A take-home task |
| `technical_interview` | Technical interview | An interview about skills |
| `c_level_interview` | C-level interview | An interview with a manager or a founder |
| `offered` | Offer | The company made an offer |
| `rejected` | Rejected | The company or the user said no |

The user can hide columns in the app. A new application or a move into a hidden stage
fails; tell the user and ask which stage to use.

## Fields of an application

- `title` (job title) and `company`: required, 1–200 characters.
- `url`: the vacancy link, `http` or `https`.
- `salary`: `{ min, max, currency, period }`. Whole numbers; at least one of `min` and
  `max`; `min ≤ max`; `currency` is `USD`, `EUR`, `UAH`, `GBP` or `PLN`; `period` is
  `month` or `year`. `null` clears it.
- `workFormat`: `remote`, `office` or `hybrid`.
- `location`: free text, for example "Lviv" or "EU time zone".
- `source`: text. A job site name ("Djinni", "LinkedIn", "DOU", "Work.ua"…), one of
  "Referral", "Company website", "Recruiter contacted me", "Other", or the name of the
  user's own site. If you leave it out on a new application with a job site link, Findy
  fills it in.
- `contactName` and `contactDetails`: the recruiter and how to reach them.
- `nextStep`: the one next step, `{ text, date, time }`. `text` is one line (up to 200
  characters), `date` is `YYYY-MM-DD`, and `time` is `HH:MM` (24 h) or left out for all
  day. Both are the user's local time. Findy shows it on the card and reminds the user.
  A new value replaces the old one; `null` clears it.
- Read only: `stage`, `stageName`, `inStageSince` (when it entered its stage), notes,
  stage history, `createdAt`, `updatedAt`.

## Tools

### list_stages

The stages in board order, with `hidden: true` for the hidden ones. Call it before a move
if you are not sure that a stage is visible.

### list_applications

All applications in board order, without note texts. Optional `stage` (an id) and
`query` (text in the title, the company, the location, the source, the contact or the
next step). Use it
to find an application by company before you change it, and for a review.

### get_application

One application by `id`, with all notes (newest first) and the stage history. Use it when
you need the notes, for example to prepare for an interview.

### add_application

Adds an application on top of its column. Inputs: `title`, `company`, and optional `url`,
`stage` (default `applied`) and the fields above.

### update_application

Changes the given fields of an application by `id`: `title`, `company`, `url` and the
fields above. A field that you leave out does not change; `null` clears it. It cannot
change the stage.

### move_application

Moves an application by `id` to the top of `stage` and records the change in its history.

### add_note

Adds a note (`id`, `text`) to an application. Keep the user's words; line breaks stay.

### delete_application

Deletes an application by `id` with its notes and history. This cannot be undone. Use it
only after the user confirms (see Rules).

## Rules

1. **No duplicates.** Before you add an application, call `list_applications` with the
   company as `query`. If the same job is there, ask the user if they mean that one.
2. **Do not invent data.** Never guess a job title, a company, a salary, a date or a
   stage. If a required value is missing, ask. Do not fill a field that the user did not
   give, except the facts on a vacancy page that the user shared.
3. **Delete only after a confirmation.** Name the application ("Frontend Developer at
   Acme") and ask "Delete it?". Call `delete_application` only after a clear yes.
4. **Stages follow the user.** Move an application only when the user says that its
   stage changed. "I have an interview next week" does not mean that it took place.
5. **Say what changed.** After each change, tell the user in one short sentence, for
   example "Moved Globex to Technical interview and added your note."
6. **Read what you need.** Use `list_applications` for an overview and `get_application`
   for one application. Do not copy long notes into the answer without a reason.
7. **Use the user's language** in notes and answers. Keep company names and job titles
   as the user writes them.

## Workflows

### Add an application

The user says "I applied to Acme as a frontend developer" or shares a vacancy link.

1. Find the title, the company and the link in the message. If you can read the vacancy
   page, take the salary, the work format and the location from it too.
2. Look for a duplicate (rule 1).
3. Ask for a missing title or company (rule 2).
4. Call `add_application`. Use the stage that the user names; else `applied`.
5. Confirm in one sentence (rule 5).

### Update after an interview

The user says "I had the technical interview at Globex, they asked about React".

1. Find the application with `list_applications` and the company as `query`. If there
   are several, ask which one.
2. If the stage changed, call `move_application`.
3. Call `add_note` with what the user said: the date, the people, the questions, the
   next steps.
4. If the user gave a salary or a contact, call `update_application`. If the user named
   the next step with a date ("the final call is on Tuesday at 11:00"), set `nextStep`
   too. Turn a relative day into a date and say the date in your answer.
5. Confirm (rule 5).

### Review the job search

The user asks "How is my job search going?".

1. Call `list_applications`.
2. Give the number of applications per stage, without the empty stages.
3. List the applications outside Offer and Rejected that have been in their stage for more
   than 14 days (from `inStageSince`; 14 days is Findy's default for "no movement").
   Suggest a follow-up for each, for example a short message to the contact.
4. Name the next steps that are due today or overdue (from `nextStep`), then the offers
   and the interviews in progress.
5. Keep it short: a few lines and a list. Do not change anything.

### Prepare for an interview

The user asks "Prepare me for the Globex interview".

1. Find the application, then call `get_application`.
2. Write a short brief: the job and the company, the stage and how long it has been in
   it, the salary and the work format, the contact, and the main points of the notes
   (questions asked before, agreements, next steps).
3. If the user asks, add a list of questions to prepare. Do not save the brief as a note
   unless the user asks.
