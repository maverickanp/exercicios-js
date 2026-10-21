// Behavioral / experience questions. Scored on STRUCTURE (STAR) and ownership
// language rather than technical terms.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.DATA = root.DATA || {}; root.DATA.behavioral = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  // Reusable STAR key points. Terms are the signposting words of a well
  // structured story told in the first person.
  const STAR = [
    { label: 'Situation: context in one or two sentences', terms: ['at my previous', 'at my last', 'at my current', 'in my current', 'when i was', 'we had', 'we once', 'we received', 'the team', 'the project', 'at the time', 'i was working', 'last year', 'a few months ago', 'a couple of years ago', 'early in', 'once', 'in a performance review', 'our'], tip: 'Start with "At my previous company, we had..."' },
    { label: 'Task: your specific responsibility', terms: ['my responsibility', 'i was responsible', 'my job was', 'my role', 'i was asked', 'i needed to', 'i had to', 'my goal', 'i was the lead', 'i was on call', 'i was the one', 'i took it on', 'i owned', 'my task', 'i saw'], tip: 'Say "I was responsible for..." or "My goal was to..."' },
    { label: 'Action: what YOU did (first person, concrete verbs)', terms: ['i decided', 'i proposed', 'i implemented', 'i built', 'i wrote', 'i refactored', 'i talked', 'i set up', 'i started', 'i introduced', 'i suggested', 'i created', 'i measured', 'i investigated', 'i led', 'i organized', 'i paired', 'i did', 'i sat down', 'i split', 'i negotiated', 'i asked', 'i made', 'i took', 'i went', 'i changed', 'i added', 'i fixed', 'i rolled back', 'i checked', 'i spent', 'i presented', 'i convinced', 'i pushed', 'i chose', 'i designed', 'i extracted', 'i moved', 'i documented', 'i reviewed', 'i looked', 'i found', 'i removed', 'i replaced', 'i wrapped', 'i contacted', 'i limit', 'i now', 'i focus'], tip: 'Use "I decided / I proposed / I implemented". Avoid hiding behind "we".' },
    { label: 'Result: outcome, ideally with a number', terms: ['as a result', 'the result', 'the outcome', 'in the end', 'we reduced', 'we improved', 'we shipped', 'we delivered', 'it went from', 'went from', 'percent', '%', 'faster', 'dropped', 'increased', 'on time', 'zero bugs', 'minutes', 'no data loss', 'it worked'], tip: 'Finish with "As a result, ... by 40%".' },
    { label: 'Reflection: what you learned or would do differently', terms: ['i learned', 'what i learned', 'lesson', 'looking back', 'next time', 'i would', 'in hindsight', 'taught me', 'my rule', 'the main lesson'], tip: 'Close with "What I learned was..."' },
  ];

  return [
    {
      id: 'bh-tell-me-about-yourself', theme: 'intro', level: 1,
      q: 'Tell me about yourself.',
      keyPoints: [
        { label: 'Present: current role and stack in one sentence', terms: ['currently', 'right now', 'at the moment', "i'm a", 'i am a', 'i work as'], tip: 'Open with "I\'m a .NET developer with X years..."' },
        { label: 'Past: how you got here, 2-3 highlights', terms: ['before that', 'i started', 'previously', 'my background', 'years'], tip: 'Pick two or three highlights, not your whole CV.' },
        { label: 'Signature achievement with impact', terms: ['proud', 'biggest', 'for example', 'one project', 'reduced', 'improved', 'led', 'built'], tip: 'One concrete win with a result.' },
        { label: 'Future: why this role / what you are looking for', terms: ["i'm looking", 'i am looking', 'excited', 'interested in', 'this role', 'why i', 'next step'], tip: 'Connect to the job you are interviewing for.' },
        { label: 'Length: 60-90 seconds, structured', terms: ['first', 'then', 'finally', 'today'], tip: 'Signpost: "Today... Before that... Going forward..."' },
      ],
      model: "Sure. I'm a backend developer with about six years of experience, mostly in C# and .NET. Today I work at a fintech, where I'm responsible for the payments API: ASP.NET Core, EF Core on SQL Server, and Azure Service Bus for the async flows. Before that I spent three years at a consultancy, where I went from maintaining a legacy .NET Framework monolith to leading its migration to .NET Core and containers, which is where I learned most of what I know about architecture and DevOps. The project I'm proudest of is a settlement service I redesigned last year: by moving the heavy reports to a queue-based worker and fixing a few N plus one queries, we cut the end-of-day processing from forty minutes to under five. What I enjoy most is owning a service end to end, from design to production monitoring, and that's exactly why this role caught my eye: you're building a platform team where that kind of ownership matters. I'm happy to go deeper on any of that.",
      followUps: ['Why are you leaving your current job?', 'What are you looking for in your next role?'],
      pt: 'A pergunta mais importante da entrevista. Fórmula: Presente → Passado → Conquista → Futuro, em 60–90 s. Monte a sua versão na aba "My Story" (Elevator Pitch) e ensaie até sair natural. Não recite o currículo.',
    },
    {
      id: 'bh-challenging-project', theme: 'ownership', level: 1,
      q: 'Tell me about the most challenging project you have worked on.',
      keyPoints: STAR,
      model: "At my previous company we had a legacy order management system on .NET Framework 4.6 that was slowing every release; deployments took a full weekend. I was asked to lead the migration to .NET Core with two other developers, while the business kept shipping features. I decided we couldn't do a big bang, so I proposed the strangler approach: we put a reverse proxy in front, moved shared libraries to .NET Standard first, and migrated the API route by route, starting with the read-only endpoints that had the lowest risk. I also set up the CI pipeline and the container images, because none of that existed. The hardest part was the hidden coupling to System.Web in the business logic, which I refactored behind interfaces so both runtimes could use it. As a result, after about five months everything was on .NET 6, deployments went from a weekend to twenty minutes, and p95 latency dropped by around thirty percent. What I learned was to invest in the migration path and the tests before touching the code: the two weeks we spent on the characterization tests saved us many times over.",
      followUps: ['What would you do differently?', 'How did you convince management to invest in it?'],
      pt: 'Use uma história sua da tag "ownership". Mantenha 2 minutos no máximo. Verbos de ação em primeira pessoa são o que o entrevistador anota.',
    },
    {
      id: 'bh-conflict', theme: 'conflict', level: 2,
      q: 'Tell me about a time you disagreed with a colleague or your manager. How did you handle it?',
      keyPoints: STAR,
      model: "At my last job a senior colleague wanted to introduce microservices for a new module, and I thought it was premature: we were a team of four and the domain wasn't clear yet. Instead of arguing in the meeting, I asked for thirty minutes with him and started by asking what problems he was trying to solve. It turned out his real concern was deployment independence, because the monolith had a slow, risky release. So I proposed a modular monolith with clear boundaries and a separate deployable for just the one component that actually needed independent scaling, and I wrote a one-page comparison with the trade-offs for the team. We agreed to try that for one quarter and revisit. In the end, the release pain was solved by improving the pipeline, we never needed the extra services, and we stayed friends. What I learned was to look for the need behind the position: most technical disagreements are about a problem that nobody has named yet.",
      followUps: ['What if they had refused?', 'How do you handle it when you turn out to be wrong?'],
      pt: 'Entrevistadores querem ver: respeito, curiosidade e dados, não vitória. Nunca retrate o colega como incompetente. Frase-chave: "I started by asking what problem they were trying to solve."',
    },
    {
      id: 'bh-failure', theme: 'failure', level: 2,
      q: 'Tell me about a mistake you made at work and what you learned from it.',
      keyPoints: STAR,
      model: "Early in my current job I pushed a change to the pricing service that cached exchange rates to reduce load on the provider. I tested it locally and it worked, but I set the cache key without the currency pair, so in production all currencies got the first rate loaded. It was live for about forty minutes before an alert fired, and a few hundred quotes were wrong. I took ownership immediately: I rolled back, wrote the incident report myself, and contacted the support team with the list of affected quotes so they could reach out to customers. Then I fixed the root cause: I added a test that checks the cache key per currency and, more importantly, I proposed that any change touching money goes through a canary deployment with a comparison against the previous version for ten minutes. That became the team standard. What I learned was that a 'small' change in a critical path deserves the same rigor as a big one, and that the fastest way to rebuild trust after a mistake is to be the most transparent person in the room.",
      followUps: ['How did your team react?', 'How do you prevent similar mistakes now?'],
      pt: 'Escolha um erro real, com impacto, mas que você corrigiu. O foco é: ownership → correção → prevenção sistêmica. Nunca escolha um "erro" que é um elogio disfarçado.',
    },
    {
      id: 'bh-deadline', theme: 'pressure', level: 1,
      q: 'Describe a time when you had to deliver under a tight deadline.',
      keyPoints: STAR,
      model: "Last year a regulatory change gave us three weeks to add new tax rules to the invoicing module, which normally would have been a six-week project. I was the lead on that module. The first thing I did was negotiate scope: I sat down with the product owner and we separated what was legally required on day one from what was nice to have, and we cut the second group. Then I split the work so that a colleague built the calculation engine with unit tests from the regulation's examples while I handled the integration and the migration, and we paired on the risky parts for an hour each morning. I also was upfront with the stakeholders every two days about what was on track and what wasn't. We shipped on time with the legally required part, and the remaining features followed two weeks later without the pressure. What I learned was that under a tight deadline the most valuable engineering skill is saying clearly what won't fit, early, instead of promising everything and failing quietly.",
      followUps: ['Did you have to work overtime?', 'How do you estimate work?'],
      pt: 'Mostre que pressão se resolve com priorização e comunicação, não com horas extras heroicas. "I was upfront with stakeholders" é uma frase muito bem vista.',
    },
    {
      id: 'bh-learning', theme: 'learning', level: 1,
      q: 'How do you keep your skills up to date? Tell me about something you learned recently.',
      keyPoints: [
        { label: 'Concrete sources: docs, blogs, talks, podcasts', terms: ['blog', 'documentation', 'docs', 'podcast', 'talk', 'conference', 'youtube', 'newsletter', 'release notes', 'book'], tip: 'Name real sources you actually use.' },
        { label: 'Learning by doing: side project, experiment, benchmark', terms: ['side project', 'experiment', 'tried', 'prototype', 'built', 'benchmark', 'playground'], tip: 'Reading is not enough; mention building.' },
        { label: 'A recent concrete example', terms: ['recently', 'last month', 'last week', 'this year', 'for example'], tip: 'One specific thing: e.g. "last month I tried .NET Aspire".' },
        { label: 'Applied at work / shared with team', terms: ['applied', 'used it', 'brought it', 'shared', 'presented', 'team', 'production'], tip: 'Close the loop: how it helped at work.' },
        { label: 'Judgment: not chasing every new thing', terms: ['not every', 'evaluate', 'judge', 'worth', 'hype', 'mature', 'stable'], tip: 'Show you choose what to learn.' },
      ],
      model: "I keep a routine rather than waiting for inspiration. I read the .NET release notes and the ASP.NET Core blog, I follow a few people like Andrew Lock and Nick Chapsas, and I listen to .NET Rocks on my commute. But I only really learn by building, so when something looks relevant I try it in a small sandbox project. For example, last month I spent a weekend with .NET Aspire to see how it handles local orchestration of a few services with Redis and Postgres. It was good enough that I brought it to my team as a proposal for our local dev environment, and I did a twenty-minute demo in our tech sharing session. I'm also deliberate about not chasing every new framework: I evaluate whether something solves a problem we actually have and whether it's mature enough for production, so I don't waste the team's time on hype.",
      followUps: ['What do you think is overhyped right now?', 'How do you share knowledge with your team?'],
      pt: 'Cite nomes e fontes reais que você usa. Se não conhece os do modelo, troque pelos seus. Autenticidade é detectável.',
    },
    {
      id: 'bh-why-leaving', theme: 'motivation', level: 1,
      q: 'Why are you looking for a new job, and why are you interested in this role?',
      keyPoints: [
        { label: 'Positive framing: toward something, not away from pain', terms: ['looking for', 'i want', 'grow', 'next step', 'opportunity', 'challenge'], tip: 'Say what you want, not what you hate.' },
        { label: 'Respect for the current employer', terms: ['i learned a lot', 'great team', 'grateful', 'good experience', 'enjoyed'], tip: 'Never badmouth the current company.' },
        { label: 'Specific reasons about THIS company/role', terms: ['your', 'this role', 'the position', 'the product', 'your team', 'the job description', 'i read', 'i saw'], tip: 'Show you researched them.' },
        { label: 'What you bring', terms: ['i can bring', 'i can contribute', 'my experience', 'i have done', 'fit'], tip: 'Connect your experience to their needs.' },
        { label: 'Honest, concise', terms: ['honestly', 'to be honest', 'simply', 'the main reason'], tip: 'One main reason, said plainly.' },
      ],
      model: "Honestly, the main reason is growth. I've been at my current company for four years and I'm grateful for it: I went from a mid-level developer to leading the payments module, and I learned a lot. But the product is now in maintenance mode and the architecture decisions have mostly been made, so the next year would look like the last one. I'm looking for a place where I can work on a system that is still evolving, with more scale and a stronger engineering culture. Your role caught my attention because the job description talks about owning services end to end, event-driven architecture on Azure, and a team that does real code reviews and post-mortems. That's the kind of environment where I do my best work, and it matches what I've been doing in .NET for the past six years, so I think I can contribute from week one while still learning a lot.",
      followUps: ['What do you know about our product?', 'Where do you see yourself in three years?'],
      pt: 'Regra de ouro: nunca fale mal do emprego atual. Pesquise a empresa e cite algo concreto da vaga. Prepare essa resposta em "My Story" → Elevator Pitch (motivação).',
    },
    {
      id: 'bh-strengths-weaknesses', theme: 'self-awareness', level: 1,
      q: 'What are your strengths and weaknesses as a developer?',
      keyPoints: [
        { label: 'Strength with evidence', terms: ['for example', 'for instance', 'colleagues say', 'feedback', 'i tend to', 'i am good at', "i'm good at"], tip: 'A strength plus one example.' },
        { label: 'Real weakness, not a disguised strength', terms: ['i struggle', 'i tend to', 'my weakness', 'i used to', 'not my strongest', 'hard for me'], tip: 'Pick something true and non-fatal.' },
        { label: 'What you are doing about it', terms: ['i am working', "i'm working", 'i started', 'i now', 'to improve', 'i ask', 'i set'], tip: 'Show an action plan.' },
        { label: 'Self-awareness language', terms: ['i noticed', 'i realized', 'i realised', 'feedback', 'aware'], tip: '"I noticed that..." signals maturity.' },
        { label: 'Concise, no list of five', terms: ['one', 'main', 'biggest'], tip: 'One strength, one weakness.' },
      ],
      model: "My main strength is that I'm good at taking a vague problem and turning it into a clear design and a plan the team can execute. For example, when we had to rebuild the notification system, I was the one who wrote the design doc, broke it into tickets, and got the team aligned in one meeting. Colleagues usually describe me as calm under pressure. As for weaknesses, I tend to go too deep into optimizing something before checking whether it matters. I noticed this when I spent two days making a report ten times faster and then learned it ran once a month. What I do now is ask 'what's the cost of not fixing this?' before I start, and I time-box investigations to half a day before I check in with someone. It's getting better, but it's still something I watch.",
      followUps: ['How do colleagues describe you?', 'What feedback have you received recently?'],
      pt: 'Fraquezas aceitáveis: perfeccionismo técnico com plano de correção, dificuldade em delegar, falar em público. Inaceitáveis: "I work too hard" (clichê) ou algo fatal para a vaga.',
    },
    {
      id: 'bh-leadership', theme: 'leadership', level: 2,
      q: 'Tell me about a time you led or mentored someone, even without a formal title.',
      keyPoints: STAR,
      model: "When two juniors joined my team last year, nobody was formally responsible for onboarding them, and I saw them struggling with our codebase. I decided to take it on. I set up a pairing schedule, one hour a day for the first two weeks, and I wrote a short 'how we work' guide covering our architecture, our pull request rules, and how to run the system locally, which didn't exist before. I also changed how I reviewed their code: instead of fixing things, I asked questions and linked to the reasoning, so they'd learn the why. For one of them, who was anxious about speaking in meetings, I started asking for his opinion directly on small things to build confidence. After three months both were shipping features independently, and one of them now does onboarding for the next hires using that guide. What I learned was that mentoring is mostly about creating a safe space to ask questions and about being consistent, not about knowing more.",
      followUps: ['How do you give negative feedback?', 'Would you like to be a team lead?'],
      pt: 'Liderança sem título conta muito. Mostre ações concretas (schedule, guide, review style) e resultado nas pessoas.',
    },
    {
      id: 'bh-production-incident', theme: 'ownership', level: 2,
      q: 'Describe a production incident you handled. What did you do?',
      keyPoints: STAR,
      model: "A few months ago our checkout API started returning timeouts at around six in the evening, our peak. I was on call. The first thing I did was look at the dashboards: CPU was fine, but the thread pool queue length was climbing and the database connection count was at the limit. That pointed to thread pool starvation. I checked the recent deployments and found a change from that morning where a colleague had wrapped an async call in dot Result inside a hot path. I rolled back within ten minutes, which stopped the bleeding, and confirmed the metrics recovered. The next day I led a blameless post-mortem: we added an analyzer rule that fails the build on blocking calls, and we added an alert on thread pool queue length so next time we'd catch it before customers did. The outcome was about twenty-five minutes of degraded service, no data loss, and a permanent guardrail. What I learned was the importance of having the right metric visible: the queue length graph told the whole story in thirty seconds.",
      followUps: ['How do you run a post-mortem?', 'How do you decide between rollback and fix-forward?'],
      pt: 'Incidentes são ouro em entrevista: mostram calma, método e prevenção. Vocabulário: on call, roll back, stop the bleeding, blameless post-mortem, guardrail.',
    },
    {
      id: 'bh-ambiguity', theme: 'ownership', level: 2,
      q: 'Tell me about a time you had to work with unclear requirements.',
      keyPoints: STAR,
      model: "We once received a one-line ticket: 'customers need to export their data'. No format, no scope, no deadline. Rather than guessing, I spent a day talking to people: the support lead told me customers mostly asked for invoices, and the compliance officer mentioned a legal requirement about data portability that nobody had connected to the ticket. I wrote a short proposal with three options: a quick CSV export of invoices, a full account export in JSON, and a scheduled export to the customer's storage, each with an estimate and the risks. I presented it to the product owner and we picked the first one for the next sprint and the second one for the quarter, which also covered the legal need. I built the CSV export with a background job and an email link, and we shipped it in a week. As a result, the support tickets about exports dropped to almost zero, and the compliance team got a roadmap item they didn't know they needed. The lesson for me was that unclear requirements are an invitation to go and talk to people, not to sit and guess.",
      followUps: ['How do you handle scope creep?', 'How do you say no to a stakeholder?'],
      pt: 'Mostre iniciativa: conversar com pessoas, propor opções com custo, decidir junto. "Rather than guessing" é um ótimo conector.',
    },
    {
      id: 'bh-tech-decision', theme: 'design', level: 2,
      q: 'Tell me about a technical decision you made that you would make differently today.',
      keyPoints: STAR,
      model: "A couple of years ago I introduced a generic repository plus unit of work layer on top of EF Core in a new service, because that was what I'd seen as 'clean'. At the time my goal was to isolate the data access and make it testable. What actually happened was that we ended up with an abstraction that hid the most useful EF features, like projections and Include, so the team either wrote inefficient queries or bypassed the repository, and the tests mocked a repository that didn't behave like the real one. About a year in, I proposed removing it: the application layer now uses the DbContext directly through an interface for the context, with specific query methods where it makes sense, and the integration tests run against a real database in Testcontainers. The result was less code, faster queries, and tests that actually caught bugs. Looking back, I'd say I applied a pattern because it was familiar rather than because it solved a problem we had. Today I ask what the abstraction buys us before adding it.",
      followUps: ['How do you evaluate a new library or pattern?', 'When is abstraction worth it?'],
      pt: 'Mostrar que você mudou de opinião com evidências é um sinal forte de senioridade. Vocabulário: "looking back", "in hindsight", "what it actually bought us".',
    },
    {
      id: 'bh-teamwork-remote', theme: 'teamwork', level: 1,
      q: 'How do you work with teammates in different time zones or who speak a different native language?',
      keyPoints: [
        { label: 'Written communication: clear PR descriptions, docs, async updates', terms: ['written', 'write', 'document', 'description', 'async', 'asynchronous', 'slack', 'ticket'], tip: 'Over-communicate in writing.' },
        { label: 'Overlap hours and meeting discipline', terms: ['overlap', 'time zone', 'hours', 'meeting', 'agenda', 'record'], tip: 'Protect the overlap window.' },
        { label: 'Clarity over speed in English; confirm understanding', terms: ['clear', 'simple', 'confirm', 'repeat back', 'summar', 'make sure', 'check'], tip: '"Let me make sure I understood..."' },
        { label: 'Empathy and culture awareness', terms: ['patient', 'empathy', 'culture', 'respect', 'direct', 'feedback'], tip: 'Mention adapting to directness levels.' },
        { label: 'Concrete example', terms: ['for example', 'in my last', 'we had', 'when'], tip: 'One real situation.' },
      ],
      model: "In my last project half the team was in Europe and half in Brazil, with about four hours of overlap. The main thing I changed was to default to writing. Every pull request had a description with the why, the decisions and how to test it, so a reviewer in another time zone didn't need to wait for me. Design decisions went into a short document in the repo instead of a call. We kept the overlap window for the things that really need a conversation and recorded those meetings with a summary in the channel. English isn't my first language, so I focus on being clear rather than fast: short sentences, and when something is important I repeat it back, 'so just to confirm, you want X by Friday'. I also learned that my Dutch colleagues give very direct feedback, which can sound harsh to a Brazilian ear; once I understood it was about the work and not about me, reviews became much easier. It worked well: our cycle time didn't suffer and we had very few misunderstandings.",
      followUps: ['How comfortable are you working fully in English?', 'How do you handle a misunderstanding?'],
      pt: 'Essa pergunta é também um teste do seu inglês ao vivo. Fale com calma, frases curtas. É aceitável e até bem visto dizer "English isn\'t my first language, so I focus on being clear".',
    },
    {
      id: 'bh-questions-for-us', theme: 'closing', level: 1,
      q: 'Do you have any questions for us?',
      keyPoints: [
        { label: 'Ask about the team and how they work', terms: ['team', 'how do you', 'process', 'code review', 'deploy', 'sprint', 'on call'], tip: 'Show interest in the day to day.' },
        { label: 'Ask about challenges / roadmap', terms: ['challenge', 'roadmap', 'biggest problem', 'next six months', 'priorit'], tip: 'What are they struggling with?' },
        { label: 'Ask about success in the role', terms: ['success', 'first 90 days', 'first months', 'expect', 'measure'], tip: '"What does success look like in the first 90 days?"' },
        { label: 'Ask about tech decisions / architecture', terms: ['architecture', 'stack', 'version', '.net', 'migrat', 'technical debt', 'tech debt'], tip: 'Something specific to their stack.' },
        { label: 'Thank and show enthusiasm', terms: ['thank', 'appreciate', 'excited', 'looking forward'], tip: 'Close warmly.' },
      ],
      model: "Yes, a few. First, about the team: how does a typical change go from idea to production here? I'm curious about code review and how often you deploy. Second, what's the biggest technical challenge the team expects to face in the next six months? Is it scaling, migration, tech debt? Third, if I joined, what would success look like in the first ninety days, and how is that measured? And one technical one: I saw you're on .NET 8 with Azure; are you considering moving to .NET 10 and how do you usually handle runtime upgrades? Thank you, this has been a really interesting conversation and I appreciate your time.",
      followUps: [],
      pt: 'Nunca diga "no questions". Prepare 4 perguntas, use 2–3. Perguntas sobre processo e desafios mostram senioridade; evite salário na primeira entrevista a menos que o recrutador puxe.',
    },
    {
      id: 'bh-feedback', theme: 'self-awareness', level: 2,
      q: 'Tell me about a time you received difficult feedback. How did you react?',
      keyPoints: STAR,
      model: "In a performance review two years ago, my manager told me that my code reviews were technically excellent but that some teammates found them discouraging, because I left a lot of comments without saying which ones mattered. My first reaction, honestly, was defensive; I thought I was being thorough. But I asked for specific examples and she showed me a review with twenty-eight comments on a junior's first pull request. Seeing it from his side, I understood. So I changed two things: I now mark each comment as blocking, suggestion or nitpick, and I limit myself to the three most important points on a first pass and offer to pair for the rest. I also started opening reviews with something that was done well. A few months later the same manager told me a junior had mentioned my reviews as the most helpful on the team. What I learned was that feedback that stings is usually the most useful, and that the right first response is to ask for examples, not to explain myself.",
      followUps: ['How do you give feedback to others?'],
      pt: 'Admitir a reação defensiva inicial e depois a mudança é mais crível do que "I loved the feedback". Vocabulário: stings, defensive, ask for examples.',
    },
    {
      id: 'bh-quality-vs-speed', theme: 'pressure', level: 2,
      q: 'How do you balance code quality with delivery speed? Give an example.',
      keyPoints: STAR,
      model: "I think of quality as the thing that keeps speed sustainable, so I don't see them as opposites, but there are moments when you have to choose. For example, we had a marketing campaign going live in two days that needed a new discount rule. The 'right' solution was to refactor the discount engine, which would take a week. I decided to add the rule in the simplest way that was correct and fully tested, and I wrote a ticket for the refactor with a clear explanation, which I negotiated into the next sprint with the product owner, not just the backlog. We shipped the campaign on time with zero bugs, and we did the refactor two weeks later. What I avoid is the silent shortcut: skipping tests or leaving a hack without a plan. My rule is that debt is fine when it's explicit, small, and has a due date. And I protect the things that are expensive to fix later, like data models and public APIs, even under pressure.",
      followUps: ['How do you track technical debt?', 'How do you convince a PO to pay down debt?'],
      pt: 'Frase de efeito: "debt is fine when it\'s explicit, small, and has a due date". Mostre o critério, não só o exemplo.',
    },
  ];
});
