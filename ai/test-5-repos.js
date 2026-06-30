import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { analyzeRepository } from './backend/services/llmService.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const repos = [
  {
    name: "Repo 1: Node.js/Express + MongoDB REST API",
    structure: {
      name: "express-mongodb-api",
      type: "folder",
      children: [
        { name: "server.js", type: "file" },
        { name: "package.json", type: "file" },
        {
          name: "routes",
          type: "folder",
          children: [
            { name: "authRoutes.js", type: "file" },
            { name: "userRoutes.js", type: "file" }
          ]
        },
        {
          name: "controllers",
          type: "folder",
          children: [
            { name: "authController.js", type: "file" }
          ]
        },
        {
          name: "models",
          type: "folder",
          children: [
            { name: "User.js", type: "file" }
          ]
        },
        {
          name: "middleware",
          type: "folder",
          children: [
            { name: "authMiddleware.js", type: "file" }
          ]
        }
      ]
    }
  },
  {
    name: "Repo 2: Next.js/React Fullstack (TypeScript) + Prisma + Stripe",
    structure: {
      name: "nextjs-prisma-stripe-app",
      type: "folder",
      children: [
        { name: "next.config.js", type: "file" },
        { name: "package.json", type: "file" },
        { name: "tsconfig.json", type: "file" },
        {
          name: "app",
          type: "folder",
          children: [
            { name: "page.tsx", type: "file" },
            { name: "layout.tsx", type: "file" },
            {
              name: "api",
              type: "folder",
              children: [
                {
                  name: "auth",
                  type: "folder",
                  children: [
                    {
                      name: "[...nextauth]",
                      type: "folder",
                      children: [
                        { name: "route.ts", type: "file" }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          name: "components",
          type: "folder",
          children: [
            { name: "Navbar.tsx", type: "file" }
          ]
        },
        {
          name: "prisma",
          type: "folder",
          children: [
            { name: "schema.prisma", type: "file" }
          ]
        },
        {
          name: "utils",
          type: "folder",
          children: [
            { name: "stripe.ts", type: "file" }
          ]
        }
      ]
    }
  },
  {
    name: "Repo 3: Python/Django Backend (Postgres + JWT)",
    structure: {
      name: "django-postgres-api",
      type: "folder",
      children: [
        { name: "manage.py", type: "file" },
        { name: "requirements.txt", type: "file" },
        {
          name: "myproject",
          type: "folder",
          children: [
            { name: "settings.py", type: "file" },
            { name: "urls.py", type: "file" }
          ]
        },
        {
          name: "myapp",
          type: "folder",
          children: [
            { name: "models.py", type: "file" },
            { name: "views.py", type: "file" },
            { name: "serializers.py", type: "file" }
          ]
        }
      ]
    }
  },
  {
    name: "Repo 4: Vite/React SPA + Tailwind (No Backend/DB)",
    structure: {
      name: "vite-react-spa",
      type: "folder",
      children: [
        { name: "vite.config.js", type: "file" },
        { name: "package.json", type: "file" },
        { name: "tailwind.config.js", type: "file" },
        {
          name: "src",
          type: "folder",
          children: [
            { name: "main.jsx", type: "file" },
            { name: "App.jsx", type: "file" },
            {
              name: "components",
              type: "folder",
              children: [
                { name: "Navbar.jsx", type: "file" }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    name: "Repo 5: Java/Spring Boot Backend (MySQL + Spring Security)",
    structure: {
      name: "springboot-mysql-app",
      type: "folder",
      children: [
        { name: "pom.xml", type: "file" },
        {
          name: "src",
          type: "folder",
          children: [
            {
              name: "main",
              type: "folder",
              children: [
                {
                  name: "java",
                  type: "folder",
                  children: [
                    {
                      name: "com",
                      type: "folder",
                      children: [
                        {
                          name: "example",
                          type: "folder",
                          children: [
                            {
                              name: "demo",
                              type: "folder",
                              children: [
                                { name: "DemoApplication.java", type: "file" },
                                {
                                  name: "controller",
                                  type: "folder",
                                  children: [
                                    { name: "UserController.java", type: "file" }
                                  ]
                                },
                                {
                                  name: "model",
                                  type: "folder",
                                  children: [
                                    { name: "User.java", type: "file" }
                                  ]
                                },
                                {
                                  name: "config",
                                  type: "folder",
                                  children: [
                                    { name: "SecurityConfig.java", type: "file" }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "resources",
                  type: "folder",
                  children: [
                    { name: "application.properties", type: "file" }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
];

async function testRepos() {
  console.log(`=======================================================`);
  console.log(`🚀 STARTING MULTI-REPO VERIFICATION (5 CODESPACE SCENARIOS)`);
  console.log(`=======================================================\n`);

  for (const repo of repos) {
    console.log(`-------------------------------------------------------`);
    console.log(`Testing: ${repo.name}`);
    console.log(`-------------------------------------------------------`);

    for (const provider of ['gemini', 'groq']) {
      console.log(`>> Running analysis with provider: [${provider.toUpperCase()}]`);
      try {
        const response = await analyzeRepository({
          repositoryStructure: repo.structure,
          provider: provider
        });

        console.log(`   ✅ Success! Metadata Detected:`);
        console.log(`      - 🚀 Summary: ${response.summary}`);
        console.log(`      - 📌 Entry Point: ${response.entryPoint}`);
        console.log(`      - 💻 Framework: ${response.framework}`);
        console.log(`      - 💾 Database: ${response.database}`);
        console.log(`      - 🔒 Authentication: ${response.authentication}`);
        console.log(`      - 🌐 External APIs: [${response.externalAPIs.join(', ')}]`);
        console.log(`      - 🛠️ Tech Stack: [${response.techStack.join(', ')}]`);
        console.log(`      - 📁 Modules Count: ${response.modules.length}`);
        console.log(`      - 🔵 Nodes Count: ${response.nodes.length}`);
        console.log(`      - 🔗 Edges Count: ${response.edges.length}`);
      } catch (error) {
        console.error(`   ❌ Failed to analyze ${repo.name} with ${provider}:`, error.message);
      }
    }
    console.log();
  }
}

testRepos();
