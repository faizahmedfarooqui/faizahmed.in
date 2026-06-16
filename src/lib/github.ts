import { FEATURED_REPOS } from "../consts";

export type RepoStats = {
  repo: string;
  url: string;
  description: string;
  blurb: string;
  stars: number;
  forks: number;
};

// Fetch one repo's live stats at build time, falling back to configured values
// if GitHub is unreachable or rate-limited.
async function fetchRepo(
  repo: string,
  blurb: string,
  fallback: { stars: number; forks: number },
): Promise<RepoStats> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        "User-Agent": "faizahmed.in",
        Accept: "application/vnd.github+json",
      },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const d = await res.json();
    return {
      repo,
      url: d.html_url ?? `https://github.com/${repo}`,
      description: d.description ?? "",
      blurb,
      stars: d.stargazers_count ?? fallback.stars,
      forks: d.forks_count ?? fallback.forks,
    };
  } catch {
    return {
      repo,
      url: `https://github.com/${repo}`,
      description: "",
      blurb,
      stars: fallback.stars,
      forks: fallback.forks,
    };
  }
}

export async function getFeaturedRepos(): Promise<RepoStats[]> {
  return Promise.all(
    FEATURED_REPOS.map((r) =>
      fetchRepo(r.repo, r.blurb, { stars: r.fallbackStars, forks: r.fallbackForks }),
    ),
  );
}
