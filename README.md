🏟️ Deep Bench Sports
Krillion, but for the sports junkies.

Think you know sports? Let's find out.

Deep Bench Sports is a sports trivia game where the easy answers only get you so far. The real challenge is coming up with answers most people wouldn't think of. The more obscure your answer, the more points you can earn.

Pick a sport, get a question, and see how deep your sports knowledge really goes. Just don't burn through all three lives.
✨ What can you do?
- 🤖 Play against an AI referee. It checks your answers and decides whether they count.
- 🏀 Choose your sport. Play across different sports or stick to your favourite.
- 💎 Hunt for rare answers. Answers are ranked from Rookie all the way up to Mythic.
- ⏱️ Race the clock. Turn on timed mode and answer before the 25-second shot clock runs out.
- 🔥 Build a streak. Keep getting answers right to earn bonus points.
- ❤️ Try to survive. You get three lives, and the questions get tougher as you go.
- 📓 Check your Bench Log. Look back at saved runs and previous answers.
- ⚡ Keep the game moving. Questions can be prepared ahead of time to reduce waiting between rounds.
🎮 How to play
1. Choose a sport category.
2. Start a run and read the prompt.
3. Think of an answer that fits. Try not to go with the obvious one.
4. Submit your answer. In timed mode, you'll need to beat the 25-second clock.
5. The AI referee checks your answer and gives it a rarity tier.
6. Earn points, build your streak, and keep going for as long as you can.
Getting an answer wrong, skipping a prompt, or running out of time costs you a life. Lose all three and your run is over.
🏆 Rarity levels and points
Not all answers are worth the same amount. Common answers earn fewer points, while the really deep cuts can earn a lot more.
Tier	Base points	What it means
🥉 Rookie	100	A pretty common answer
🥈 Starter	250	A familiar answer
⭐ All-Star	500	A less obvious answer
💎 Deep Cut	1,000	An answer that takes some real sports knowledge
👑 Mythic	2,000	An extremely obscure answer


You can also earn a streak bonus: 50 extra points for each current streak, up to a maximum of 500 bonus points.
📈 It gets harder as you go
The minimum rarity you need increases as your run gets longer.
Rounds	Minimum accepted rarity
1–15	Rookie
16–30	Starter
31–45	All-Star
46–60	Deep Cut
61+	Mythic


By the later rounds, the obvious answers won't cut it anymore.
🏅 Pick your sport
Choose a category and test what you know:
- 🌎 All Sports
- 🏀 Basketball
- 🏈 American Football
- ⚾ Baseball
- ⚽ Soccer
- 🏐 Volleyball & Court (tennis, badminton, pickleball, and squash)
- 🏒 Hockey
- 🥊 Combat & Olympic (boxing, MMA, wrestling, track and field, swimming, gymnastics, and Olympic events)
🛠️ Built with
Here's what's powering the project:
- React 19 and TypeScript for the app
- Vite for the frontend and development setup
- Express for the server and API
- Google Gemini API (Gemini 3.8 Flash) for generating questions and checking answers
- Wikipedia API for extra fact-checking context when needed
- Tailwind CSS 4 for styling
- Motion for animations
- Lucide React for icons
- Bun for the dependency lockfile
🚀 Run it on your computer
Want to try it locally or work on the project? Here's how to get started.
📋 What you'll need
- Node.js (a current LTS version is recommended) or Bun
- A Gemini API key
- Git
1. 📥 Clone the repository
git clone https://github.com/Jammy7890/Deep-Bench-Sports-Krillion-.git
cd Deep-Bench-Sports-Krillion-
2. 📦 Install the dependencies
Using npm:
npm install
Or using Bun:
bun install
3. 🔑 Set up your Gemini API key
Create a .env file in the project's main folder. You can copy .env.example and add your key:
GEMINI_API_KEY=your_groq_api_key_here
Create a free API key at https://aistudio.google.com/apikey.

🔒 Keep your API key private. Don't upload your .env file to GitHub or put your key in frontend code. The .env.example file is just a template.
4. ▶️ Start the app
Using npm:
npm run dev
Or using Bun:
bun run dev
Then open http://localhost:3000 in your browser.

During development, Express runs Vite in middleware mode. In production, the server serves the built frontend.
⚙️ Useful commands
Command	What it does
npm run dev	Starts the development server
npm run build	Builds the frontend
npm run preview	Previews the production build
npm run lint	Runs the TypeScript check
npm run clean	Removes generated build/server output


🔌 API endpoints
The app currently has two main API endpoints:
🎯 POST /api/questions/batch
Creates a batch of sports prompts for the category you choose.

Example request:
{
  "category": "Baseball",
  "count": 4,
  "previousPrompts": []
}
The server allows between 1 and 6 questions per batch. Previous prompts are included to help avoid getting the same questions again.
🧠 POST /api/evaluate
Checks an answer against the current prompt. The request can include the prompt, sport, subcategory, answer, current streak, minimum rarity, and example answers.

The response includes whether the answer is accepted, its rarity, points, streak bonus, a referee note, and a canonical answer when accepted.
🤖 A note about the AI referee
Google's Gemini 3.8 Flash model generates prompts and evaluates submitted answers. The server uses Gemini's structured JSON output so referee results match the format the game expects.

For some answers, the referee can also look up short Wikipedia extracts for extra context. This can help with facts about players, awards, records, and other sports details.

One thing to keep in mind: rarity and pick-rate values are AI estimates, not results from an actual survey. Wikipedia checks can help, but they don't guarantee that every decision is correct. The AI referee is there to run the game, not replace an official sports database.

You'll need a Gemini API key. Gemini 3.8 Flash has a free tier with limits that vary by model and account. Check Google AI Studio's Rate limits page for your project's exact quota. On the free tier, Google may use submitted content to improve its products.
📁 Project layout
.
├── src/
│   ├── components/       # Game screens and interface components
│   ├── utils/            # Sound and local run-storage utilities
│   ├── App.tsx            # Main game state and gameplay flow
│   ├── main.tsx           # React entry point
│   └── types.ts           # Game types, rarity tiers, and scoring config
├── .env.example           # Environment variable template
├── index.html
├── package.json
├── server.ts              # Express API and Gemini integration
├── tsconfig.json
└── vite.config.ts
🚧 Project status
Deep Bench Sports is still being worked on, so things may change as new features are added and existing ones are improved.
🤝 Want to contribute?
Found a bug or have an idea that could make the game better? Feel free to open an issue or submit a pull request on GitHub.
🙌 Credits
Made by @Jammy7890.

Inspired by Krillion's rarity-based answer format, with a sports twist.
🏀 Know the obvious. Respect the deep cuts. Chase the Mythic.
