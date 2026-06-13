<div align="center">

# ⬡ Smart Call Routing System

**Production-grade call center routing engine — skill-based routing, load balancing, priority queues, and a live dashboard.**

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

</div>

---

## Overview

Smart Call Routing System simulates how enterprise contact centers intelligently route inbound calls to agents. It demonstrates core backend engineering patterns: service-layer architecture, REST API design, priority queue management, and event-driven state transitions.

Built as a portfolio project to showcase system design thinking, clean code structure, and deployment-ready practices.

---

## Features

- **Skill-Based Routing** — matches calls to agents by required skill
- **Load Balancing** — assigns to least-loaded available agent
- **Capacity Control** — respects each agent's configurable max capacity
- **Priority Queue** — urgent > high > medium > low call ordering
- **Waiting Queue** — holds calls when all matching agents are busy
- **Fallback Queue** — captures calls with no matching skill agent
- **Auto Queue Processing** — reassigns queued calls when agents free up
- **Live Dashboard** — Vercel-style UI with real-time refresh
- **Structured Logging** — JSON logs with level filtering
- **Docker Ready** — multi-stage Dockerfile + compose

---

## Architecture

```mermaid
graph TD
    Client([Client / Browser]) -->|HTTP| API[Express API Server]
    API --> Agents[Agent Controller]
    API --> Calls[Call Controller]
    API --> Queue[Queue Controller]
    API --> Routing[Routing Engine]
    API --> Dashboard[Dashboard Controller]

    Routing --> AgentSvc[Agent Service]
    Routing --> CallSvc[Call Service]
    Routing --> QueueSvc[Queue Service]

    AgentSvc --> FS1[(agents.json)]
    CallSvc --> FS2[(calls.json)]
    CallSvc --> FS3[(history.json)]
    QueueSvc --> FS4[(queue.json)]

    API --> Static[Static Dashboard\n/dashboard]
```

---

## Routing Flow

```mermaid
flowchart TD
    A[Incoming Call] --> B{Find agents\nwith required skill}
    B -->|No match| C[Fallback Queue]
    B -->|Match found| D{Any available\nunder capacity?}
    D -->|No| E[Waiting Queue\npriority-ordered]
    D -->|Yes| F[Select least-loaded\nagent]
    F --> G[Assign Call → Active]
    G --> H[Call Ends]
    H --> I[Release Agent]
    I --> J{Queued calls\nfor agent skills?}
    J -->|Yes| F
    J -->|No| K[Agent Available]
```

---

## API Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express Router
    participant R as Routing Engine
    participant AS as Agent Service
    participant CS as Call Service
    participant QS as Queue Service

    C->>API: POST /api/calls
    API->>CS: createNewCall(payload)
    CS-->>API: call object
    API->>R: routeCall(call)
    R->>AS: getAllAgents()
    AS-->>R: agents[]
    alt Agent Available
        R->>AS: assignCallToAgent(id)
        R->>CS: saveActiveCall(call)
        R-->>API: { routed: true, agent }
    else Agents Busy
        R->>QS: enqueueWaiting(call)
        R-->>API: { routed: false, queue: "waiting" }
    else No Skill Match
        R->>QS: enqueueFallback(call)
        R-->>API: { routed: false, queue: "fallback" }
    end
    API-->>C: 201 JSON response

    C->>API: POST /api/calls/:id/end
    API->>CS: endCall(id)
    CS-->>API: ended call
    API->>AS: releaseCallFromAgent(id)
    API->>R: processQueueForAgent(id)
    R->>QS: dequeueWaitingForSkill()
    R->>AS: assignCallToAgent()
    API-->>C: 200 + queueProcessed count
