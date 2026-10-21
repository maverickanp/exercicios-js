# 🎙️ .NET Interview Coach

Aplicação para treinar **entrevistas de .NET/C# em inglês**: você ouve o entrevistador, responde em voz alta, recebe feedback sobre o que faltou dizer e faz *shadowing* da resposta-modelo. Zero dependências: HTML, CSS e JavaScript puros.

> A interface é propositalmente em inglês (imersão). As dicas do **🇧🇷 Coach** em português podem ser ligadas ou desligadas na barra lateral.

## Como rodar

```bash
npm start      # abre http://localhost:3000
npm test       # testes da lógica e validação do conteúdo
```

Use **Chrome ou Edge**: o reconhecimento de voz (Web Speech API) só funciona neles e exige `http://localhost` ou `https`. Em outros navegadores você ainda pode digitar as respostas e ouvir as perguntas.

## O que tem dentro

| Tela | O que faz |
|---|---|
| **Today** | Plano de 14 dias com checklist, streak e atalhos. |
| **Interview Drill** | 45 perguntas técnicas (C#, .NET, ASP.NET Core, EF Core, arquitetura, testes) + 16 comportamentais. O entrevistador lê a pergunta; você responde por voz ou digitando, com cronômetro. Feedback: pontos-chave cobertos, palavras, ritmo (wpm), *fillers* ("um", "basically"), resposta-modelo com shadowing frase a frase, follow-ups, vocabulário e armadilhas. |
| **Mock Interview** | 8 perguntas seguidas (intro, comportamentais, técnicas, fechamento) sem feedback até o fim. Relatório final com as 3 mais fracas. |
| **My Stories** | Construtor de histórias **STAR** sobre a sua experiência, com *sentence starters*, versão falada e ensaio pontuado. Inclui o **Elevator Pitch** ("Tell me about yourself"). |
| **Flashcards** | 76 cartões com repetição espaçada (Leitner, 5 caixas), cada um com uma frase para dizer em voz alta. |
| **Phrasebook** | 8 grupos de *frames* (falar da experiência, justificar decisões, ganhar tempo, discordar, descrever arquitetura, incidentes, time, abertura/fechamento) + **drill de pronúncia** com 40 palavras que brasileiros erram. |
| **Code Talk** | 12 trechos de C# para explicar em voz alta ("walk me through this code"). |
| **Progress** | Médias por categoria, histórico, caixas de flashcards, export/import. |

Tudo fica salvo no `localStorage` do navegador. Use **Progress → Export** para fazer backup.

## Método (como estudar)

1. **Ouça** a pergunta com os olhos fechados, como numa call.
2. **Responda em voz alta** com o cronômetro (~90 s técnica, ~2 min comportamental). Mesmo digitando, fale.
3. **Veja os pontos que faltaram**. O scorer procura as ideias que um entrevistador espera ouvir; é um guia, não um juiz.
4. **Shadowing**: ouça a resposta-modelo frase a frase e repita imitando ritmo e entonação.
5. **Responda de novo** sem olhar. Repita a mesma pergunta até passar de 75, depois mude.
6. Escreva suas próprias histórias STAR e seu pitch em **My Stories**; substitua os exemplos do modelo pela sua experiência real.

## Estrutura

```
index.html            app shell
server.js             servidor estático sem dependências
src/css/app.css
src/js/core/          lógica pura, testada em Node (srs, scoring, storage, progress)
src/js/               speech (TTS/STT), answer-panel, feedback, app (router)
src/js/views/         home, drill, mock, stories, flashcards, phrases, code, progress
src/data/             conteúdo: questions, behavioral, flashcards, phrases, snippets, plan
tests/                node --test
```

### Adicionando conteúdo

Cada pergunta em `src/data/questions.js` tem `keyPoints` com `terms` (sinônimos que o scorer procura), `model` (resposta falada), `followUps`, `vocab`, `pitfalls` e `pt` (nota do coach). Os testes em `tests/data.test.js` garantem que a resposta-modelo cobre pelo menos 60% dos pontos-chave e que o plano aponta para conteúdo existente.
