# CallingIn — Project Journey

A first-person record of my work, feelings, confusion, and learning while
building CallingIn with generative AI and LLM agents. I plan to use these
entries later for a memoir-style account and a research paper about how these
tools can help developers create applications. These are my personal
observations, not general research findings. I will record measured time and
token usage only when I have evidence; otherwise, I will describe my experience
without inventing numbers.
Keep this file on `main`. Add a dated entry each week and after each sprint merge.
Record completed actions separately from plans; include only confirmed results.

## October 13, 2026 — Sprint 01 documentation organization

- **Work:** Sprint 01 documentation was organized in the sprint branch working
  folder. Commands and testing notes received Sprint 01 names. The duplicate
  AI development log was consolidated, and documentation links were updated.
- **Learning:** Git branches contain snapshots of the whole project. Removing
  shared documents from a sprint branch can also remove them during a merge,
  so main's shared records need deliberate preservation.
- **Verification:** Local documentation link and whitespace checks passed for
  the sprint organization. A fresh full application check has not been run for
  this documentation update.
- **Git status:** Sprint organization has not yet been committed or pushed by
  the assistant. The daily guide and this journey were prepared in a separate
  local main checkout. No staging, commits, pushes, or merges were performed
  by the assistant.
- **Next:** Review the documents, run checks, commit and push the approved work,
  then finish the sprint merge while preserving shared records on main.

## October 13, 2026 — Sprint 01 merge review

- **Work:** Resolved documentation rename and content conflicts, retained shared
  main records, and added Prettier and ESLint fix commands to the daily guide.
- **Learning:** Formatting a file does not resolve Git conflict markers; choose
  the intended content first, then format and stage the resolution.
- **Git status:** Merge is being reviewed; its final commit and push remain pending.
- **Next:** Record final check results, then commit and push the reviewed merge.

## October 13, 2026 — Learning to work with LLM agents

### Excitement and uncertainty

I had never used an LLM agent to create an application before this project.
I was excited and terrified at the same time. I wanted to see how much these
tools could help me build, but I also wanted to understand what they were doing.

I downloaded the Codex application and connected the coding agent to VS Code.
Having an agent that could access my project files made the work feel much
easier at first. I could ask for changes directly instead of doing every step
myself. In the beginning, the process seemed simple.

### Where I became lost

As the project grew, I started to lose track of the changes. I needed to think
about token usage, context limits, prompts, and how much control I was giving
the agent. At times, Codex felt as though it was moving too quickly for me to
follow. The amount of work it could produce did not mean that I understood
that work.

I had limited experience with Git branches. Understanding the difference
between a branch, a local folder, a worktree, and the repository on GitHub took
time. The separate local main checkout was especially confusing: I initially
did not understand where the new files were saved or how they belonged to the
same repository.

I also spent a lot of time reviewing and organizing files, understanding which
records belonged on main and which belonged to Sprint 01, and resolving the
confusion around merging. More files had been created or downloaded than I
could easily keep track of. Cleaning up the structure and understanding the
workflow became a substantial part of the work. I have not measured the time
spent on these activities.

### Automation versus understanding

At first, I was willing to let the agent handle almost everything, including
preparing the Git workflow. I found myself trying to understand the actions
afterward rather than learning them as they happened. I felt that I was
spending more time figuring out what the agent had done than understanding
what I should do next.

For accuracy, the recorded Sprint 01 commit, push, and merge commands were
ultimately run by me, with Codex providing instructions and resolving approved
file conflicts. My concern was the amount of control I had delegated and how
little I understood the workflow at first.

I decided to change that approach. I now ask Codex to explain what it intends
to do, why it is needed, and how it will work before changing anything. I want
to approve the changes and run the Git commands myself. Asking what each
command does helps me connect the action to its purpose. The daily command
guide gives me a reference I can return to rather than relying on memory.

### How I am dividing work between tools

I started using ChatGPT for general questions and explanations, partly because
I wanted to conserve the token budget I was using for coding-agent work. This
is my intended strategy; I have not measured whether it reduces total token
usage or cost.

My current approach is to use ChatGPT for general discussion and clarification,
and Codex for inspecting files, implementing approved changes, and running
checks. I also installed a Claude extension and plan to explore using Claude
for design. I am still learning how to move between these tools and give each
one a clear task.

### What I want to carry into the next project

I feel more on track now that the files are organized and I understand more
of the branch workflow. I am learning to write clearer prompts, set limits
on what the agent may do, and ask for explanations before actions.

For this project, I want these tools to guide me through each step so that I
learn the process. In my next project, I want to know what to do, when to do
it, how to control the agents, and how to manage token usage. My goal is to
build the application while also building my own understanding.

### Questions for my later research and reflection

- Where does an agent save me time, and where do review and cleanup add work?
- How does requiring an explanation and approval affect my understanding?
- Which tasks are most useful to delegate, and which should I perform myself?
- What evidence would show whether using several tools changes token usage,
  cost, or the quality of the result?

### Technical outcome recorded separately

Sprint 01 was merged into main in commit `4f77717`. The subsequent frontend
security update changed `source-map-js` from 1.2.1 to 1.2.2; the frontend audit
then reported zero known vulnerabilities. Lint, formatting, both backend tests,
and the frontend build passed after that update. The dependency fix and the
current documentation updates are still uncommitted at the time of this entry.

## Weekly entry template

Copy this section for each update and replace the placeholders.

### YYYY-MM-DD — Sprint NN: short topic

- **Work:** What I completed this week.
- **Learning:** What I learned or a problem I solved.
- **Verification:** Checks actually run and their results; remaining checks.
- **Git status:** Branch, commit/push/merge outcomes actually confirmed.
- **Next:** My next small step or question for the advisor.
- **Experience:** What I felt, what confused me, and what helped me understand.
- **Agent use:** Tool, task delegated, approval given, and actions I ran myself.
- **Time and tokens:** Measured values if available; otherwise, a clearly labeled
  personal estimate or observation.