```

---

## Folder Structure

```mermaid
graph LR
    ROOT[smart-call-routing-system/]
    ROOT --> SRC[src/]
    ROOT --> DATA[data/]
    ROOT --> DASH[dashboard/]
    ROOT --> FILES[config files]

    SRC --> CTRL[controllers/]
    SRC --> SVC[services/]
    SRC --> RTS[routes/]
    SRC --> MW[middleware/]
    SRC --> MDL[models/]
    SRC --> UTIL[utils/]
    SRC --> APP[app.js]
    SRC --> SRV[server.js]

    CTRL --> C1[agentController.js]
    CTRL --> C2[callController.js]
    CTRL --> C3[queueController.js]
    CTRL --> C4[routingController.js]
    CTRL --> C5[dashboardController.js]

    SVC --> S1[agentService.js]
    SVC --> S2[callService.js]
    SVC --> S3[queueService.js]
    SVC --> S4[routingService.js]

    DATA --> D1[agents.json]
    DATA --> D2[calls.json]
    DATA --> D3[queue.json]
    DATA --> D4[history.json]

    DASH --> H1[index.html]
    DASH --> H2[style.css]
    DASH --> H3[app.js]

    FILES --> F1[Dockerfile]
    FILES --> F2[docker-compose.yml]
    FILES --> F3[.env]
    FILES --> F4[package.json]
```

---

## Installation

### Prerequisites

- Node.js 18+
- npm

### Local Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/smart-call-routing-system.git
cd smart-call-routing-system

# Install dependencies
npm install

# Start the server
npm start
```

Open **http://localhost:3000** for the dashboard.

---

## Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build manually
docker build -t smart-call-routing .
docker run -p 3000:3000 smart-call-routing
```

---

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/agents` | List all agents (filter: `?status=available&skill=billing`) |
| `GET` | `/agents/status` | Agents grouped by status |
| `GET` | `/agents/:id` | Get single agent |
| `POST` | `/agents` | Create agent |
| `PUT` | `/agents/:id` | Update agent |
| `DELETE` | `/agents/:id` | Delete agent |

**Create Agent — Request Body:**
```json
{
  "name": "Jane Smith",
  "skills": ["billing", "general"],
  "maxCapacity": 3
}
```

Valid skills: `billing`, `technical`, `sales`, `general`, `networking`

---

### Calls

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/calls` | Active calls (filter: `?status=active&agentId=x`) |
| `GET` | `/calls/history` | Ended calls |
| `POST` | `/calls` | Create and route a call |
| `POST` | `/calls/:id/end` | End a call, trigger queue processing |

**Create Call — Request Body:**
```json
{
  "customerName": "John Doe",
  "requiredSkill": "technical",
  "priority": "high"
}
```

Valid priorities: `low`, `medium`, `high`, `urgent`

---

### Queue

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/queue` | Full queue snapshot with stats |

---

### Routing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/routing/process` | Force-process entire waiting queue |

---

### Dashboard & Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dashboard/stats` | Aggregated system stats |
| `GET` | `/health` | Service health check |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `NODE_ENV` | `development` | Environment mode |
| `DATA_DIR` | `./data` | JSON data directory |
| `LOG_LEVEL` | `info` | Log level: `debug`/`info`/`warn`/`error` |

---

## Engineering Patterns

| Pattern | Implementation |
|---------|---------------|
| Service Layer | Controllers delegate logic to services |
| Centralized Error Handling | `errorHandler.js` middleware |
| Standardized Responses | `utils/response.js` helpers |
| Request Validation | Model-level validators |
| Structured Logging | JSON logger with levels |
| Atomic File Writes | Temp file + rename strategy |
| Graceful Shutdown | SIGTERM/SIGINT handlers |

---

## Future Enhancements

- [ ] WebSocket live push (no polling)
- [ ] PostgreSQL / Redis persistence
- [ ] JWT authentication
- [ ] Call recording simulation
- [ ] Agent performance metrics & SLA tracking
- [ ] Multi-tenant support
- [ ] Horizontal scaling with Redis queue

---

## Author

Built as a portfolio project demonstrating backend systems design, REST API architecture, and production engineering practices.

---

<div align="center">
  <sub>MIT License</sub>
</div>
