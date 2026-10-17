# CallingIn — Project Journey

## My essential process for working with AI agents

I will ask **WHAT, WHY, and HOW** so I understand each step:

- **WHAT:** What action will the agent take, and which files will it affect?
- **WHY:** Why is the action needed?
- **HOW:** How will it work, and how will we check the result?

Before changing or submitting anything, the agent must explain the proposed
step, ask my permission, and wait for my approval. This includes file edits,
installations, staging, commits, pushes, and merges. Approval for one step does
not automatically approve a new step outside that scope.

I want to learn as I build. The agent should guide me with clear explanations
and commands, and let me run the commands myself unless I explicitly ask it
to run them.

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

## October 16, 2026 — Sprint 02: Learning to review the agents' work

### From building features to checking how we build

During Sprint 02, I paused further authentication development to work through
Professor Lionelle's feedback about quality checks. I wanted to understand the
purpose of each recommendation before installing another tool. I continued
asking WHAT, WHY, and HOW and deciding which changes to approve one at a time.

I learned that having frontend and backend package.json files is normal, but
shared development tools do not need separate copies in each application.
Codex consolidated ESLint and Prettier at the project root while keeping the
application dependencies separate. We added limits for nesting depth, parameters,
and function size alongside cyclomatic complexity. When the frontend App exceeded
the function-size limit, it was split into smaller components and a connection
hook. I asked why these rules matter, and learned that they apply to individual
functions even when the whole project is still small.

### Questions helped me understand the tools

The phrase “add TypeScript” confused me because I wanted to keep JavaScript.
After asking, I understood the difference between changing the application's
language and using TypeScript as a development tool to check JavaScript through
JSDoc. The source stayed in .js and .jsx files. This was a useful example of why
I need explanations of terminology before agreeing to a change.

Accessibility brought another decision. The recommended JSX accessibility plugin
did not declare support for our ESLint version. Instead of forcing installation,
we reviewed compatibility and alternatives. Playwright with axe-core would need
two development packages and a test-browser download; a browser extension was
another option. I decided to ask my professor before adding that setup. A tool
being free does not mean that it requires no configuration or maintenance.

I also had trouble running Prettier because I supplied --write without naming
files. I learned to provide the exact paths, including the new Claude Markdown
files. Small command-line details still interrupt the work, so recording commands
and their purpose remains important to my learning.

### What testing revealed

We added coverage reporting and found that the first impressive-looking total
omitted server startup code because no test executed it. After adding startup
failure tests, the report included that file and exposed the lifecycle gaps.
We then refactored startup/shutdown for controlled testing and added meaningful
success and failure cases, including a real local port conflict.

The latest recorded backend run passed 31 tests and reported 100% lines,
branches, and functions across five source files. I am recording this as a
measurement of those tests, not proof that the application is fully correct.
The checks do not establish complete accessibility, frontend browser behavior,
or real account creation against Atlas. Those distinctions matter for my later
research: a single percentage can hide what was actually examined.

### Using Claude alongside Codex

I brought Claude into the process for an additional audit of the project's
guardrails. Its recommendations were organized by priority, with proposed changes,
benefits, and tradeoffs. I shared the audit with Codex so we could compare it
with the actual repository rather than applying the entire list automatically.

I used a pick-and-choose approach. We selected README corrections and Node-version
consistency, adding .nvmrc and aligning package requirements and the GitHub workflow.
Other recommendations, such as coverage thresholds, broader type checking, and
additional security or dependency tools, remain separate decisions. An audit
recommendation is not the same thing as completed work.

I also set up Claude's project-local quality-review skill, with SKILL.md,
rubric.md, report-template.md, and CLAUDE.md. The skill stores the instructions
so I do not have to rewrite the whole review prompt. It is manually invoked with
/quality-review; it does not run on a schedule or automatically approve changes.
The design separates measured command results from judged findings, lists what
was not checked, and gives proposed next steps for me to choose from.

The skill files are present in the Sprint 02 branch, and I have used Claude's
audit. No new Claude review was run while writing this journey entry, and no
separate final skill-run report was inspected for this entry. I do not want the
journal to imply that every proposed guardrail or manual check was completed.

### Automation, control, and effort

We prepared a GitHub Actions workflow to run checks on pushes and pull requests.
I learned that this is different from a local pre-commit hook and from required
branch checks in GitHub settings. A workflow running does not by itself establish
that main is protected from failing merges. I continue to handle staging,
commits, and pushes myself; the agents explain and make approved file changes.

Working with two agents gave me more suggestions and another perspective, but
I still needed to coordinate them, compare their findings, and decide what to do.
I asked that only one agent edit a given task at a time. I also asked how chat
history would carry over to another day, which reinforced the value of keeping
plans, commands, decisions, and reflections in project files.

One agent validation step unexpectedly cleared the local dependency folders
while using npm's dry-run option. Codex disclosed the problem, restored the
locked dependencies, and reran checks successfully. This is another reason I
want proposed commands explained and outcomes checked rather than assuming a
command behaves exactly as expected.

I have not measured time spent, token usage, or cost savings for this session.
For my later research, I can describe the questions, interruptions, corrections,
and decisions recorded here, but I cannot claim a measured productivity gain.

### Research questions and next steps

- How much of the benefit comes from generated code, and how much from the
  explanations and review process?
- Does a second agent identify useful new issues, or mostly add review work?
- Can a reusable review skill reduce repeated prompting while preserving my control?
- How do I distinguish high coverage or passing checks from confidence in real behavior?

Next, I will review Claude's findings, discuss accessibility options with my
professor, and choose remaining quality improvements before continuing account
features. Sprint 02 is ongoing. This journey entry is on main as a project-wide
record; it does not merge the Sprint 02 implementation into main.

## October 17, 2026 — Sprint 02: Defining our three-role team

I decided to make the responsibilities of my human-and-AI team explicit. I am
the project owner and developer; Codex is my primary implementation assistant;
Claude is my independent review assistant. I remain responsible for choosing
the work, understanding it, and deciding what to accept.

My process is to ask WHAT, WHY, and HOW before approving a step. Codex can then
implement the approved change, run checks, and explain the results. I ask Claude
to review that work and give me findings and options, rather than automatically
apply every recommendation. I choose which fixes to pursue. If Claude builds
something, I can ask Codex to review it instead. This is a practical division of
responsibility, not evidence that one model is always a better builder or reviewer.

I continue to handle staging, commits, pushes, and merges myself unless I
explicitly delegate a particular action. Neither assistant has open-ended
permission to edit or install things. I also want only one agent editing a task
at a time so that I can follow the changes and understand who did what.

Today I reviewed what the Claude quality-review files do and clarified when to
invoke the skill. It is manual: I use /quality-review before a pull request or
after substantial changes, and /quality-review full at sprint completion. One
full run can cover both the sprint and its pull request. I do not need both
agents to review every small edit; routine executable checks are a separate part
of the workflow. GitHub CI also runs independently of this manual skill.

I want review reports to distinguish measured outcomes, the agent's judgment,
and things not checked. A second agent may provide another perspective, but it
does not guarantee that errors will be found or remove my responsibility for
testing and judgment. No new audit was run while documenting this agreement.

For my later research, this gives me a clearer process to observe: who proposed
a change, who implemented it, what an independent review found, what I accepted
or rejected, and what I learned. I have not measured whether this division saves
time or tokens, so I will treat its benefits as questions to investigate rather
than established results.

The agreement is documented in README on main and in the Sprint 02 checkout.
This reflection is recorded on main, preserving the October 16 entry. Sprint 02
remains ongoing; this documentation update does not merge implementation work.

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
