# GitHub Contribution Tracker

A web application to track and visualize GitHub contributions for a
specified user and date range.

Demo:
[https://sveltekit-github-stats.vercel.app/](https://sveltekit-github-stats.vercel.app/)

## Technologies Used

- [Svelte 5](https://svelte.dev/blog/svelte-5-preview) - The next
  major version of the Svelte framework
- [SvelteKit](https://kit.svelte.dev/) - The official Svelte
  application framework
- [TypeScript](https://www.typescriptlang.org/) - Typed superset of
  JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
  framework
- [DaisyUI](https://daisyui.com/) - Tailwind CSS component library
- [GitHub API](https://docs.github.com/en/rest) - For fetching user
  contribution data

## Features

- Fetch GitHub contributions for a specified username
- Filter contributions by date range (today, specific year, or custom
  range)
- Display total commit count and list of contributed repositories
- Sort repositories by most recently updated
- Responsive design with DaisyUI components
- Loading spinner for better user experience during data fetching

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/github-contribution-tracker.git
   ```

2. Install dependencies:

   ```bash
   cd github-contribution-tracker
   npm install
   ```

3. Create a `.env` file in the root directory and add your GitHub
   token:

   ```env
   GITHUB_TOKEN=your_github_token_here
   ```

4. Start the development server:

   ```bash
   pnpm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`
