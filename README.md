# typed-sdk-stack

**typed-sdk-stack** is a TypeScript-first monorepo for building strongly-typed SDKs and adapters for **RapidAPI-backed services**.

It provides shared core utilities, consistent client patterns, and strong typing to make working with RapidAPI services predictable, ergonomic, and production-ready.

> ⚠️ This project is **community-built** and **not affiliated with or endorsed by RapidAPI**.

---

## ✨ Goals

* TypeScript-first, JS-compatible SDKs
* Strong typing and predictable APIs
* Shared core for auth, retries, errors, and configuration
* Consistent patterns across all SDKs
* Designed for Node.js, Bun, and modern runtimes

---

## 📦 Monorepo Structure

```
packages/
├─ core            # Shared SDK base, HTTP client, utilities
├─ nba             # NBA-related RapidAPI SDK
├─ odds            # Sports odds SDKs
└─ ...
```

Each package is versioned and published independently.

---

## 🧠 Design Principles

* **Typed by default** – schemas and interfaces first
* **Thin SDKs** – minimal abstraction over real API behavior
* **Composable** – core utilities reused everywhere
* **Unopinionated** – easy to extend or wrap

---

## 🚀 Packages

| Package                                | Description                                         |
| -------------------------------------- | --------------------------------------------------- |
| `@typed-sdk-stack/core`                | Shared base SDK, HTTP client, and utilities         |
| `@typed-sdk-stack/shared-config`       | Shared `tsconfig` + tsup presets for all packages   |
| `@typed-sdk-stack/*`                   | Service-specific RapidAPI SDKs built on the core    |

> See each package README for usage and examples.

---

## 🛠️ Tooling

* TypeScript + shared `tsconfig`/tsup presets (`@typed-sdk-stack/shared-config`)
* Axios-based HTTP client (Bun/Node compatible)
* Runtime-agnostic (Node / Bun / Edge)
* Monorepo tooling (workspaces)

Use the config package to bootstrap new workspaces:

```jsonc
{
  "extends": "@typed-sdk-stack/shared-config/tsconfig.packages.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  }
}
```

All SDKs should favor Axios for HTTP requests. The core package will ship a shared Axios-based client so individual SDKs do not need to wire fetch manually.

---

## 📜 License

MIT

---

## 🤝 Contributing

Contributions are welcome!
Issues, discussions, and PRs should follow the shared patterns defined in the core package.

---

## 🔍 Disclaimer

RapidAPI is a trademark of its respective owner.
This project is **unofficial** and provided for community use.
