import { Octokit } from 'octokit';
import { saveAs } from 'file-saver';
import { useAuthStore } from '../store/authStore';

let octokit: Octokit | null = null;

export const initGitHub = (token: string) => {
  octokit = new Octokit({ auth: token });
};

export const getOctokit = () => {
  if (!octokit) throw new Error('Octokit not initialized');
  return octokit;
};

export const searchUsers = async (query: string) => {
  const client = getOctokit();
  const { data } = await client.rest.search.users({ q: query, per_page: 5 });
  return data.items;
};

export const listInvitations = async () => {
  const client = getOctokit();
  const { data } = await client.rest.repos.listInvitationsForAuthenticatedUser();
  return data;
};

export const acceptInvitation = async (invitation_id: number) => {
  const client = getOctokit();
  await client.rest.repos.acceptInvitationForAuthenticatedUser({ invitation_id });
};

export const declineInvitation = async (invitation_id: number) => {
  const client = getOctokit();
  await client.rest.repos.declineInvitationForAuthenticatedUser({ invitation_id });
};

export const fetchUserEvents = async (username: string) => {
  const client = getOctokit();
  const { data } = await client.rest.activity.listPublicEventsForUser({
    username,
    per_page: 20,
  });
  return data;
};

export interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  archived: boolean;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  size: number;
  description: string | null;
  homepage: string | null;
  default_branch: string;
  owner: {
    login: string;
  };
}

export const fetchAllRepos = async (): Promise<Repo[]> => {
  const client = getOctokit();
  const repos: Repo[] = [];
  let page = 1;
  const per_page = 100;

  while (true) {
    const response = await client.rest.repos.listForAuthenticatedUser({
      visibility: 'all',
      affiliation: 'owner,collaborator,organization_member',
      per_page,
      page,
      sort: 'updated',
    });

    if (response.data.length === 0) break;
    repos.push(...(response.data as any));
    if (response.data.length < per_page) break;
    page++;
  }

  return repos;
};

export const updateRepoVisibility = async (owner: string, repo: string, isPrivate: boolean) => {
  const client = getOctokit();
  await client.rest.repos.update({
    owner,
    repo,
    private: isPrivate,
  });
};

export const renameRepo = async (owner: string, repo: string, newName: string) => {
  const client = getOctokit();
  await client.rest.repos.update({
    owner,
    repo,
    name: newName,
  });
};

export const updateRepoArchived = async (owner: string, repo: string, archived: boolean) => {
  const client = getOctokit();
  await client.rest.repos.update({
    owner,
    repo,
    archived,
  });
};

export const transferRepo = async (owner: string, repo: string, new_owner: string) => {
  const client = getOctokit();
  await client.rest.repos.transfer({
    owner,
    repo,
    new_owner,
  });
};

export const deleteRepo = async (owner: string, repo: string) => {
  const client = getOctokit();
  await client.rest.repos.delete({
    owner,
    repo,
  });
};

export const leaveRepo = async (owner: string, repo: string, username: string) => {
  const client = getOctokit();
  await client.rest.repos.removeCollaborator({
    owner,
    repo,
    username,
  });
};

export const fetchRepoCollaborators = async (owner: string, repo: string) => {
  const client = getOctokit();
  const { data } = await client.rest.repos.listCollaborators({
    owner,
    repo,
  });
  return data;
};

export const addRepoCollaborator = async (owner: string, repo: string, username: string) => {
  const client = getOctokit();
  await client.rest.repos.addCollaborator({
    owner,
    repo,
    username,
    permission: 'push',
  });
};

export const removeRepoCollaborator = async (owner: string, repo: string, username: string) => {
  const client = getOctokit();
  await client.rest.repos.removeCollaborator({
    owner,
    repo,
    username,
  });
};

export const fetchRepoInvitations = async (owner: string, repo: string) => {
  const client = getOctokit();
  const { data } = await client.rest.repos.listInvitations({
    owner,
    repo,
  });
  return data;
};

export const cancelRepoInvitation = async (owner: string, repo: string, invitationId: number) => {
  const client = getOctokit();
  await client.rest.repos.deleteInvitation({
    owner,
    repo,
    invitation_id: invitationId,
  });
};

export const fetchAuthenticatedUserFollowing = async () => {
  const client = getOctokit();
  const { data } = await client.rest.users.listFollowedByAuthenticated({
    per_page: 100,
  });
  return data;
};

export const downloadRepoZip = async (owner: string, repo: string, defaultBranch: string = 'main') => {
  const token = useAuthStore.getState().token;
  if (!token) return;

  try {
    const response = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, repo, token, branch: defaultBranch }),
    });

    if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);

    const blob = await response.blob();
    saveAs(blob, `${repo}-${defaultBranch}.zip`);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

export const fetchRepoLanguages = async (owner: string, repo: string): Promise<Record<string, number>> => {
  const client = getOctokit();
  const { data } = await client.rest.repos.listLanguages({
    owner,
    repo,
  });
  return data;
};

