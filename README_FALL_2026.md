# CallingIn

## Helping people begin the conversations that matter most

CallingIn is a semester project for **CS 8674 – Project Course, Fall 2026**, developed by **Shorena K. Anzhilov** in the **M.S. in Computer Science (ALIGN)** program, with **Professor Albert Lionelle** as faculty advisor.

This project brings together research on generative AI and the development of a communication application. It explores two ways to help people connect: an AI Communication Coach for people who want help finding the words, and a Trusted Circle for people who want to reach out to loved ones without using AI.

**Project status:** Planning and design. The features below describe the intended semester MVP, not a completed application.

**Project period:** September 15–December 11, 2026, approximately.

**Repository:** [ShorenaK/CallingIn_new](https://github.com/ShorenaK/CallingIn_new)

## Why I am building CallingIn

Sometimes we want to reach out but do not know how to begin. We may miss a friend, want to repair a misunderstanding, or need someone to listen. Even a short message can feel difficult when we worry about saying the wrong thing or being misunderstood.

There is another side to this problem: the people who care about us may not know when we could use their support. Our emotions change from day to day. One person may be having a difficult day while someone close to them has the time and energy to listen. CallingIn is intended to make that moment of connection easier, while giving each person control over what they share and when they want to talk.

## Mission

CallingIn's mission is to help people begin meaningful conversations while preserving their own voice and respecting each other's boundaries.

The Trusted Circle extends that mission through a simple idea: **humans supporting humans**. It gives people a private way to let trusted friends and family know when encouragement would be welcome, and gives those loved ones an opportunity to respond with their own words and care.

My hope is that CallingIn can make asking for support feel less intimidating and create more opportunities for connection, belonging, and everyday emotional support. These are goals that guide the design, rather than proven outcomes of the application. CallingIn is not intended to diagnose or treat mental health conditions, replace professional care, or advise anyone about prescribed medication.

## Two ways to connect

Users can choose the kind of support they want for a particular moment. They do not need to use AI to participate in CallingIn.

### 1. AI Communication Coach

The original CallingIn experience helps users prepare a message when they know what they want to express but are unsure how to say it.

A user chooses someone to contact, explains their reason for reaching out, and requests a suggested draft. They can review the suggestion, change its tone, rewrite parts of it, or write something different before sending an invitation. The user remains responsible for the final message; AI does not send messages on their behalf.

The semester MVP will support:

- Drafting an invitation from the user's stated intent.
- Refining wording for clarity and tone.
- Reviewing and editing a suggestion before sending it.
- Sending a conversation invitation with **Accept**, **Maybe Later**, and **Decline** options.
- Beginning a private one-to-one conversation after acceptance.

For example, someone might write: “We haven't talked in a while, and I miss our friendship.” The coach could suggest: “I've been thinking about you and would love to catch up if you're open to it.” The user can then decide whether that sounds like them and edit it accordingly.

### 2. Trusted Circle — human support without AI

The Trusted Circle is a private, invitation-only space for people the user knows and trusts. It is a list of accepted personal connections, rather than a group chat or public feed.

A user can invite a friend or family member to connect. Once that invitation is accepted, they can share an optional mood update and say what kind of contact they welcome. A circle member can then write a personal invitation offering encouragement or a conversation.

For example, I might share: “I'm feeling low today, and some encouragement would help.” My sister, who feels available to listen, could respond: “I'm thinking of you. Would you like to talk?” I can accept, choose Maybe Later, or decline. The message comes from her, in her own words, without AI involvement.

The semester MVP will support:

- Inviting, accepting, and removing trusted connections.
- Viewing updates shared by accepted circle members.
- Sharing, updating, and clearing an optional mood and contact preference.
- Writing a personal support invitation without AI assistance.
- Continuing in a private conversation after the invitation is accepted.

Trusted Circle updates and messages will not be sent to an AI service. AI assistance will be a separate action within the AI Coach flow.

## Mood and Social Battery

How someone feels and whether they want contact are different things. A person can feel low and still need quiet. They can also feel good but be too busy for a conversation.

CallingIn will provide two separate choices:

| Setting | Planned choices | Purpose |
| --- | --- | --- |
| How I feel | Low, Okay, Good | An optional description of the user's current mood |
| What I welcome | Encouragement, Open to talking, Busy, Personal space | The user's current preference for contact |

Users may add a short note and choose whether to share the update with their accepted trusted connections. Sharing is voluntary, and users can clear their status. Statuses will include an update time so people can see how recent they are.

Choosing Personal space should make that preference clear and should not prompt others to offer support. A low mood alone will not trigger automatic outreach. Circle members are free to offer support when they have the capacity; nobody is expected to be constantly available or responsible for changing another person's feelings.

## Invitations and private conversations

There are two different invitations in the application:

1. **Trusted Circle invitation:** Establishes a trusted connection and permits access to updates shared with that circle. It does not automatically open a conversation.
2. **Conversation invitation:** Asks whether the recipient wants to begin a particular conversation. This can start from either the AI Coach or the Trusted Circle.

For a conversation invitation, the recipient can choose:

- **Accept:** Open a private conversation for the two participants.
- **Maybe Later:** Leave the invitation deferred without opening a conversation.
- **Decline:** Close the invitation without opening a conversation.

Only the participants can access their conversation. The application will check access on the server, including access to circle updates. Removing a trusted connection will remove that person's access to future circle-status viewing. The treatment of existing conversations and message history after removal will be decided during the requirements stage.

## Semester MVP scope

The first version will be a responsive web application with:

- Registration, login, logout, and basic user profiles.
- User lookup and invitation workflows.
- AI-assisted invitation drafting and refinement.
- Trusted Circle membership and voluntary status sharing.
- Private one-to-one text conversations after acceptance.
- Clear loading, empty, and error states for the main flows.
- Server-side access controls and secure handling of passwords and API credentials.

### Outside the semester MVP

The initial build will not include in-app voice or video calls, group chats, public posts, automatic mood detection, or subscription payments. People may arrange an ordinary phone call through their messages, but CallingIn will not host the call.

Real-time delivery, typing indicators, read receipts, conversation summaries, native mobile applications, and premium features are possible future work. End-to-end encryption is also future work and will not be claimed for the MVP.

## Planned technology stack

| Area | Planned tools |
| --- | --- |
| Frontend | React, React Hooks, JavaScript, HTML, CSS, Fetch API |
| Backend | Node.js and Express.js |
| Database | MongoDB with the native MongoDB Node.js driver |
| Authentication | Passport.js, Express Session, and password hashing |
| AI integration | OpenAI API or another faculty-approved language model API |
| Development | Git, GitHub, Visual Studio Code, API testing tools, ESLint, and Prettier |

AI credentials will remain on the backend. The Trusted Circle flow will work independently of the AI integration.

## Development and academic timeline

The schedule below is a working plan, with target completion dates rather than guarantees. Advisor meetings are planned every other week beginning September 15. Individual meetings may move as needed, and December 11 is an approximate project finish date rather than a confirmed course deadline.

The build will start with the shared foundation, followed by the non-AI connection flow and then the AI Coach. Research and writing will continue throughout the semester so the paper develops alongside the application.

| Week | Dates in 2026 | Development target by the end of the period | Research and writing target |
| --- | --- | --- | --- |
| 1 | Sep 15–21 | Confirm the two user paths, define the MVP, and organize the repository and task list | Review the proposal with the advisor; confirm the added Trusted Circle scope and paper expectations |
| 2 | Sep 22–28 | Draft wireframes, user flows, database records, and invitation states | Begin the literature review and maintain an annotated source list |
| 3 | Sep 29–Oct 5 | Establish the React and Express foundation, connect MongoDB, and verify frontend-to-backend communication | Draft the project background, problem statement, and system architecture section |
| 4 | Oct 6–12 | Complete registration, login, logout, protected pages, and basic profiles | Record authentication and privacy design choices; continue the literature review |
| 5 | Oct 13–19 | Complete trusted-connection invitations, acceptance, member listing, and removal | Draft the Trusted Circle rationale and consent model |
| 6 | Oct 20–26 | Complete mood and contact-preference sharing, status clearing, and circle visibility checks | Draft the evaluation plan and review any participant-research requirements with the advisor |
| 7 | Oct 27–Nov 2 | Complete conversation invitations and Accept / Maybe Later / Decline behavior | Document both user journeys and invitation-state decisions |
| 8 | Nov 3–9 | Complete stored private messages and verify the full non-AI support flow with test accounts | Draft the implementation section and prepare evaluation tasks |
| 9 | Nov 10–16 | Integrate AI drafting through the backend, including editable suggestions and failure handling | Document prompt design and how authenticity will be evaluated |
| 10 | Nov 17–23 | Complete AI refinement and test both user paths together; aim for a feature-complete beta | Complete the evaluation materials and bring the paper draft up to date |
| 11 | Nov 24–30 | Run usability sessions if approved, fix priority issues, and check mobile layouts; allow for holiday availability | Collect permitted feedback and summarize observations without claiming clinical effects |
| 12 | Dec 1–7 | Finish regression checks, setup instructions, and the demonstration flow | Complete the report draft, evaluation findings, limitations, slides, and reflection draft |
| 13 | Dec 8–11 | Resolve final issues and prepare the final MVP demonstration and repository | Revise and submit the report, presentation, and reflection according to confirmed course deadlines |

### Proposed advisor checkpoints

| Meeting | Main review topic |
| --- | --- |
| September 15 | Scope, project goals, and semester expectations |
| September 29 | Wireframes, database design, and architecture |
| October 13 | Accounts, profiles, and progress toward the Trusted Circle |
| October 27 | Circle membership, shared statuses, and conversation invitation design |
| November 10 | Complete non-AI flow and readiness for AI integration |
| November 24 | Both paths working and evaluation readiness |
| December 8 | Final MVP, findings, report, and presentation |

Weekly progress notes will record what was completed, what changed, and what needs attention. If the schedule becomes tight, optional enhancements will be deferred so the core flows, access controls, evaluation, and final writing receive enough time.

## Research paper and evaluation

The central research question from the proposal is:

> How can Generative AI assist individuals in initiating meaningful interpersonal conversations while preserving authenticity and emotional intent?

The Trusted Circle introduces an additional design question:

> How can voluntary mood and availability sharing help trusted people recognize opportunities to offer support while respecting personal boundaries?

The paper will explain the motivation for CallingIn, review relevant literature, describe the design and implementation, and examine what was learned from the prototype. Research topics will include AI-assisted communication, human-computer interaction, authenticity, digital well-being, privacy, and consent.

### Working paper outline

1. **Introduction:** The communication problem, motivation, and project goals.
2. **Related work:** Research on AI-assisted communication and technology-supported human connection.
3. **Research questions and scope:** What the project investigates and what it does not attempt to establish.
4. **System design:** The two user paths, architecture, data model, and access rules.
5. **Implementation:** Frontend, backend, authentication, database, and AI integration.
6. **Evaluation method:** Tasks, participants if approved, feedback questions, and functional checks.
7. **Results and discussion:** Observed behavior, user feedback, and interpretation of findings.
8. **Limitations and ethical considerations:** Prototype constraints, privacy, AI wording limitations, and boundaries of the evidence.
9. **Conclusion and future work:** Outcomes, lessons, and next steps.
10. **References:** Sources actually consulted and cited in the paper.

Evaluation will focus on whether people can complete the main tasks, understand the two paths, control what they share, and recognize that AI drafts are editable suggestions. Feedback can address clarity, comfort, perceived authenticity, and whether contact preferences are understandable. Functional checks will include preventing unauthorized access and ensuring a deferred or declined invitation does not open a conversation.

The evaluation will not measure treatment effectiveness or changes in medication use. Any participant sessions will follow the advisor's guidance and applicable university requirements. Exact participant numbers, paper length, citation style, and submission requirements remain to be confirmed. If participant testing is not feasible, the report will clearly distinguish a structured walkthrough and technical evaluation from a user study.

The original proposal places the reflection deadline on the Friday before finals week. That date will be confirmed separately rather than assumed to be December 11.

## Planned final deliverables

- Updated project scope reflecting both the AI Coach and Trusted Circle.
- Literature review and references.
- Wireframes, user flows, architecture diagram, and database design.
- GitHub repository with source code, setup instructions, and progress notes.
- A functional CallingIn MVP demonstrating both paths.
- Evaluation methods, findings, and limitations.
- Final research report, presentation, and written reflection.

## Project documentation

This document is a companion to the original README. It records the expanded Fall 2026 plan and draws on the *CS 8674 Project Course – Proposal & Semester Plan* and the subsequent Trusted Circle design discussions. The original README remains the record of the initial CallingIn concept. Additional course materials and confirmed advisor requirements will be incorporated as they become available.

CallingIn begins with a simple belief: sometimes a thoughtful message, a willing listener, or a small moment of encouragement can make reaching out feel possible. This project is an opportunity to explore how software can make room for those human moments.

## Design Preview

The CallingIn concept shows two ways to connect: the AI Communication
Coach and the Trusted Circle, where friends and family can offer
personal support without AI involvement.

![CallingIn design concept](public/images/callingin_concept.png)

## Application Wireframe

The wireframe outlines the planned pages and both user journeys,
including accounts, the AI Coach, trusted connections, mood and
availability sharing, invitations, and private conversations.

![CallingIn application wireframe](public/images/figma_wire_frame.png)

These visuals represent the planned design and may change during development.