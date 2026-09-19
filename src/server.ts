import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import router from "./routes/route";



dotenv.config();

if (!process.env.WEBHOOK_SECRET) {
  throw new Error('WEBHOOK_SECRET não configurada no .env');
}

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json({ verify: (req: any, _res, buf: Buffer) => { req.rawBody = buf; } }));

app.use(router);

app.use((erro: any, req: Request, res: Response, next: NextFunction) => {//middleware
  return res.status(500).json({
    mensagem: "Erro interno do servidor"
  });
});

// // Main HTML Page (Rich Design Aesthetics)
// app.get('/', async (req: Request, res: Response) => {
//   let databaseStatus = 'Pending (DB URL configuration required)';
//   let usersCount = 0;

//   try {
//     // Try to query count to check if connection works
//     usersCount = await prisma.user.count();
//     databaseStatus = 'Connected';
//   } catch (error: any) {
//     databaseStatus = `Disconnected (${error.message || 'Check database connection'})`;
//   }

//   res.send(`
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>TypeScript Express App</title>
//       <link rel="preconnect" href="https://fonts.googleapis.com">
//       <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
//       <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
//       <style>
//         :root {
//           --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
//           --card-bg: rgba(30, 41, 59, 0.7);
//           --card-border: rgba(255, 255, 255, 0.08);
//           --text-primary: #f8fafc;
//           --text-secondary: #94a3b8;
//           --accent-success: #10b981;
//           --accent-error: #ef4444;
//           --accent-primary: #6366f1;
//         }

//         * {
//           box-sizing: border-box;
//           margin: 0;
//           padding: 0;
//         }

//         body {
//           font-family: 'Plus Jakarta Sans', sans-serif;
//           background: var(--bg-gradient);
//           color: var(--text-primary);
//           min-height: 100vh;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 2rem;
//         }

//         .container {
//           max-width: 600px;
//           width: 100%;
//           background: var(--card-bg);
//           border: 1px solid var(--card-border);
//           backdrop-filter: blur(16px);
//           border-radius: 24px;
//           padding: 2.5rem;
//           box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
//           text-align: center;
//           animation: fadeIn 0.8s ease-out;
//         }

//         @keyframes fadeIn {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }

//         .badge {
//           display: inline-block;
//           padding: 0.5rem 1rem;
//           border-radius: 9999px;
//           font-size: 0.875rem;
//           font-weight: 600;
//           margin-bottom: 1.5rem;
//           background: rgba(99, 102, 241, 0.15);
//           color: var(--accent-primary);
//           border: 1px solid rgba(99, 102, 241, 0.3);
//         }

//         h1 {
//           font-size: 2.25rem;
//           font-weight: 700;
//           margin-bottom: 1rem;
//           letter-spacing: -0.025em;
//           background: linear-gradient(to right, #ffffff, #c7d2fe);
//           -webkit-background-clip: text;
//           -webkit-text-fill-color: transparent;
//         }

//         p.subtitle {
//           color: var(--text-secondary);
//           margin-bottom: 2.5rem;
//           font-size: 1.1rem;
//         }

//         .status-grid {
//           display: grid;
//           grid-template-columns: 1fr;
//           gap: 1rem;
//           margin-bottom: 2.5rem;
//           text-align: left;
//         }

//         .status-card {
//           background: rgba(15, 23, 42, 0.4);
//           border: 1px solid var(--card-border);
//           border-radius: 16px;
//           padding: 1.25rem;
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           transition: transform 0.2s ease, border-color 0.2s ease;
//         }

//         .status-card:hover {
//           transform: translateY(-2px);
//           border-color: rgba(99, 102, 241, 0.2);
//         }

//         .status-info {
//           display: flex;
//           flex-direction: column;
//           gap: 0.25rem;
//         }

//         .status-label {
//           font-size: 0.875rem;
//           color: var(--text-secondary);
//           text-transform: uppercase;
//           letter-spacing: 0.05em;
//         }

//         .status-value {
//           font-weight: 600;
//           font-size: 1.1rem;
//         }

//         .indicator {
//           width: 12px;
//           height: 12px;
//           border-radius: 50%;
//           display: inline-block;
//         }

//         .indicator.online {
//           background: var(--accent-success);
//           box-shadow: 0 0 12px var(--accent-success);
//         }

//         .indicator.offline {
//           background: var(--accent-error);
//           box-shadow: 0 0 12px var(--accent-error);
//         }

//         .indicator.pending {
//           background: #eab308;
//           box-shadow: 0 0 12px #eab308;
//         }

//         .footer {
//           margin-top: 2rem;
//           font-size: 0.875rem;
//           color: var(--text-secondary);
//         }

//         .code-link {
//           color: var(--accent-primary);
//           text-decoration: none;
//           font-weight: 500;
//           transition: color 0.2s;
//         }

//         .code-link:hover {
//           color: #818cf8;
//           text-decoration: underline;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <span class="badge">Express + TypeScript + Prisma + MySQL</span>
//         <h1>Server is Running</h1>
//         <p class="subtitle">Your development backend environment is ready to build.</p>

//         <div class="status-grid">
//           <div class="status-card">
//             <div class="status-info">
//               <span class="status-label">Express Server</span>
//               <span class="status-value">Listening on port ${PORT}</span>
//             </div>
//             <span class="indicator online"></span>
//           </div>

//           <div class="status-card">
//             <div class="status-info">
//               <span class="status-label">Database Connection</span>
//               <span class="status-value" style="font-size: 0.95rem; word-break: break-all;">${databaseStatus}</span>
//             </div>
//             <span class="indicator ${databaseStatus === 'Connected' ? 'online' : (databaseStatus.startsWith('Pending') ? 'pending' : 'offline')}"></span>
//           </div>

//           <div class="status-card">
//             <div class="status-info">
//               <span class="status-label">Database Users Count</span>
//               <span class="status-value">${usersCount} users registered</span>
//             </div>
//             <span class="indicator ${databaseStatus === 'Connected' ? 'online' : 'offline'}"></span>
//           </div>
//         </div>

//         <div class="footer">
//           Try accessing the JSON API: <a class="code-link" href="/api/users">/api/users</a>
//         </div>
//       </div>
//     </body>
//     </html>
//   `);
// });

// // JSON API Route: Get Users
// app.get('/api/users', async (req: Request, res: Response) => {
//   try {
//     const users = await prisma.user.findMany();
//     res.json(users);
//   } catch (error: any) {
//     res.status(500).json({ error: error.message || 'Database query failed' });
//   }
// });

// // JSON API Route: Create User
// app.post('/api/users', async (req: Request, res: Response) => {
//   const { email, name } = req.body;
//   if (!email) {
//     return res.status(400).json({ error: 'Email is required' });
//   }

//   try {
//     const user = await prisma.user.create({
//       data: { email, name },
//     });
//     res.status(201).json(user);
//   } catch (error: any) {
//     res.status(500).json({ error: error.message || 'Failed to create user' });
//   }
// });

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
