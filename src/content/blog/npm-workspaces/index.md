---
title: "Managing Multiple Packages with npm Workspaces"
datePublished: Wed May 03 2023 10:37:27 GMT+0000 (Coordinated Universal Time)
cuid: clh7kdula000909mh3lndc7jw
slug: npm-workspaces
cover: ./cover.jpg
tags: npm, workspaces, monorepo, npm-workspaces, shared-components
series: scaling-javascript-nodejs

---

npm **Workspaces** is a powerful tool that allows developers to manage multiple packages in a single repository. With npm Workspaces, developers can maintain interdependent packages while ensuring their versioning is kept in sync. This blog will explain the features and APIs of npm Workspaces, as well as how to use them effectively.

## **What are npm Workspaces?**

npm Workspaces is a feature of the Node.js package manager (npm) that allows you to group multiple packages in a single repository. When you use npm Workspaces, each package has its own node\_modules folder, but dependencies that are shared between packages are hoisted to the root node\_modules folder. This means that when a package depends on a shared dependency, it can use the version that is already installed instead of installing its copy.

## **Features of npm Workspaces**

1. **Shared Dependencies:** With npm Workspaces, dependencies that are shared between packages are hoisted to the root node\_modules folder. This reduces duplication and ensures that all packages use the same version of the dependency.
    
2. **Version Synchronization:** npm Workspaces ensures that all packages in the workspace use the same version of a given dependency. This avoids version conflicts and makes it easier to maintain the codebase.
    
3. **Simplified Development Workflow:** npm Workspaces makes it easy to work on multiple packages simultaneously. Developers can run commands across all packages at once, such as installing dependencies or running tests.
    
4. **Monorepo Support:** npm Workspaces is ideal for monorepo architectures, where multiple packages are managed in a single repository.
    

## **APIs of npm Workspaces**

npm Workspaces provides several APIs that developers can use to interact with the workspace.

1. **npm install:** Developers can use the `npm install` command to install dependencies for all packages in the workspace.
    
2. **npm run:** Developers can use the `npm run` command to run scripts across all packages in the workspace. For example, `npm run build` will run the build script in each package.
    
3. **npm link:** Developers can use the `npm link` command to create a symbolic link between packages in the workspace. This makes it easy to test changes to one package in the context of another package.
    
4. **npm publish:** Developers can use the `npm publish` command to publish all packages in the workspace to the npm registry.
    

## **How to Use npm Workspaces**

Here are the steps to set up npm Workspaces:

1. Create a new directory for your workspace.
    
2. Initialize the directory as an npm workspace by running `npm init -w`.
    
3. Create subdirectories for each package in the workspace.
    
4. Initialize each package with `npm init`.
    
5. Add dependencies to each package as needed.
    
6. In the root package.json file, add a `workspaces` key with an array of directories that contain packages. For example:
    

```json
{
  "name": "my-workspace",
  "private": true,
  "workspaces": [
    "packages/*"
  ]
}
```

1. Run `npm install` to install dependencies for all packages in the workspace.
    
2. Use the `npm run` command to run scripts across all packages in the workspace.
    

# Example 1: **Web app with Shared Components**

Suppose you're building a web application with multiple components, and you want to share some code between the components. With npm Workspaces, you can create a workspace with one package for each component and another package for the shared code. Here's what the directory structure might look like:

```bash
my-web-app/
├── package.json
├── packages/
│   ├── component1/
│   ├── component2/
│   └── shared/
```

In the `package.json` file at the root of the workspace, you can specify the workspaces as follows:

```json
{
  "name": "my-web-app",
  "private": true,
  "workspaces": [
    "packages/*"
  ]
}
```

Now, when you run `npm install` in the root directory, npm will install the dependencies for all packages in the workspace. If a package depends on a shared dependency, npm will hoist that dependency to the root `node_modules` folder.

# **Example 2: Monorepo with Shared Utility Functions**

Suppose you're working on a monorepo with several packages that use some common utility functions. With npm Workspaces, you can create a workspace with one package for each project and another package for the utility functions. Here's what the directory structure might look like:

```bash
my-monorepo/
├── package.json
├── packages/
│   ├── project1/
│   ├── project2/
│   └── utils/
```

In the `package.json` file at the root of the workspace, you can specify the workspaces as follows:

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ]
}
```

Now, when you run `npm install` in the root directory, npm will install the dependencies for all packages in the workspace. If a package depends on a shared dependency, npm will hoist that dependency to the root `node_modules` folder. Similarly, if a package depends on a utility function in the `utils` package, npm will install that package in the root `node_modules` folder.

# Conclusion

As these examples demonstrate, npm Workspaces can be a powerful tool for managing multiple packages in a single repository. By reducing duplication and ensuring version synchronization, npm Workspaces can help you avoid version conflicts and maintain a clean codebase. Whether you're working on a monorepo or a web application with shared components, npm Workspaces is worth considering.

---
